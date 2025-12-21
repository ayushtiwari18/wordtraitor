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
  mySecret: null,
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
  // INITIALIZATION - CALL ONCE ON APP START
  // ==========================================
  
  initializeGuest: () => {
    // Check if already initialized
    const { myUserId, myUsername } = get()
    if (myUserId && myUsername) {
      console.log('✅ Guest already initialized:', myUsername, `(${myUserId.slice(0, 20)}...)`)
      return { guestId: myUserId, guestUsername: myUsername }
    }

    // Get from localStorage or generate new
    const guestId = localStorage.getItem('guestId') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const guestUsername = localStorage.getItem('guestUsername') || `Player${Math.floor(Math.random() * 9999)}`
    
    localStorage.setItem('guestId', guestId)
    localStorage.setItem('guestUsername', guestUsername)
    
    set({ myUserId: guestId, myUsername: guestUsername })
    console.log('👤 Guest initialized:', guestUsername, `(${guestId.slice(0, 20)}...)`)
    return { guestId, guestUsername }
  },

  // ==========================================
  // ROOM MANAGEMENT
  // ==========================================
  
  createRoom: async (gameMode, difficulty, wordPack) => {
    console.log('🏠 Creating room...')
    set({ isLoading: true, error: null })
    
    try {
      const { guestId, guestUsername } = get().initializeGuest()
      
      const room = await gameHelpers.createRoom(guestId, guestUsername, gameMode, difficulty, wordPack)
      console.log('✅ Room created:', room.room_code)
      
      // Fetch participants immediately after creation
      const participants = await gameHelpers.getParticipants(room.id)
      console.log('👥 Initial participants:', participants.length)
      
      set({ 
        room, 
        roomId: room.id,
        participants,
        isHost: true,
        isLoading: false
      })
      
      // Start real-time subscription
      get().subscribeToRoom(room.id)
      
      return room
    } catch (error) {
      console.error('❌ Error creating room:', error)
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  joinRoom: async (roomCode) => {
    console.log('🚪 Joining room:', roomCode)
    set({ isLoading: true, error: null })
    
    try {
      const { guestId, guestUsername } = get().initializeGuest()
      
      const result = await gameHelpers.joinRoom(roomCode, guestId, guestUsername)
      console.log('✅ Joined room:', result.room.room_code)
      
      // Fetch full room details
      const room = await gameHelpers.getRoom(result.room.id)
      const participants = await gameHelpers.getParticipants(result.room.id)
      console.log('👥 Participants after join:', participants.length)
      
      set({ 
        room, 
        roomId: room.id,
        participants,
        isHost: false,
        isLoading: false
      })
      
      // Start real-time subscription
      get().subscribeToRoom(room.id)
      
      return room
    } catch (error) {
      console.error('❌ Error joining room:', error)
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  loadRoom: async (roomId) => {
    // CRITICAL FIX: Skip if already loaded this room
    const { roomId: currentRoomId, realtimeChannel } = get()
    if (currentRoomId === roomId && realtimeChannel) {
      console.log('⏭️ Room already loaded, skipping')
      return get().room
    }
    
    console.log('📥 Loading room:', roomId)
    set({ isLoading: true, error: null })
    
    try {
      // Initialize guest WITHOUT creating new ID
      const { guestId } = get().initializeGuest()
      
      const room = await gameHelpers.getRoom(roomId)
      console.log('🎮 Room loaded:', room.room_code, 'Status:', room.status)
      
      const participants = await gameHelpers.getParticipants(roomId)
      console.log('👥 Participants loaded:', participants.length, 'players')
      
      // Check if I'm already in the room
      const alreadyJoined = participants.some(p => p.user_id === guestId)
      
      if (!alreadyJoined && room.status === 'LOBBY') {
        console.log('🆕 Not in room, auto-joining...')
        // Auto-join if not already in room
        const { guestUsername } = get()
        await gameHelpers.autoJoinRoom(roomId, guestId, guestUsername)
        // Reload participants
        const updatedParticipants = await gameHelpers.getParticipants(roomId)
        console.log('👥 After auto-join:', updatedParticipants.length)
        set({ participants: updatedParticipants })
      } else {
        set({ participants })
      }
      
      set({ 
        room, 
        roomId,
        isHost: room.host_id === guestId,
        isLoading: false
      })
      
      // Subscribe to real-time updates (this will cleanup old subscription)
      get().subscribeToRoom(roomId)
      
      return room
    } catch (error) {
      console.error('❌ Error loading room:', error)
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  leaveRoom: async () => {
    const { roomId, myUserId, realtimeChannel, phaseInterval } = get()
    console.log('👋 Leaving room...')
    
    try {
      if (roomId && myUserId) {
        await gameHelpers.leaveRoom(roomId, myUserId)
      }
      
      // Unsubscribe from real-time
      if (realtimeChannel) {
        console.log('🔌 Unsubscribing from real-time')
        realtimeHelpers.unsubscribe(realtimeChannel)
      }
      
      // Clear phase timer
      if (phaseInterval) {
        clearInterval(phaseInterval)
      }
      
      // Reset store (but keep guest ID!)
      const { myUserId: guestId, myUsername: guestUsername } = get()
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
        gameResults: null,
        // KEEP GUEST ID
        myUserId: guestId,
        myUsername: guestUsername
      })
      console.log('✅ Room left successfully')
    } catch (error) {
      console.error('❌ Error leaving room:', error)
    }
  },

  // ==========================================
  // GAME FLOW
  // ==========================================
  
  startGame: async () => {
    console.log('🚀 Starting game...')
    set({ isLoading: true, error: null })
    
    try {
      const { roomId, participants } = get()
      
      if (participants.length < 2) {
        throw new Error('Need at least 2 players to start')
      }
      
      console.log('🎲 Starting game with', participants.length, 'players')
      
      // Update room status
      await gameHelpers.startGame(roomId)
      console.log('✅ Room status updated to PLAYING')
      
      // Assign roles and words
      const { room } = get()
      await gameHelpers.assignRoles(roomId, participants, room.difficulty, room.word_pack)
      console.log('✅ Roles assigned')
      
      // Load my secret
      const { myUserId } = get()
      const mySecret = await gameHelpers.getMySecret(roomId, myUserId)
      console.log('📝 My role:', mySecret.role, '| Word:', mySecret.secret_word)
      
      set({ 
        mySecret,
        gamePhase: 'WHISPER',
        isLoading: false
      })
      
      // Start phase timer
      get().startPhaseTimer('WHISPER')
      
    } catch (error) {
      console.error('❌ Error starting game:', error)
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  startPhaseTimer: (phaseName) => {
    const phase = GAME_PHASES[phaseName]
    if (!phase) return
    
    console.log(`⏰ Starting ${phaseName} phase (${phase.duration}s)`)
    
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
        console.log(`⏰ ${phaseName} phase ended, advancing...`)
        get().advancePhase()
      }
    }, 1000)
    
    set({ phaseInterval: interval })
  },

  advancePhase: async () => {
    const { gamePhase, roomId } = get()
    const currentPhase = GAME_PHASES[gamePhase]
    
    if (!currentPhase?.next) {
      console.log('🏁 Round complete, checking win conditions...')
      await get().checkWinConditions()
      return
    }
    
    console.log(`➡️ Advancing from ${gamePhase} to ${currentPhase.next}`)
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
    console.log('💬 Submitting hint:', hintText)
    
    try {
      await gameHelpers.submitHint(roomId, myUserId, hintText)
      await get().loadHints()
      console.log('✅ Hint submitted')
    } catch (error) {
      console.error('❌ Error submitting hint:', error)
      set({ error: error.message })
      throw error
    }
  },

  loadHints: async () => {
    const { roomId } = get()
    
    try {
      const hints = await gameHelpers.getHints(roomId)
      console.log('💬 Loaded', hints.length, 'hints')
      set({ hints })
    } catch (error) {
      console.error('❌ Error loading hints:', error)
    }
  },

  // ==========================================
  // VOTING
  // ==========================================
  
  submitVote: async (targetId) => {
    const { roomId, myUserId } = get()
    console.log('🗳️ Submitting vote for:', targetId)
    
    try {
      await gameHelpers.submitVote(roomId, myUserId, targetId)
      await get().loadVotes()
      console.log('✅ Vote submitted')
    } catch (error) {
      console.error('❌ Error submitting vote:', error)
      set({ error: error.message })
      throw error
    }
  },

  loadVotes: async () => {
    const { roomId } = get()
    
    try {
      const votes = await gameHelpers.getVotes(roomId)
      console.log('🗳️ Loaded', votes.length, 'votes')
      set({ votes })
    } catch (error) {
      console.error('❌ Error loading votes:', error)
    }
  },

  // ==========================================
  // WIN CONDITIONS
  // ==========================================
  
  checkWinConditions: async () => {
    const { roomId, participants } = get()
    console.log('🎯 Checking win conditions...')
    
    try {
      const results = await gameHelpers.calculateVoteResults(roomId)
      const { eliminatedId, voteCounts } = results

      console.log('📊 Vote counts:', voteCounts)
      
      if (eliminatedId) {
        const eliminatedPlayer = participants.find(p => p.user_id === eliminatedId)
        console.log('💀 Eliminated:', eliminatedPlayer?.username)
        
        // Eliminate player
        const updatedParticipants = participants.map(p => 
          p.user_id === eliminatedId ? { ...p, is_alive: false } : p
        )
        set({ participants: updatedParticipants })
        
        await gameHelpers.eliminatePlayer(roomId, eliminatedId)
        
        // Add to eliminated list
        const { eliminated } = get()
        set({ eliminated: [...eliminated, eliminatedId] })
      }

      // Check if game should end
      const gameEnd = await gameHelpers.checkGameEnd(roomId)
      
      if (gameEnd.ended) {
        console.log('🏆 Game over! Winner:', gameEnd.winner)
        const results = { ...gameEnd, voteCounts }
        set({ showResults: true, gameResults: results })
        
        const { phaseInterval } = get()
        if (phaseInterval) clearInterval(phaseInterval)
        return
      }
      
      // Continue to next round
      console.log('🔄 Game continues to next round...')
      set({ 
        gamePhase: 'WHISPER',
        hints: [],
        votes: []
      })
      get().startPhaseTimer('WHISPER')
      
    } catch (error) {
      console.error('❌ Error checking win conditions:', error)
      set({ error: error.message })
    }
  },

  // ==========================================
  // REAL-TIME SUBSCRIPTIONS
  // ==========================================
  
  subscribeToRoom: (roomId) => {
    const { realtimeChannel: existingChannel } = get()
    
    // CRITICAL FIX: Cleanup existing subscription first
    if (existingChannel) {
      console.log('🔄 Cleaning up previous subscription')
      realtimeHelpers.unsubscribe(existingChannel)
      set({ realtimeChannel: null, isConnected: false })
    }
    
    console.log('📡 Subscribing to real-time updates for room:', roomId)
    
    const channel = realtimeHelpers.subscribeToRoom(roomId, {
      onRoomUpdate: (payload) => {
        console.log('🔄 Room updated:', payload.eventType)
        const { room } = get()
        
        if (payload.eventType === 'UPDATE') {
          const updatedRoom = payload.new
          set({ room: updatedRoom })
          
          // If game started by host, sync phase
          if (room?.status === 'LOBBY' && updatedRoom.status === 'PLAYING') {
            console.log('🎮 Game started by host, syncing...')
            get().syncGameStart()
          }
        }
      },
      
      onParticipantUpdate: async (payload) => {
        console.log('👥 Participants updated')
        const { roomId } = get()
        const participants = await gameHelpers.getParticipants(roomId)
        set({ participants })
      },
      
      onHintSubmitted: async (payload) => {
        console.log('💬 New hint submitted')
        await get().loadHints()
      },
      
      onVoteSubmitted: async (payload) => {
        console.log('🗳️ New vote submitted')
        await get().loadVotes()
      }
    })
    
    set({ realtimeChannel: channel, isConnected: true })
    console.log('✅ Real-time subscribed and connected')
  },

  syncGameStart: async () => {
    const { roomId, myUserId } = get()
    console.log('🔄 Syncing game start...')
    
    try {
      // Load my secret
      const mySecret = await gameHelpers.getMySecret(roomId, myUserId)
      
      if (!mySecret) {
        console.log('⏳ Secret not assigned yet, waiting...')
        return
      }
      
      console.log('📝 Synced - My role:', mySecret.role, '| Word:', mySecret.secret_word)
      
      set({ 
        mySecret,
        gamePhase: 'WHISPER'
      })
      
      // Start phase timer
      get().startPhaseTimer('WHISPER')
      
    } catch (error) {
      console.error('❌ Error syncing game start:', error)
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