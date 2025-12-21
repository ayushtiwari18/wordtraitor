import { create } from 'zustand'
import { supabase, gameHelpers, realtimeHelpers } from '../lib/supabase'

// Game phases with durations (in seconds)
export const GAME_PHASES = {
  WHISPER: { name: 'WHISPER', duration: 30, next: 'HINT_DROP' },
  HINT_DROP: { name: 'HINT_DROP', duration: 60, next: 'DEBATE' },
  DEBATE: { name: 'DEBATE', duration: 120, next: 'VERDICT' },
  VERDICT: { name: 'VERDICT', duration: 45, next: 'REVEAL' },
  REVEAL: { name: 'REVEAL', duration: 15, next: null }
}

const useGameStore = create((set, get) => ({
  // Room state
  room: null,
  roomId: null,
  participants: [],
  myUserId: null,
  myUsername: null,
  isHost: false,

  // Game state
  gamePhase: null,
  phaseTimer: 0,
  phaseInterval: null,
  mySecret: null, // { role, secret_word }
  hints: [],
  votes: [],
  eliminated: [],
  
  // Real-time
  realtimeChannel: null,
  isConnected: false,
  
  // UI state
  isLoading: false,
  error: null,
  showResults: false,
  gameResults: null,

  // ==========================================
  // INITIALIZATION
  // ==========================================
  
  initializeGuest: () => {
    const guestId = localStorage.getItem('guestId') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const guestUsername = localStorage.getItem('guestUsername') || `Player${Math.floor(Math.random() * 9999)}`
    
    localStorage.setItem('guestId', guestId)
    localStorage.setItem('guestUsername', guestUsername)
    
    set({ myUserId: guestId, myUsername: guestUsername })
    return { guestId, guestUsername }
  },

  // ==========================================
  // ROOM MANAGEMENT
  // ==========================================
  
  createRoom: async (gameMode, difficulty, wordPack) => {
    set({ isLoading: true, error: null })
    
    try {
      const { guestId, guestUsername } = get().initializeGuest()
      
      const room = await gameHelpers.createRoom(guestId, guestUsername, gameMode, difficulty, wordPack)
      
      set({ 
        room, 
        roomId: room.id,
        isHost: true,
        isLoading: false
      })
      
      // Start real-time subscription
      get().subscribeToRoom(room.id)
      
      return room
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  joinRoom: async (roomCode) => {
    set({ isLoading: true, error: null })
    
    try {
      const { guestId, guestUsername } = get().initializeGuest()
      
      const { room } = await gameHelpers.joinRoom(roomCode, guestId, guestUsername)
      
      set({ 
        room, 
        roomId: room.id,
        isHost: false,
        isLoading: false
      })
      
      // Start real-time subscription
      get().subscribeToRoom(room.id)
      
      return room
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  loadRoom: async (roomId) => {
    set({ isLoading: true, error: null })
    
    try {
      const { guestId } = get().initializeGuest()
      
      const room = await gameHelpers.getRoom(roomId)
      const participants = await gameHelpers.getParticipants(roomId)
      
      set({ 
        room, 
        roomId,
        participants,
        isHost: room.host_id === guestId,
        isLoading: false
      })
      
      // Subscribe to real-time updates
      get().subscribeToRoom(roomId)
      
      return room
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  leaveRoom: async () => {
    const { roomId, myUserId, realtimeChannel } = get()
    
    try {
      if (roomId && myUserId) {
        await gameHelpers.leaveRoom(roomId, myUserId)
      }
      
      // Unsubscribe from real-time
      if (realtimeChannel) {
        realtimeHelpers.unsubscribe(realtimeChannel)
      }
      
      // Clear phase timer
      const { phaseInterval } = get()
      if (phaseInterval) {
        clearInterval(phaseInterval)
      }
      
      // Reset store
      set({
        room: null,
        roomId: null,
        participants: [],
        isHost: false,
        gamePhase: null,
        phaseTimer: 0,
        phaseInterval: null,
        mySecret: null,
        hints: [],
        votes: [],
        eliminated: [],
        realtimeChannel: null,
        isConnected: false,
        showResults: false,
        gameResults: null
      })
    } catch (error) {
      console.error('Error leaving room:', error)
    }
  },

  // ==========================================
  // GAME FLOW
  // ==========================================
  
  startGame: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const { roomId, participants } = get()
      
      if (participants.length < 3) {
        throw new Error('Need at least 3 players to start')
      }
      
      // Update room status
      await gameHelpers.startGame(roomId)
      
      // Assign roles and words
      const { room } = get()
      await gameHelpers.assignRoles(roomId, participants, room.difficulty, room.word_pack)
      
      // Load my secret
      const { myUserId } = get()
      const mySecret = await gameHelpers.getMySecret(roomId, myUserId)
      
      set({ 
        mySecret,
        gamePhase: 'WHISPER',
        isLoading: false
      })
      
      // Start phase timer
      get().startPhaseTimer('WHISPER')
      
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  startPhaseTimer: (phaseName) => {
    const phase = GAME_PHASES[phaseName]
    if (!phase) return
    
    // Clear existing timer
    const { phaseInterval } = get()
    if (phaseInterval) {
      clearInterval(phaseInterval)
    }
    
    let timeLeft = phase.duration
    set({ phaseTimer: timeLeft })
    
    const interval = setInterval(() => {
      timeLeft -= 1
      set({ phaseTimer: timeLeft })
      
      if (timeLeft <= 0) {
        clearInterval(interval)
        get().advancePhase()
      }
    }, 1000)
    
    set({ phaseInterval: interval })
  },

  advancePhase: async () => {
    const { gamePhase, roomId } = get()
    const currentPhase = GAME_PHASES[gamePhase]
    
    if (!currentPhase?.next) {
      // Game round complete, check win conditions
      await get().checkWinConditions()
      return
    }
    
    set({ gamePhase: currentPhase.next })
    
    // Load data for new phase
    if (currentPhase.next === 'DEBATE') {
      await get().loadHints()
    } else if (currentPhase.next === 'REVEAL') {
      await get().loadVotes()
    }
    
    // Start timer for next phase
    get().startPhaseTimer(currentPhase.next)
  },

  skipPhase: async () => {
    const { phaseInterval } = get()
    if (phaseInterval) {
      clearInterval(phaseInterval)
    }
    await get().advancePhase()
  },

  // ==========================================
  // HINTS
  // ==========================================
  
  submitHint: async (hintText) => {
    const { roomId, myUserId } = get()
    
    try {
      await gameHelpers.submitHint(roomId, myUserId, hintText)
      await get().loadHints()
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  loadHints: async () => {
    const { roomId } = get()
    
    try {
      const hints = await gameHelpers.getHints(roomId)
      set({ hints })
    } catch (error) {
      console.error('Error loading hints:', error)
    }
  },

  // ==========================================
  // VOTING
  // ==========================================
  
  submitVote: async (targetId) => {
    const { roomId, myUserId } = get()
    
    try {
      await gameHelpers.submitVote(roomId, myUserId, targetId)
      await get().loadVotes()
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  loadVotes: async () => {
    const { roomId } = get()
    
    try {
      const votes = await gameHelpers.getVotes(roomId)
      set({ votes })
    } catch (error) {
      console.error('Error loading votes:', error)
    }
  },

  // ==========================================
  // WIN CONDITIONS
  // ==========================================
  
  checkWinConditions: async () => {
    const { roomId } = get()
    
    try {
      // Calculate vote results
      const { eliminatedId, voteCounts } = await gameHelpers.calculateVoteResults(roomId)
      
      if (eliminatedId) {
        // Eliminate player
        await gameHelpers.eliminatePlayer(roomId, eliminatedId)
        
        // Add to eliminated list
        const { eliminated } = get()
        set({ eliminated: [...eliminated, eliminatedId] })
      }
      
      // Check if game should end
      const gameEnd = await gameHelpers.checkGameEnd(roomId)
      
      if (gameEnd.ended) {
        // End game
        const results = await gameHelpers.endGame(roomId, gameEnd.winner, gameEnd.traitorId)
        
        set({ 
          showResults: true,
          gameResults: {
            ...results,
            winner: gameEnd.winner,
            traitorId: gameEnd.traitorId,
            voteCounts
          }
        })
        
        // Clear timer
        const { phaseInterval } = get()
        if (phaseInterval) {
          clearInterval(phaseInterval)
        }
      } else {
        // Continue to next round - restart from WHISPER
        set({ 
          gamePhase: 'WHISPER',
          hints: [],
          votes: []
        })
        get().startPhaseTimer('WHISPER')
      }
      
    } catch (error) {
      console.error('Error checking win conditions:', error)
      set({ error: error.message })
    }
  },

  // ==========================================
  // REAL-TIME SUBSCRIPTIONS
  // ==========================================
  
  subscribeToRoom: (roomId) => {
    const channel = realtimeHelpers.subscribeToRoom(roomId, {
      onRoomUpdate: (payload) => {
        const { room } = get()
        
        if (payload.eventType === 'UPDATE') {
          const updatedRoom = payload.new
          set({ room: updatedRoom })
          
          // If game started by host, sync phase
          if (room?.status === 'LOBBY' && updatedRoom.status === 'PLAYING') {
            get().syncGameStart()
          }
        }
      },
      
      onParticipantUpdate: async (payload) => {
        const { roomId } = get()
        const participants = await gameHelpers.getParticipants(roomId)
        set({ participants })
      },
      
      onHintSubmitted: async (payload) => {
        await get().loadHints()
      },
      
      onVoteSubmitted: async (payload) => {
        await get().loadVotes()
      }
    })
    
    set({ realtimeChannel: channel, isConnected: true })
  },

  syncGameStart: async () => {
    const { roomId, myUserId } = get()
    
    try {
      // Load my secret
      const mySecret = await gameHelpers.getMySecret(roomId, myUserId)
      
      set({ 
        mySecret,
        gamePhase: 'WHISPER'
      })
      
      // Start phase timer
      get().startPhaseTimer('WHISPER')
      
    } catch (error) {
      console.error('Error syncing game start:', error)
    }
  },

  // ==========================================
  // HELPERS
  // ==========================================
  
  getMyParticipant: () => {
    const { participants, myUserId } = get()
    return participants.find(p => p.user_id === myUserId)
  },

  isMyTurn: () => {
    const { gamePhase, myUserId, hints, votes } = get()
    
    if (gamePhase === 'HINT_DROP') {
      return !hints.some(h => h.user_id === myUserId)
    }
    
    if (gamePhase === 'VERDICT') {
      return !votes.some(v => v.voter_id === myUserId)
    }
    
    return false
  },

  getAliveParticipants: () => {
    const { participants } = get()
    return participants.filter(p => p.is_alive)
  },

  clearError: () => set({ error: null })
}))

export default useGameStore