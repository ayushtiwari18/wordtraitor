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
  
  // Custom settings
  customTimings: null,
  traitorCount: 1,
  
  // Turn-based hints
  currentTurnIndex: 0,
  turnOrder: [],
  
  // Chat messages
  chatMessages: [],
  
  // Real-time
  realtimeChannel: null,
  isConnected: false,
  subscriptionState: null,
  
  // UI state
  isLoading: false,
  error: null,
  showResults: false,
  gameResults: null,
  syncRetryCount: 0,

  // Track pending loadRoom calls
  pendingRoomLoad: null,

  // ==========================================
  // INITIALIZATION
  // ==========================================
  
  initializeGuest: () => {
    const { myUserId, myUsername } = get()
    if (myUserId && myUsername) {
      console.log('✅ Guest already initialized:', myUsername, `(${myUserId.slice(0, 20)}...)`)
      return { guestId: myUserId, guestUsername: myUsername }
    }

    let guestId = localStorage.getItem('guest_id')
    let guestUsername = localStorage.getItem('username')
    
    if (!guestId || guestId.trim() === '') {
      guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      console.log('🆕 Generated new guest ID')
    }
    
    if (!guestUsername || guestUsername.trim() === '') {
      guestUsername = `Player${Math.floor(Math.random() * 9999)}`
      console.log('🆕 Generated new username')
    }
    
    localStorage.setItem('guest_id', guestId)
    localStorage.setItem('username', guestUsername)
    
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
      
      if (!room || !room.id) {
        console.error('❌ Invalid room object:', room)
        throw new Error('Room creation returned invalid data')
      }
      
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
      
      const room = await gameHelpers.joinRoom(roomCode, guestId, guestUsername)
      console.log('✅ Joined room:', room.room_code)
      
      if (!room || !room.id || !room.room_code) {
        console.error('❌ Invalid join result:', room)
        throw new Error('Join room returned invalid data')
      }
      
      const participants = await gameHelpers.getParticipants(room.id)
      console.log('👥 Participants after join:', participants.length)
      
      set({ 
        room, 
        roomId: room.id,
        participants,
        isHost: false,
        customTimings: room.custom_timings,
        traitorCount: room.traitor_count || 1,
        isLoading: false
      })
      
      get().subscribeToRoom(room.id)
      
      return room
    } catch (error) {
      console.error('❌ Error joining room:', error)
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  loadRoom: async (roomIdOrCode, options = {}) => {
    const { force = false } = options
    console.log('📥 Loading room:', roomIdOrCode, force ? '(forced)' : '')
    
    const { pendingRoomLoad } = get()
    if (pendingRoomLoad === roomIdOrCode) {
      console.log('⏳ Room load already in progress, skipping duplicate')
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const { pendingRoomLoad: current, room } = get()
          if (current !== roomIdOrCode && room) {
            clearInterval(checkInterval)
            resolve(room)
          }
        }, 100)
        setTimeout(() => {
          clearInterval(checkInterval)
          resolve(get().room)
        }, 10000)
      })
    }
    
    set({ isLoading: true, error: null, pendingRoomLoad: roomIdOrCode })
    
    try {
      const { guestId } = get().initializeGuest()
      
      const room = await gameHelpers.getRoom(roomIdOrCode)
      console.log('🎮 Room loaded:', room.room_code, 'Status:', room.status)
      
      const { roomId: currentRoomId, realtimeChannel } = get()
      
      // 🔧 CRITICAL FIX: Check for missing secret BEFORE early return
      if (!force && currentRoomId === room.id && realtimeChannel) {
        console.log('⏭️ Room already loaded, checking if sync needed...')
        
        // Even if room is loaded, check if we need game state
        if (room.status === 'PLAYING' && room.current_phase) {
          const { mySecret } = get()
          if (!mySecret) {
            console.log('🔧 Game is PLAYING but no secret! Syncing before return...')
            set({ gamePhase: room.current_phase })
            
            // Sync phase timer
            if (room.phase_started_at) {
              get().syncPhaseTimer(room.current_phase, room.phase_started_at)
            }
            
            // Trigger sync asynchronously
            setTimeout(async () => {
              try {
                await get().syncGameStartWithRetry()
              } catch (error) {
                console.error('❌ State-based sync failed:', error)
              }
            }, 100)
          }
        }
        
        set({ isLoading: false, pendingRoomLoad: null })
        return room
      }
      
      const participants = await gameHelpers.getParticipants(room.id)
      console.log('👥 Participants loaded:', participants.length)
      
      const alreadyJoined = participants.some(p => {
        const normalizedGuestId = guestId.replace('guest_', '')
        const normalizedParticipantId = p.user_id.replace('guest_', '')
        return p.user_id === guestId || normalizedParticipantId === normalizedGuestId
      })
      
      if (!alreadyJoined && room.status === 'LOBBY') {
        console.log('🆕 Auto-joining room...')
        const { guestUsername } = get()
        await gameHelpers.autoJoinRoom(room.id, guestId, guestUsername)
        const updatedParticipants = await gameHelpers.getParticipants(room.id)
        set({ participants: updatedParticipants })
      } else {
        set({ participants })
      }
      
      set({ 
        room, 
        roomId: room.id,
        isHost: room.host_id === guestId,
        customTimings: room.custom_timings,
        traitorCount: room.traitor_count || 1,
        gamePhase: room.current_phase || null,
        isLoading: false,
        pendingRoomLoad: null
      })
      
      get().subscribeToRoom(room.id)
      
      // Sync phase timer if game is already playing
      if (room.status === 'PLAYING' && room.current_phase && room.phase_started_at) {
        get().syncPhaseTimer(room.current_phase, room.phase_started_at)
        
        // Check if we need game state
        const { mySecret } = get()
        if (!mySecret) {
          console.log('🔧 Game is PLAYING but no secret found, syncing now...')
          setTimeout(async () => {
            try {
              await get().syncGameStartWithRetry()
            } catch (error) {
              console.error('❌ State-based sync failed:', error)
            }
          }, 100)
        }
      }
      
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
      
      if (realtimeChannel) {
        realtimeHelpers.unsubscribe(realtimeChannel)
      }
      
      if (phaseInterval) {
        clearInterval(phaseInterval)
      }
      
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
        subscriptionState: null,
        showResults: false,
        gameResults: null,
        pendingRoomLoad: null,
        syncRetryCount: 0,
        myUserId: guestId,
        myUsername: guestUsername
      })
      console.log('✅ Room left successfully')
    } catch (error) {
      console.error('❌ Error leaving room:', error)
    }
  },

  // ==========================================
  // GAME FLOW (SERVER-AUTHORITATIVE)
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
      
      await gameHelpers.startGame(roomId)
      console.log('✅ Room status updated to PLAYING')
      
      await gameHelpers.assignRoles(roomId, participants, room.difficulty, room.word_pack, traitorCount)
      console.log('✅ Roles assigned and written to DB')
      
      // Wait a moment for DB to propagate
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Load my secret with retry
      const { myUserId } = get()
      const mySecret = await get().getMySecretWithRetry(roomId, myUserId)
      console.log('📝 My role:', mySecret.role, '| Word:', mySecret.secret_word)
      
      const turnOrder = participants.map(p => p.user_id)
      
      set({ 
        mySecret,
        gamePhase: 'WHISPER',
        turnOrder,
        currentTurnIndex: 0,
        isLoading: false
      })
      
      await gameHelpers.advancePhase(roomId, 'WHISPER')
      
    } catch (error) {
      console.error('❌ Error starting game:', error)
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  getMySecretWithRetry: async (roomId, userId, maxRetries = 5) => {
    const delays = [500, 1000, 2000, 3000, 4000]
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const secret = await gameHelpers.getMySecret(roomId, userId)
        
        if (secret && secret.role && secret.secret_word) {
          console.log(`✅ Secret retrieved on attempt ${attempt + 1}`)
          set({ syncRetryCount: 0 })
          return secret
        }
        
        if (attempt < maxRetries - 1) {
          const delay = delays[attempt]
          console.log(`⏳ Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`)
          set({ syncRetryCount: attempt + 1 })
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempt + 1} failed:`, error)
        if (attempt === maxRetries - 1) throw error
      }
    }
    
    throw new Error('Failed to retrieve secret after multiple retries')
  },

  syncPhaseTimer: (phaseName, phaseStartedAt) => {
    const phase = GAME_PHASES[phaseName]
    if (!phase) return
    
    const duration = get().getPhaseDuration(phaseName)
    const startTime = new Date(phaseStartedAt).getTime()
    const now = Date.now()
    const elapsed = Math.floor((now - startTime) / 1000)
    const remaining = Math.max(0, duration - elapsed)
    
    console.log(`⏰ Syncing ${phaseName}: ${remaining}s remaining (${elapsed}s elapsed)`)
    
    const { phaseInterval } = get()
    if (phaseInterval) clearInterval(phaseInterval)
    
    let timeLeft = remaining
    set({ phaseTimer: timeLeft })
    
    if (timeLeft > 0) {
      const interval = setInterval(() => {
        timeLeft -= 1
        set({ phaseTimer: timeLeft })
        
        if (timeLeft <= 0) {
          clearInterval(interval)
          console.log(`⏰ ${phaseName} phase ended`)
          
          const { isHost } = get()
          if (isHost) {
            console.log('🎯 Host triggering phase advance...')
            ;(async () => {
              try {
                await get().advancePhase()
              } catch (error) {
                console.error('❌ Error auto-advancing phase:', error)
              }
            })()
          } else {
            console.log('⏳ Waiting for host to advance phase...')
          }
        }
      }, 1000)
      
      set({ phaseInterval: interval })
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
    
    const { phaseInterval } = get()
    if (phaseInterval) clearInterval(phaseInterval)
    
    let timeLeft = duration
    set({ phaseTimer: timeLeft })
    
    const interval = setInterval(() => {
      timeLeft -= 1
      set({ phaseTimer: timeLeft })
      
      if (timeLeft <= 0) {
        clearInterval(interval)
        console.log(`⏰ ${phaseName} phase ended`)
        
        const { isHost } = get()
        if (isHost) {
          console.log('🎯 Host triggering phase advance...')
          ;(async () => {
            try {
              await get().advancePhase()
            } catch (error) {
              console.error('❌ Error auto-advancing phase:', error)
            }
          })()
        } else {
          console.log('⏳ Waiting for host to advance phase...')
        }
      }
    }, 1000)
    
    set({ phaseInterval: interval })
  },

  advancePhase: async () => {
    const { gamePhase, roomId, isHost } = get()
    
    if (!isHost) {
      console.log('⏭️ Not host, skipping phase advance')
      return
    }
    
    const currentPhase = GAME_PHASES[gamePhase]
    
    if (!currentPhase?.next) {
      console.log('🏁 Round complete, checking win conditions...')
      await get().checkWinConditions()
      return
    }
    
    console.log(`➡️ Host advancing from ${gamePhase} to ${currentPhase.next}`)
    
    await gameHelpers.advancePhase(roomId, currentPhase.next)
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
    console.log('➡️ Real Mode: Next')
    
    try {
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
        
        const updatedParticipants = participants.map(p => 
          p.user_id === eliminatedId ? { ...p, is_alive: false } : p
        )
        set({ participants: updatedParticipants })
        
        await gameHelpers.eliminatePlayer(roomId, eliminatedId)
        
        const { eliminated } = get()
        set({ eliminated: [...eliminated, eliminatedId] })
        
        const { turnOrder } = get()
        const newTurnOrder = turnOrder.filter(id => id !== eliminatedId)
        set({ turnOrder: newTurnOrder, currentTurnIndex: 0 })
      }

      const gameEnd = await gameHelpers.checkGameEnd(roomId)
      
      if (gameEnd.ended) {
        console.log('🏆 Game over! Winner:', gameEnd.winner)
        const results = { ...gameEnd, voteCounts }
        set({ showResults: true, gameResults: results })
        
        const { phaseInterval } = get()
        if (phaseInterval) clearInterval(phaseInterval)
        return
      }
      
      console.log('🔄 Game continues to next round...')
      set({ 
        gamePhase: 'WHISPER',
        hints: [],
        votes: [],
        chatMessages: [],
        currentTurnIndex: 0
      })
      
      const { isHost } = get()
      if (isHost) {
        await gameHelpers.advancePhase(roomId, 'WHISPER')
      }
      
    } catch (error) {
      console.error('❌ Error checking win conditions:', error)
      set({ error: error.message })
    }
  },

  // ==========================================
  // REAL-TIME SUBSCRIPTIONS
  // ==========================================
  
  subscribeToRoom: (roomId) => {
    const { subscriptionState, realtimeChannel: existingChannel } = get()
    
    if (subscriptionState === 'connecting' || subscriptionState === 'connected') {
      console.log('⏭️ Subscription already active, skipping')
      return
    }
    
    if (existingChannel) {
      console.log('🔄 Cleaning up previous subscription')
      realtimeHelpers.unsubscribe(existingChannel)
    }
    
    set({ subscriptionState: 'connecting' })
    console.log('📡 Subscribing to real-time updates for room:', roomId)
    
    const channel = realtimeHelpers.subscribeToRoom(roomId, {
      onRoomUpdate: (payload) => {
        console.log('🔄 Room updated:', payload.eventType)
        
        if (payload.eventType === 'UPDATE') {
          const updatedRoom = payload.new
          const currentRoom = get().room
          
          set({ room: updatedRoom })
          
          if (updatedRoom.current_phase && updatedRoom.current_phase !== get().gamePhase) {
            console.log(`🔄 Phase changed to ${updatedRoom.current_phase} via realtime`)
            set({ gamePhase: updatedRoom.current_phase })
            
            if (updatedRoom.phase_started_at) {
              get().syncPhaseTimer(updatedRoom.current_phase, updatedRoom.phase_started_at)
            }
            
            if (updatedRoom.current_phase === 'DEBATE') {
              get().loadHints()
              get().loadChatMessages()
            } else if (updatedRoom.current_phase === 'REVEAL') {
              get().loadVotes()
            }
          }
          
          if (currentRoom?.status === 'LOBBY' && updatedRoom.status === 'PLAYING') {
            console.log('🎮 Game started by host, syncing...')
            get().syncGameStartWithRetry()
          }
        }
      },
      
      onParticipantUpdate: async (payload) => {
        console.log('👥 Participants updated')
        const roomId = get().roomId
        if (!roomId) return
        const participants = await gameHelpers.getParticipants(roomId)
        set({ participants })
      },
      
      onHintSubmitted: async (payload) => {
        console.log('💬 New hint submitted')
        await get().loadHints()
      },
      
      onVoteSubmitted: async (payload) => {
        console.log('🗳️ New vote submitted')
        const { gamePhase } = get()
        if (gamePhase === 'REVEAL') {
          await get().loadVotes()
        } else {
          console.log('🔒 Votes hidden until REVEAL')
        }
      },
      
      onChatMessage: async (payload) => {
        console.log('💬 New chat message')
        await get().loadChatMessages()
      }
    })
    
    set({ 
      realtimeChannel: channel, 
      isConnected: true,
      subscriptionState: 'connected'
    })
    console.log('✅ Real-time subscribed and connected')
  },

  syncGameStartWithRetry: async () => {
    const { roomId, myUserId, participants } = get()
    console.log('🔄 Syncing game start with retry...')
    
    try {
      const mySecret = await get().getMySecretWithRetry(roomId, myUserId)
      
      console.log('📝 Synced - My role:', mySecret.role, '| Word:', mySecret.secret_word)
      
      const turnOrder = participants.map(p => p.user_id)
      console.log('📝 Turn order initialized:', turnOrder) 
      
      set({ 
        mySecret,
        gamePhase: 'WHISPER',
        turnOrder,
        currentTurnIndex: 0
      })
      
      const room = get().room
      if (room?.phase_started_at) {
        get().syncPhaseTimer('WHISPER', room.phase_started_at)
      } else {
        get().startPhaseTimer('WHISPER')
      }
      
    } catch (error) {
      console.error('❌ Error syncing game start after retries:', error)
      set({ error: 'Failed to sync game start. Please refresh.' })
    }
  },

  syncGameStart: async () => {
    await get().syncGameStartWithRetry()
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