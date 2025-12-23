import { create } from 'zustand'
import { supabase, gameHelpers, realtimeHelpers } from '../lib/supabase'

// Default game phases with durations (in seconds)
export const DEFAULT_PHASE_DURATIONS = {
  WHISPER: 30,
  HINT_DROP: 60,
  DEBATE: 120,
  VERDICT: 45,
  REVEAL: 15
}

export const GAME_PHASES = {
  WHISPER: { name: 'WHISPER', next: 'HINT_DROP' },
  HINT_DROP: { name: 'HINT_DROP', next: 'DEBATE' },
  DEBATE: { name: 'DEBATE', next: 'VERDICT' },
  VERDICT: { name: 'VERDICT', next: 'REVEAL' },
  REVEAL: { name: 'REVEAL', next: null }
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
  
  // New: Custom settings
  customTimings: null,
  traitorCount: 1,
  
  // New: Turn-based hints
  currentTurnIndex: 0,
  turnOrder: [], // Array of user_ids in turn order
  
  // New: Chat messages
  chatMessages: [],
  
  // Real-time
  realtimeChannel: null,
  isConnected: false,
  
  // UI state
  isLoading: false,
  error: null,
  showResults: false,
  gameResults: null,

  // CRITICAL: Track pending loadRoom calls to prevent duplicates
  pendingRoomLoad: null, // Stores roomIdOrCode being loaded

  // ==========================================
  // INITIALIZATION - CALL ONCE ON APP START
  // ==========================================
  
  initializeGuest: () => {
    // Check if already initialized in store
    const { myUserId, myUsername } = get()
    if (myUserId && myUsername) {
      console.log('✅ Guest already initialized:', myUsername, `(${myUserId.slice(0, 20)}...)`)
      return { guestId: myUserId, guestUsername: myUsername }
    }

    // Get from localStorage (check for empty strings too)
    let guestId = localStorage.getItem('guestId')
    let guestUsername = localStorage.getItem('guestUsername')
    
    // Validate: regenerate if null, undefined, or empty string
    if (!guestId || guestId.trim() === '') {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      console.log('🆕 Generated new guest ID')
    }
    
    if (!guestUsername || guestUsername.trim() === '') {
      guestUsername = `Player${Math.floor(Math.random() * 9999)}`
      console.log('🆕 Generated new username')
    }
    
    // Save to localStorage
    localStorage.setItem('guestId', guestId)
    localStorage.setItem('guestUsername', guestUsername)
    
    // Update store
    set({ myUserId: guestId, myUsername: guestUsername })
    console.log('👤 Guest initialized:', guestUsername, `(${guestId.slice(0, 20)}...)`)
    return { guestId, guestUsername }
  },

  // ==========================================
  // ROOM MANAGEMENT
  // ==========================================
  
  createRoom: async (gameMode, difficulty, wordPack, customSettings = {}) => {
    console.log('🏠 Creating room...')
    set({ isLoading: true, error: null })
    
    try {
      const { guestId, guestUsername } = get().initializeGuest()
      
      const room = await gameHelpers.createRoom(guestId, guestUsername, gameMode, difficulty, wordPack, customSettings)
      console.log('✅ Room created:', room.room_code)
      
      // Validate room object
      if (!room || !room.id) {
        console.error('❌ Invalid room object:', room)
        throw new Error('Room creation returned invalid data')
      }
      
      // Fetch participants immediately after creation
      const participants = await gameHelpers.getParticipants(room.id)
      console.log('👥 Initial participants:', participants.length)
      
      set({ 
        room, 
        roomId: room.id,
        participants,
        isHost: true,
        customTimings: room.custom_timings,
        traitorCount: room.traitor_count || 1,
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

  // FIX: Updated to match new joinRoom return format (direct room object)
  joinRoom: async (roomCode) => {
    console.log('🚪 Joining room:', roomCode)
    set({ isLoading: true, error: null })
    
    try {
      const { guestId, guestUsername } = get().initializeGuest()
      
      // FIX: joinRoom now returns room directly (not { room: {...} })
      const room = await gameHelpers.joinRoom(roomCode, guestId, guestUsername)
      console.log('✅ Joined room - Direct room object:', room)
      
      // FIX: Validate direct room object
      if (!room || !room.id || !room.room_code) {
        console.error('❌ Invalid join result:', room)
        throw new Error('Join room returned invalid data')
      }
      
      console.log('✅ Room ID from join:', room.id)
      console.log('✅ Room code from join:', room.room_code)
      
      // Fetch participants using room.id (not result.room.id)
      const participants = await gameHelpers.getParticipants(room.id)
      console.log('👥 Participants after join:', participants.length)
      console.log('⚙️ Room settings:', room.custom_timings, 'traitors:', room.traitor_count)
      
      set({ 
        room, 
        roomId: room.id,
        participants,
        isHost: false,
        customTimings: room.custom_timings,
        traitorCount: room.traitor_count || 1,
        isLoading: false
      })
      
      // Start real-time subscription
      get().subscribeToRoom(room.id)
      
      console.log('🎯 Returning room object with id:', room.id, 'code:', room.room_code)
      return room
    } catch (error) {
      console.error('❌ Error joining room:', error)
      console.error('❌ Error stack:', error.stack)
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  loadRoom: async (roomIdOrCode, options = {}) => {
    const { force = false } = options
    console.log('📥 Loading room:', roomIdOrCode, force ? '(forced)' : '')
    
    // CRITICAL FIX: Prevent duplicate concurrent calls
    const { pendingRoomLoad } = get()
    if (pendingRoomLoad === roomIdOrCode) {
      console.log('⏳ Room load already in progress, skipping duplicate call')
      // Return a promise that waits for the original load to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const { pendingRoomLoad: current, room } = get()
          if (current !== roomIdOrCode && room) {
            clearInterval(checkInterval)
            resolve(room)
          }
        }, 100)
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval)
          resolve(get().room)
        }, 10000)
      })
    }
    
    set({ isLoading: true, error: null, pendingRoomLoad: roomIdOrCode })
    
    try {
      // Initialize guest WITHOUT creating new ID
      const { guestId } = get().initializeGuest()
      
      // Fetch room (accepts both UUID and room code)
      const room = await gameHelpers.getRoom(roomIdOrCode)
      console.log('🎮 Room loaded:', room.room_code, 'Status:', room.status, 'UUID:', room.id)
      
      // CRITICAL: Check if already loaded this exact room by UUID (unless forced)
      const { roomId: currentRoomId, realtimeChannel } = get()
      if (!force && currentRoomId === room.id && realtimeChannel) {
        console.log('⏭️ Room already loaded by UUID, skipping')
        set({ isLoading: false, pendingRoomLoad: null })
        return room
      }
      
      const participants = await gameHelpers.getParticipants(room.id)
      console.log('👥 Participants loaded:', participants.length, 'players')
      
      // FIX: Check if I'm already in the room BEFORE auto-joining
      const alreadyJoined = participants.some(p => p.user_id === guestId)
      console.log('🔍 Already joined?', alreadyJoined)
      
      if (!alreadyJoined && room.status === 'LOBBY') {
        console.log('🆕 Not in room, auto-joining...')
        // Auto-join if not already in room
        const { guestUsername } = get()
        await gameHelpers.autoJoinRoom(room.id, guestId, guestUsername)
        // Reload participants
        const updatedParticipants = await gameHelpers.getParticipants(room.id)
        console.log('👥 After auto-join:', updatedParticipants.length)
        set({ participants: updatedParticipants })
      } else {
        console.log('✅ Already a participant, skipping auto-join')
        set({ participants })
      }
      
      set({ 
        room, 
        roomId: room.id, // Always use UUID for internal state
        isHost: room.host_id === guestId,
        customTimings: room.custom_timings,
        traitorCount: room.traitor_count || 1,
        isLoading: false,
        pendingRoomLoad: null // Clear pending state
      })
      
      // Subscribe to real-time updates using UUID (this will cleanup old subscription)
      get().subscribeToRoom(room.id)
      
      return room
    } catch (error) {
      console.error('❌ Error loading room:', error)
      set({ error: error.message, isLoading: false, pendingRoomLoad: null })
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
        customTimings: null,
        traitorCount: 1,
        currentTurnIndex: 0,
        turnOrder: [],
        chatMessages: [],
        realtimeChannel: null,
        isConnected: false,
        showResults: false,
        gameResults: null,
        pendingRoomLoad: null, // Clear pending state
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
      const { roomId, participants, room, traitorCount } = get()
      
      if (participants.length < 2) {
        throw new Error('Need at least 2 players to start')
      }
      
      console.log('🎲 Starting game with', participants.length, 'players')
      console.log('🎭 Traitor count:', traitorCount)
      
      // Update room status
      await gameHelpers.startGame(roomId)
      console.log('✅ Room status updated to PLAYING')
      
      // Assign roles and words (with custom traitor count)
      await gameHelpers.assignRoles(roomId, participants, room.difficulty, room.word_pack, traitorCount)
      console.log('✅ Roles assigned')
      
      // Load my secret
      const { myUserId } = get()
      const mySecret = await gameHelpers.getMySecret(roomId, myUserId)
      console.log('📝 My role:', mySecret.role, '| Word:', mySecret.secret_word)
      
      // Initialize turn order (alive players)
      const turnOrder = participants.map(p => p.user_id)
      console.log('🔄 Turn order initialized:', turnOrder.length, 'players')
      
      set({ 
        mySecret,
        gamePhase: 'WHISPER',
        turnOrder,
        currentTurnIndex: 0,
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

  getPhaseDuration: (phaseName) => {
    const { customTimings } = get()
    if (customTimings && customTimings[phaseName]) {
      return customTimings[phaseName]
    }
    return DEFAULT_PHASE_DURATIONS[phaseName] || 30
  },

  startPhaseTimer: (phaseName) => {
    const phase = GAME_PHASES[phaseName]
    if (!phase) return
    
    const duration = get().getPhaseDuration(phaseName)
    console.log(`⏰ Starting ${phaseName} phase (${duration}s)`)
    
    // Clear existing timer
    const { phaseInterval } = get()
    if (phaseInterval) {
      clearInterval(phaseInterval)
    }
    
    let timeLeft = duration
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
      await get().loadChatMessages()
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
  // TURN-BASED HINTS
  // ==========================================
  
  getCurrentTurnPlayer: () => {
    const { turnOrder, currentTurnIndex, participants } = get()
    if (!turnOrder || turnOrder.length === 0) return null
    
    const currentUserId = turnOrder[currentTurnIndex]
    return participants.find(p => p.user_id === currentUserId)
  },
  
  isMyTurnToHint: () => {
    const { turnOrder, currentTurnIndex, myUserId, gamePhase } = get()
    if (gamePhase !== 'HINT_DROP') return false
    if (!turnOrder || turnOrder.length === 0) return false
    
    const currentUserId = turnOrder[currentTurnIndex]
    return currentUserId === myUserId
  },
  
  advanceTurn: () => {
    const { currentTurnIndex, turnOrder } = get()
    const nextIndex = (currentTurnIndex + 1) % turnOrder.length
    console.log(`🔄 Turn ${currentTurnIndex} -> ${nextIndex}`)
    set({ currentTurnIndex: nextIndex })
  },

  // ==========================================
  // HINTS
  // ==========================================
  
  submitHint: async (hintText) => {
    const { roomId, myUserId, room } = get()
    console.log('💬 Submitting hint:', hintText)
    
    try {
      await gameHelpers.submitHint(roomId, myUserId, hintText)
      await get().loadHints()
      
      // Advance turn only in Silent Mode
      if (room?.game_mode === 'SILENT') {
        get().advanceTurn()
      }
      
      console.log('✅ Hint submitted')
    } catch (error) {
      console.error('❌ Error submitting hint:', error)
      set({ error: error.message })
      throw error
    }
  },
  
  submitRealModeNext: async () => {
    const { roomId, myUserId } = get()
    console.log('➡️ Real Mode: Marking hint as given verbally')
    
    try {
      // Submit placeholder hint for Real Mode
      await gameHelpers.submitHint(roomId, myUserId, '[VERBAL]')
      await get().loadHints()
      get().advanceTurn()
      console.log('✅ Turn advanced')
    } catch (error) {
      console.error('❌ Error advancing turn:', error)
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
  // CHAT MESSAGES
  // ==========================================
  
  sendChatMessage: async (message) => {
    const { roomId, myUserId, myUsername } = get()
    console.log('💬 Sending chat message:', message)
    
    try {
      await gameHelpers.sendChatMessage(roomId, myUserId, myUsername, message)
      await get().loadChatMessages()
      console.log('✅ Chat message sent')
    } catch (error) {
      console.error('❌ Error sending chat message:', error)
      set({ error: error.message })
      throw error
    }
  },
  
  loadChatMessages: async () => {
    const { roomId } = get()
    
    try {
      const messages = await gameHelpers.getChatMessages(roomId)
      console.log('💬 Loaded', messages.length, 'chat messages')
      set({ chatMessages: messages })
    } catch (error) {
      console.error('❌ Error loading chat messages:', error)
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
        
        // Update turn order (remove eliminated player)
        const { turnOrder } = get()
        const newTurnOrder = turnOrder.filter(id => id !== eliminatedId)
        set({ turnOrder: newTurnOrder, currentTurnIndex: 0 })
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
        votes: [],
        chatMessages: [],
        currentTurnIndex: 0
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
      },
      
      onChatMessage: async (payload) => {
        console.log('💬 New chat message')
        await get().loadChatMessages()
      }
    })
    
    set({ realtimeChannel: channel, isConnected: true })
    console.log('✅ Real-time subscribed and connected')
  },

  syncGameStart: async () => {
    const { roomId, myUserId, participants } = get()
    console.log('🔄 Syncing game start...')
    
    try {
      // Load my secret
      const mySecret = await gameHelpers.getMySecret(roomId, myUserId)
      
      if (!mySecret) {
        console.log('⏳ Secret not assigned yet, waiting...')
        return
      }
      
      console.log('📝 Synced - My role:', mySecret.role, '| Word:', mySecret.secret_word)
      
      // Initialize turn order
      const turnOrder = participants.map(p => p.user_id)
      
      set({ 
        mySecret,
        gamePhase: 'WHISPER',
        turnOrder,
        currentTurnIndex: 0
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