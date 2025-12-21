import { create } from 'zustand'
import { gameHelpers, realtimeHelpers } from '../lib/supabase'

const PHASE_DURATIONS = {
  WHISPER: 30,    // See secret word
  HINT_DROP: 60,  // Submit hints
  DEBATE: 120,    // Discussion
  VERDICT: 45,    // Vote
  REVEAL: 15      // Results
}

export const useGameStore = create((set, get) => ({
  // Room data
  room: null,
  roomId: null,
  participants: [],
  
  // Player data
  myUserId: null,
  myUsername: null,
  mySecret: null,
  
  // Game state
  phase: 'WHISPER',
  phaseTimeLeft: PHASE_DURATIONS.WHISPER,
  hints: [],
  votes: [],
  
  // Real-time
  realtimeChannel: null,
  
  // UI state
  isLoading: false,
  error: null,
  
  // Actions
  setRoom: (room) => set({ room, roomId: room?.id }),
  
  setMyInfo: (userId, username) => set({ myUserId: userId, myUsername: username }),
  
  setParticipants: (participants) => set({ participants }),
  
  setMySecret: (secret) => set({ mySecret: secret }),
  
  setPhase: (phase) => set({ 
    phase, 
    phaseTimeLeft: PHASE_DURATIONS[phase] || 0 
  }),
  
  decrementTimer: () => {
    const { phaseTimeLeft, phase } = get()
    if (phaseTimeLeft > 0) {
      set({ phaseTimeLeft: phaseTimeLeft - 1 })
    } else {
      // Auto-advance to next phase
      get().advancePhase()
    }
  },
  
  advancePhase: async () => {
    const { phase, room, myUserId } = get()
    
    const phaseOrder = ['WHISPER', 'HINT_DROP', 'DEBATE', 'VERDICT', 'REVEAL']
    const currentIndex = phaseOrder.indexOf(phase)
    
    if (currentIndex < phaseOrder.length - 1) {
      const nextPhase = phaseOrder[currentIndex + 1]
      set({ phase: nextPhase, phaseTimeLeft: PHASE_DURATIONS[nextPhase] })
    } else {
      // After REVEAL, check game end
      await get().checkAndEndGame()
    }
  },
  
  addHint: (hint) => set((state) => ({ 
    hints: [...state.hints, hint] 
  })),
  
  setHints: (hints) => set({ hints }),
  
  addVote: (vote) => set((state) => ({ 
    votes: [...state.votes, vote] 
  })),
  
  setVotes: (votes) => set({ votes }),
  
  // Initialize game
  initializeGame: async (roomId, userId, username) => {
    set({ isLoading: true, error: null })
    
    try {
      // Set player info
      set({ myUserId: userId, myUsername: username, roomId })
      
      // Fetch room data
      const room = await gameHelpers.getRoom(roomId)
      set({ room })
      
      // Fetch participants
      const participants = await gameHelpers.getParticipants(roomId)
      set({ participants })
      
      // Fetch my secret
      const secret = await gameHelpers.getMySecret(roomId, userId)
      set({ mySecret: secret })
      
      // Start with WHISPER phase
      set({ phase: 'WHISPER', phaseTimeLeft: PHASE_DURATIONS.WHISPER })
      
      // Setup real-time subscriptions
      get().setupRealtime(roomId)
      
      set({ isLoading: false })
    } catch (error) {
      console.error('Failed to initialize game:', error)
      set({ error: error.message, isLoading: false })
    }
  },
  
  // Setup real-time subscriptions
  setupRealtime: (roomId) => {
    const channel = realtimeHelpers.subscribeToRoom(roomId, {
      onRoomUpdate: async (payload) => {
        console.log('Room update:', payload)
        const updatedRoom = payload.new
        set({ room: updatedRoom })
        
        // If game finished, don't update phase
        if (updatedRoom.status === 'FINISHED') {
          return
        }
      },
      
      onParticipantUpdate: async (payload) => {
        console.log('Participant update:', payload)
        const participants = await gameHelpers.getParticipants(roomId)
        set({ participants })
      },
      
      onHintSubmitted: async (payload) => {
        console.log('Hint submitted:', payload)
        const hints = await gameHelpers.getHints(roomId)
        set({ hints })
      },
      
      onVoteSubmitted: async (payload) => {
        console.log('Vote submitted:', payload)
        const votes = await gameHelpers.getVotes(roomId)
        set({ votes })
      }
    })
    
    set({ realtimeChannel: channel })
  },
  
  // Cleanup
  cleanup: () => {
    const { realtimeChannel } = get()
    if (realtimeChannel) {
      realtimeHelpers.unsubscribe(realtimeChannel)
    }
    set({
      room: null,
      roomId: null,
      participants: [],
      myUserId: null,
      myUsername: null,
      mySecret: null,
      phase: 'WHISPER',
      phaseTimeLeft: PHASE_DURATIONS.WHISPER,
      hints: [],
      votes: [],
      realtimeChannel: null,
      isLoading: false,
      error: null
    })
  },
  
  // Submit hint
  submitHint: async (hintText) => {
    const { roomId, myUserId } = get()
    set({ isLoading: true, error: null })
    
    try {
      await gameHelpers.submitHint(roomId, myUserId, hintText)
      set({ isLoading: false })
    } catch (error) {
      console.error('Failed to submit hint:', error)
      set({ error: error.message, isLoading: false })
    }
  },
  
  // Submit vote
  submitVote: async (targetId) => {
    const { roomId, myUserId } = get()
    set({ isLoading: true, error: null })
    
    try {
      await gameHelpers.submitVote(roomId, myUserId, targetId)
      set({ isLoading: false })
    } catch (error) {
      console.error('Failed to submit vote:', error)
      set({ error: error.message, isLoading: false })
    }
  },
  
  // Check and end game
  checkAndEndGame: async () => {
    const { roomId, votes, participants } = get()
    
    try {
      // Calculate vote results
      const { eliminatedId, voteCounts } = await gameHelpers.calculateVoteResults(roomId)
      
      if (eliminatedId) {
        // Eliminate player
        await gameHelpers.eliminatePlayer(roomId, eliminatedId)
        
        // Refresh participants
        const updatedParticipants = await gameHelpers.getParticipants(roomId)
        set({ participants: updatedParticipants })
      }
      
      // Check if game should end
      const endResult = await gameHelpers.checkGameEnd(roomId)
      
      if (endResult.ended) {
        // End game
        await gameHelpers.endGame(roomId, endResult.winner, endResult.traitorId)
      } else {
        // Continue to next round - reset to WHISPER
        set({ 
          phase: 'WHISPER', 
          phaseTimeLeft: PHASE_DURATIONS.WHISPER,
          hints: [],
          votes: []
        })
      }
    } catch (error) {
      console.error('Failed to check game end:', error)
      set({ error: error.message })
    }
  },
  
  // Get alive participants
  getAliveParticipants: () => {
    const { participants } = get()
    return participants.filter(p => p.is_alive)
  },
  
  // Check if I voted
  hasVoted: () => {
    const { votes, myUserId } = get()
    return votes.some(v => v.voter_id === myUserId)
  },
  
  // Check if I submitted hint
  hasSubmittedHint: () => {
    const { hints, myUserId } = get()
    return hints.some(h => h.user_id === myUserId)
  }
}))
