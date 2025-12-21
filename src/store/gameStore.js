import { create } from 'zustand'
import { gameHelpers, realtimeHelpers } from '@/lib/supabase'

// Game phases
export const GAME_PHASES = {
  WHISPER: 'WHISPER',           // 30s - See secret word
  HINT_DROP: 'HINT_DROP',       // 60s - Submit hints
  DEBATE: 'DEBATE',             // 120s - Discuss
  VERDICT: 'VERDICT',           // 45s - Vote
  REVEAL: 'REVEAL'              // 15s - Results
}

// Phase durations (seconds)
export const PHASE_DURATIONS = {
  WHISPER: 30,
  HINT_DROP: 60,
  DEBATE: 120,
  VERDICT: 45,
  REVEAL: 15
}

export const useGameStore = create((set, get) => ({
  // Room state
  roomId: null,
  roomCode: null,
  hostId: null,
  gameMode: 'SILENT',
  difficulty: 'MEDIUM',
  wordPack: 'GENERAL',
  status: 'LOBBY', // LOBBY, PLAYING, FINISHED
  currentRound: 1,
  
  // Participants
  participants: [],
  
  // My game state
  mySecret: null,
  myRole: null,
  myHint: null,
  myVote: null,
  
  // Game phase
  currentPhase: null,
  phaseTimeLeft: 0,
  phaseTimer: null,
  
  // Hints and votes
  hints: [],
  votes: [],
  
  // Results
  eliminatedPlayer: null,
  winner: null,
  traitorId: null,
  
  // Real-time subscription
  subscription: null,
  
  // Loading states
  isLoading: false,
  error: null,

  // Initialize room (from lobby)
  initRoom: (roomData) => {
    set({
      roomId: roomData.id,
      roomCode: roomData.room_code,
      hostId: roomData.host_id,
      gameMode: roomData.game_mode,
      difficulty: roomData.difficulty,
      wordPack: roomData.word_pack,
      status: roomData.status,
      currentRound: roomData.current_round || 1
    })
  },

  // Set participants
  setParticipants: (participants) => {
    set({ participants })
  },

  // Subscribe to real-time updates
  subscribeToRoom: (roomId) => {
    const subscription = realtimeHelpers.subscribeToRoom(roomId, {
      onRoomUpdate: (payload) => {
        console.log('Room updated:', payload)
        const room = payload.new
        set({
          status: room.status,
          currentRound: room.current_round
        })
        
        // If game just started, load my secret
        if (room.status === 'PLAYING' && !get().mySecret) {
          get().loadMySecret()
        }
      },
      
      onParticipantUpdate: async (payload) => {
        console.log('Participant updated:', payload)
        // Reload participants
        const participants = await gameHelpers.getParticipants(roomId)
        set({ participants })
      },
      
      onHintSubmitted: async (payload) => {
        console.log('Hint submitted:', payload)
        // Reload hints
        const hints = await gameHelpers.getHints(roomId)
        set({ hints })
      },
      
      onVoteSubmitted: async (payload) => {
        console.log('Vote submitted:', payload)
        // Reload votes
        const votes = await gameHelpers.getVotes(roomId)
        set({ votes })
      }
    })
    
    set({ subscription })
  },

  // Unsubscribe from real-time
  unsubscribe: () => {
    const { subscription, phaseTimer } = get()
    if (subscription) {
      realtimeHelpers.unsubscribe(subscription)
      set({ subscription: null })
    }
    if (phaseTimer) {
      clearInterval(phaseTimer)
      set({ phaseTimer: null })
    }
  },

  // Start game (host only)
  startGame: async () => {
    const { roomId, participants } = get()
    
    try {
      set({ isLoading: true, error: null })
      
      // Update room status
      await gameHelpers.startGame(roomId)
      
      // Assign roles and words
      const { difficulty, wordPack } = get()
      await gameHelpers.assignRoles(roomId, participants, difficulty, wordPack)
      
      // Load my secret
      await get().loadMySecret()
      
      // Start first phase
      get().startPhase(GAME_PHASES.WHISPER)
      
      set({ status: 'PLAYING', isLoading: false })
    } catch (error) {
      console.error('Start game error:', error)
      set({ error: error.message, isLoading: false })
    }
  },

  // Load my secret word and role
  loadMySecret: async () => {
    const { roomId } = get()
    const guestId = localStorage.getItem('wordtraitor-guest')
      ? JSON.parse(localStorage.getItem('wordtraitor-guest')).guestId
      : null
    
    if (!guestId) return
    
    try {
      const secret = await gameHelpers.getMySecret(roomId, guestId)
      set({
        mySecret: secret.secret_word,
        myRole: secret.role
      })
    } catch (error) {
      console.error('Load secret error:', error)
    }
  },

  // Start a game phase
  startPhase: (phase) => {
    const { phaseTimer } = get()
    
    // Clear existing timer
    if (phaseTimer) {
      clearInterval(phaseTimer)
    }
    
    // Set phase
    const duration = PHASE_DURATIONS[phase]
    set({
      currentPhase: phase,
      phaseTimeLeft: duration
    })
    
    // Start countdown timer
    const timer = setInterval(() => {
      const { phaseTimeLeft, currentPhase } = get()
      
      if (phaseTimeLeft <= 1) {
        clearInterval(timer)
        get().onPhaseEnd(currentPhase)
      } else {
        set({ phaseTimeLeft: phaseTimeLeft - 1 })
      }
    }, 1000)
    
    set({ phaseTimer: timer })
  },

  // Handle phase end
  onPhaseEnd: (phase) => {
    const phases = Object.values(GAME_PHASES)
    const currentIndex = phases.indexOf(phase)
    
    if (currentIndex < phases.length - 1) {
      // Move to next phase
      const nextPhase = phases[currentIndex + 1]
      
      // Load data for next phase
      if (nextPhase === GAME_PHASES.DEBATE) {
        get().loadHints()
      } else if (nextPhase === GAME_PHASES.REVEAL) {
        get().processVotes()
      }
      
      get().startPhase(nextPhase)
    } else {
      // Round ended, check game status
      get().checkGameEnd()
    }
  },

  // Submit hint
  submitHint: async (hintText) => {
    const { roomId } = get()
    const guestId = localStorage.getItem('wordtraitor-guest')
      ? JSON.parse(localStorage.getItem('wordtraitor-guest')).guestId
      : null
    
    if (!guestId || !hintText.trim()) return
    
    try {
      set({ isLoading: true, error: null })
      await gameHelpers.submitHint(roomId, guestId, hintText.trim())
      set({ myHint: hintText.trim(), isLoading: false })
    } catch (error) {
      console.error('Submit hint error:', error)
      set({ error: error.message, isLoading: false })
    }
  },

  // Load hints
  loadHints: async () => {
    const { roomId } = get()
    
    try {
      const hints = await gameHelpers.getHints(roomId)
      set({ hints })
    } catch (error) {
      console.error('Load hints error:', error)
    }
  },

  // Submit vote
  submitVote: async (targetId) => {
    const { roomId } = get()
    const guestId = localStorage.getItem('wordtraitor-guest')
      ? JSON.parse(localStorage.getItem('wordtraitor-guest')).guestId
      : null
    
    if (!guestId) return
    
    try {
      set({ isLoading: true, error: null })
      await gameHelpers.submitVote(roomId, guestId, targetId)
      set({ myVote: targetId, isLoading: false })
    } catch (error) {
      console.error('Submit vote error:', error)
      set({ error: error.message, isLoading: false })
    }
  },

  // Process votes and determine elimination
  processVotes: async () => {
    const { roomId } = get()
    
    try {
      const result = await gameHelpers.calculateVoteResults(roomId)
      set({
        votes: result.votes,
        eliminatedPlayer: result.eliminatedId
      })
      
      // Eliminate player if someone was voted out
      if (result.eliminatedId) {
        await gameHelpers.eliminatePlayer(roomId, result.eliminatedId)
      }
    } catch (error) {
      console.error('Process votes error:', error)
    }
  },

  // Check if game should end
  checkGameEnd: async () => {
    const { roomId } = get()
    
    try {
      const result = await gameHelpers.checkGameEnd(roomId)
      
      if (result.ended) {
        // Game over
        await gameHelpers.endGame(roomId, result.winner, result.traitorId)
        set({
          status: 'FINISHED',
          winner: result.winner,
          traitorId: result.traitorId,
          currentPhase: null
        })
        
        // Clear timer
        const { phaseTimer } = get()
        if (phaseTimer) {
          clearInterval(phaseTimer)
          set({ phaseTimer: null })
        }
      } else {
        // Continue to next round
        set({
          currentRound: get().currentRound + 1,
          myHint: null,
          myVote: null,
          hints: [],
          votes: [],
          eliminatedPlayer: null
        })
        
        // Start new round
        get().startPhase(GAME_PHASES.WHISPER)
      }
    } catch (error) {
      console.error('Check game end error:', error)
    }
  },

  // Leave game
  leaveGame: async () => {
    const { roomId } = get()
    const guestId = localStorage.getItem('wordtraitor-guest')
      ? JSON.parse(localStorage.getItem('wordtraitor-guest')).guestId
      : null
    
    if (!guestId) return
    
    try {
      await gameHelpers.leaveRoom(roomId, guestId)
      get().unsubscribe()
      get().resetGame()
    } catch (error) {
      console.error('Leave game error:', error)
    }
  },

  // Reset game state
  resetGame: () => {
    const { phaseTimer } = get()
    if (phaseTimer) {
      clearInterval(phaseTimer)
    }
    
    set({
      roomId: null,
      roomCode: null,
      hostId: null,
      gameMode: 'SILENT',
      difficulty: 'MEDIUM',
      wordPack: 'GENERAL',
      status: 'LOBBY',
      currentRound: 1,
      participants: [],
      mySecret: null,
      myRole: null,
      myHint: null,
      myVote: null,
      currentPhase: null,
      phaseTimeLeft: 0,
      phaseTimer: null,
      hints: [],
      votes: [],
      eliminatedPlayer: null,
      winner: null,
      traitorId: null,
      subscription: null,
      isLoading: false,
      error: null
    })
  }
}))