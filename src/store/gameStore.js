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
  guestUsername: localStorage.getItem('username') || '',
  isHost: false,


  // Game state
  gamePhase: null,
  phaseTimer: 0,
  phaseInterval: null,
  mySecret: null,
  hints: [],
  votes: [],
  eliminated: [],
  
  // 🔧 CYCLE 2 FIX: Track currentRound to eliminate N+1 queries
  currentRound: 1,
  
  // Custom settings
  customTimings: null,
  traitorCount: 1,
  
  // Turn-based hints (kept for display purposes, but turn is calculated from hints.length)
  currentTurnIndex: 0,
  turnOrder: [],
  
  // Chat messages
  chatMessages: [],
  
  // Real-time
  realtimeChannel: null,
  isConnected: false,
  subscriptionState: null,
  activeChannelId: null, // ✅ BUG FIX #5: Track active channel to prevent duplicates
  
  // ✅ FIX #5: Heartbeat system
  heartbeatInterval: null,
  lastSyncAttempt: 0, // Rate limit auto-sync
  
  // ✅ BUG FIX #5: Debounce participant updates
  participantUpdateTimeout: null,
  
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
  
  setGuestUsername: (username) => {
    const trimmed = username.trim()
    localStorage.setItem('username', trimmed)
    set({ guestUsername: trimmed, myUsername: trimmed })
    console.log('📝 Username updated:', trimmed)
  },


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
      console.log('🆕 Generated new username (no custom username set)')
    }
    
    localStorage.setItem('guest_id', guestId)
    localStorage.setItem('username', guestUsername)
    
    set({ myUserId: guestId, myUsername: guestUsername, guestUsername })
    console.log('👤 Guest initialized:', guestUsername, `(${guestId.slice(0, 20)}...)`)
    return { guestId, guestUsername }
  },


  // ==========================================
  // ✅ FIX #5: HEARTBEAT SYSTEM
  // ==========================================
  
  startHeartbeat: () => {
    const { heartbeatInterval, roomId, myUserId } = get()
    
    // Clear existing heartbeat
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
    }
    
    if (!roomId || !myUserId) {
      console.log('⚠️ Cannot start heartbeat: missing roomId or userId')
      return
    }
    
    console.log('💓 Starting heartbeat system')
    
    // Send heartbeat every 5 seconds
    const interval = setInterval(async () => {
      try {
        const { roomId: currentRoomId, myUserId: currentUserId } = get()
        
        if (!currentRoomId || !currentUserId) {
          console.log('💔 Heartbeat stopped: no room or user')
          clearInterval(interval)
          return
        }
        
        // Update last_seen timestamp
        await supabase
          .from('room_participants')
          .update({ last_seen: new Date().toISOString() })
          .eq('room_id', currentRoomId)
          .eq('user_id', currentUserId)
        
        // console.log('💓 Heartbeat sent') // Too verbose, comment out
      } catch (error) {
        console.error('❌ Heartbeat error:', error)
      }
    }, 5000) // Every 5 seconds
    
    set({ heartbeatInterval: interval })
  },
  
  stopHeartbeat: () => {
    const { heartbeatInterval } = get()
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      set({ heartbeatInterval: null })
      console.log('💔 Heartbeat stopped')
    }
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
      
      // 🔧 CYCLE 2 FIX: Initialize currentRound
      set({ 
        room, 
        roomId: room.id,
        participants,
        isHost: true,
        customTimings: room.custom_timings,
        traitorCount: room.traitor_count || 1,
        currentRound: room.current_round || 1,
        isLoading: false
      })
      
      get().subscribeToRoom(room.id)
      get().startHeartbeat() // ✅ Start heartbeat
      
      return room
    } catch (error) {
      console.error('❌ Error creating room:', error)
      set({ error: error.message, isLoading: false })
      throw error
    }
  },


  joinRoom: async (roomCode) => {
    console.log('🚺 Joining room:', roomCode)
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
      
      // 🔧 CYCLE 2 FIX: Initialize currentRound
      set({ 
        room, 
        roomId: room.id,
        participants,
        isHost: false,
        customTimings: room.custom_timings,
        traitorCount: room.traitor_count || 1,
        currentRound: room.current_round || 1,
        isLoading: false
      })
      
      get().subscribeToRoom(room.id)
      get().startHeartbeat() // ✅ Start heartbeat
      
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
      
      if (!force && currentRoomId === room.id && realtimeChannel) {
        console.log('⏭️ Room already loaded, checking if sync needed...')
        
        if (room.status === 'PLAYING' && room.current_phase) {
          const { mySecret } = get()
          if (!mySecret) {
            console.log('🔧 Game is PLAYING but no secret! Syncing before return...')
            set({ 
              gamePhase: room.current_phase,
              currentRound: room.current_round || 1  // 🔧 CYCLE 2 FIX
            })
            
            if (room.phase_started_at) {
              get().syncPhaseTimer(room.current_phase, room.phase_started_at)
            }
            
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
      
      // ✅ FIX #2: Validate participants during PLAYING status
      if (room.status === 'PLAYING' && participants.length === 0) {
        console.error('🚨 CRITICAL: Game is PLAYING but 0 participants loaded!')
        console.error('This indicates a broken state. Possible causes:')
        console.error('  1. Player was removed during React remount (StrictMode bug)')
        console.error('  2. Database sync issue')
        console.error('  3. Realtime subscription missed participant updates')
        
        set({ 
          error: 'Game state corrupted: no players found. Please refresh the page.',
          isLoading: false,
          pendingRoomLoad: null
        })
        
        throw new Error('CRITICAL: participants.length === 0 during PLAYING status')
      }
      
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
      
      // 🔧 CYCLE 2 FIX: Initialize currentRound
      set({ 
        room, 
        roomId: room.id,
        isHost: room.host_id === guestId,
        customTimings: room.custom_timings,
        traitorCount: room.traitor_count || 1,
        gamePhase: room.current_phase || null,
        currentRound: room.current_round || 1,
        isLoading: false,
        pendingRoomLoad: null
      })
      
      get().subscribeToRoom(room.id)
      get().startHeartbeat() // ✅ Start heartbeat
      
      if (room.status === 'PLAYING' && room.current_phase && room.phase_started_at) {
        get().syncPhaseTimer(room.current_phase, room.phase_started_at)
        
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
      
      get().stopHeartbeat() // ✅ Stop heartbeat
      
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
        currentRound: 1,  // 🔧 CYCLE 2 FIX: Reset currentRound
        chatMessages: [],
        realtimeChannel: null,
        isConnected: false,
        subscriptionState: null,
        activeChannelId: null,  // ✅ BUG FIX #5: Reset channel ID
        showResults: false,
        gameResults: null,
        pendingRoomLoad: null,
        syncRetryCount: 0,
        lastSyncAttempt: 0,
        myUserId: guestId,
        myUsername: guestUsername,
        guestUsername: localStorage.getItem('username') || ''
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
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const { myUserId } = get()
      const mySecret = await get().getMySecretWithRetry(roomId, myUserId)
      console.log('📝 My role:', mySecret.role, '| Word:', mySecret.secret_word)
      
      const turnOrder = participants.map(p => p.user_id)
      
      set({ 
        mySecret,
        gamePhase: 'WHISPER',
        turnOrder,
        currentTurnIndex: 0,
        currentRound: 1,  // 🔧 CYCLE 2 FIX: Set currentRound on game start
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
    
    // ✅ BUG FIX #9: Clear interval BEFORE setting gamePhase to prevent stale interval checks
    const { phaseInterval } = get()
    if (phaseInterval) {
      clearInterval(phaseInterval)
      set({ phaseInterval: null })
      console.log('🗑️ Cleared stale phase interval')
    }
    
    let timeLeft = remaining
    set({ phaseTimer: timeLeft })
    
    if (timeLeft > 0) {
      const interval = setInterval(() => {
        timeLeft -= 1
        set({ phaseTimer: timeLeft })
        
        // ✅ BUG FIX #9: Re-fetch current phase to prevent stale checks
        const currentPhase = get().gamePhase
        
        // ✅ BUG FIX #9: Only check early completion if we're STILL in the same phase
        if (currentPhase === phaseName && get().canAdvancePhaseEarly()) {
          clearInterval(interval)
          set({ phaseInterval: null })
          console.log(`⚡ ${phaseName} complete early! All players submitted.`)
          
          const { isHost } = get()
          if (isHost) {
            console.log('🎯 Host triggering early phase advance...')
            ;(async () => {
              try {
                await get().advancePhase()
              } catch (error) {
                console.error('❌ Error auto-advancing phase:', error)
              }
            })()
          }
          return
        }
        
        // ✅ BUG FIX #9: Safety check - if phase changed externally, stop this timer
        if (currentPhase !== phaseName) {
          console.log(`🚫 Phase mismatch: interval for ${phaseName} but current is ${currentPhase}. Stopping stale timer.`)
          clearInterval(interval)
          set({ phaseInterval: null })
          return
        }
        
        if (timeLeft <= 0) {
          clearInterval(interval)
          set({ phaseInterval: null })
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
            
            // ✅ NEW FIX: Add fallback polling to recover from missed realtime events
            setTimeout(async () => {
              try {
                const { roomId, gamePhase: currentPhase } = get()
                if (!roomId) return
                
                const room = await gameHelpers.getRoom(roomId)
                
                if (room.current_phase && room.current_phase !== currentPhase) {
                  console.log(`🔧 Phase mismatch detected! Server: ${room.current_phase}, Local: ${currentPhase}`)
                  console.log(`🔄 Auto-syncing to server phase: ${room.current_phase}`)
                  
                  set({ 
                    room, 
                    gamePhase: room.current_phase,
                    currentRound: room.current_round || get().currentRound
                  })
                  
                  if (room.phase_started_at) {
                    get().syncPhaseTimer(room.current_phase, room.phase_started_at)
                  }
                }
              } catch (error) {
                console.error('❌ Failed to fetch room state for sync:', error)
              }
            }, 2000) // Poll 2 seconds after timer expires
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


  canAdvancePhaseEarly: () => {
    const { gamePhase, hints, votes, participants } = get()
    const alivePlayers = participants.filter(p => p.is_alive)
    
    // ✅ NEW FIX: DEBATE phase should NEVER auto-advance early
    if (gamePhase === 'DEBATE') {
      return false // Always wait for full timer
    }
    
    if (gamePhase === 'HINT_DROP') {
      const allHintsSubmitted = hints.length >= alivePlayers.length
      if (allHintsSubmitted) {
        console.log(`✅ All ${alivePlayers.length} players submitted hints (${hints.length} total)`)
        return true
      }
    }
    
    if (gamePhase === 'VERDICT') {
      const allVotesSubmitted = votes.length >= alivePlayers.length
      if (allVotesSubmitted) {
        console.log(`✅ All ${alivePlayers.length} players voted (${votes.length} total)`)
        return true
      }
    }
    
    return false
  },


  startPhaseTimer: (phaseName) => {
    const phase = GAME_PHASES[phaseName]
    if (!phase) return
    
    const duration = get().getPhaseDuration(phaseName)
    console.log(`⏰ Starting ${phaseName} phase (${duration}s)`)
    
    // ✅ BUG FIX #9: Clear interval BEFORE setting gamePhase to prevent stale interval checks
    const { phaseInterval } = get()
    if (phaseInterval) {
      clearInterval(phaseInterval)
      set({ phaseInterval: null })
      console.log('🗑️ Cleared stale phase interval')
    }
    
    let timeLeft = duration
    set({ phaseTimer: timeLeft })
    
    const interval = setInterval(() => {
      timeLeft -= 1
      set({ phaseTimer: timeLeft })
      
      // ✅ BUG FIX #9: Re-fetch current phase to prevent stale checks
      const currentPhase = get().gamePhase
      
      // ✅ BUG FIX #9: Only check early completion if we're STILL in the same phase
      if (currentPhase === phaseName && get().canAdvancePhaseEarly()) {
        clearInterval(interval)
        set({ phaseInterval: null })
        console.log(`⚡ ${phaseName} complete early! All players submitted.`)
        
        const { isHost } = get()
        if (isHost) {
          console.log('🎯 Host triggering early phase advance...')
          ;(async () => {
            try {
              await get().advancePhase()
            } catch (error) {
              console.error('❌ Error auto-advancing phase:', error)
            }
          })()
        }
        return
      }
      
      // ✅ BUG FIX #9: Safety check - if phase changed externally, stop this timer
      if (currentPhase !== phaseName) {
        console.log(`🚫 Phase mismatch: interval for ${phaseName} but current is ${currentPhase}. Stopping stale timer.`)
        clearInterval(interval)
        set({ phaseInterval: null })
        return
      }
      
      if (timeLeft <= 0) {
        clearInterval(interval)
        set({ phaseInterval: null })
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
          
          // ✅ NEW FIX: Add fallback polling to recover from missed realtime events
          setTimeout(async () => {
            try {
              const { roomId, gamePhase: currentPhase } = get()
              if (!roomId) return
              
              const room = await gameHelpers.getRoom(roomId)
              
              if (room.current_phase && room.current_phase !== currentPhase) {
                console.log(`🔧 Phase mismatch detected! Server: ${room.current_phase}, Local: ${currentPhase}`)
                console.log(`🔄 Auto-syncing to server phase: ${room.current_phase}`)
                
                set({ 
                  room, 
                  gamePhase: room.current_phase,
                  currentRound: room.current_round || get().currentRound
                })
                
                if (room.phase_started_at) {
                  get().syncPhaseTimer(room.current_phase, room.phase_started_at)
                }
              }
            } catch (error) {
              console.error('❌ Failed to fetch room state for sync:', error)
            }
          }, 2000) // Poll 2 seconds after timer expires
        }
      }
    }, 1000)
    
    set({ phaseInterval: interval })
  },


  // ✅ BUG FIX #6: Expose stopPhaseTimer for REAL mode early completion
  stopPhaseTimer: () => {
    const { phaseInterval } = get()
    if (phaseInterval) {
      clearInterval(phaseInterval)
      set({ phaseInterval: null, phaseTimer: 0 })
      console.log('⏸️ Phase timer stopped manually')
    }
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
      set({ phaseInterval: null })
    }
    await get().advancePhase()
  },


  // ==========================================
  // TURN-BASED HINTS (SERVER-AUTHORITATIVE)
  // ==========================================
  
  getCurrentTurnPlayer: () => {
    const { turnOrder, hints, participants } = get()
    
    // ✅ FIX #3: Auto-sync if turnOrder is empty (but don't call set() here!)
    if (!turnOrder || turnOrder.length === 0) {
      console.log('🚨 Turn order is empty! Attempting auto-sync...')
      
      // Rate-limit sync attempts (max 1 per 5 seconds)
      const { lastSyncAttempt } = get()
      const now = Date.now()
      
      if (now - lastSyncAttempt > 5000) {
        // ✅ BUG FIX #7: Use getState() instead of set() to avoid setState during render
        const state = useGameStore.getState()
        state.lastSyncAttempt = now
        
        console.log('🔄 Triggering syncGameStartWithRetry()...')
        
        setTimeout(async () => {
          try {
            await get().syncGameStartWithRetry()
            console.log('✅ Auto-sync completed successfully')
          } catch (error) {
            console.error('❌ Auto-sync failed:', error)
          }
        }, 100)
      } else {
        console.log('⚠️ Auto-sync rate-limited, waiting...')
      }
      
      return null
    }
    
    const currentTurnIndex = hints.length % turnOrder.length
    const currentUserId = turnOrder[currentTurnIndex]
    return participants.find(p => p.user_id === currentUserId)
  },
  
  isMyTurnToHint: () => {
    const { turnOrder, hints, myUserId, gamePhase } = get()
    if (gamePhase !== 'HINT_DROP') return false
    
    // ✅ FIX #3: Auto-sync if turnOrder is empty
    if (!turnOrder || turnOrder.length === 0) {
      // 🔧 CYCLE 1 FIX: Removed console.log spam - was logging 50+ times/sec
      
      const { lastSyncAttempt } = get()
      const now = Date.now()
      
      if (now - lastSyncAttempt > 5000) {
        set({ lastSyncAttempt: now })
        console.log('🔄 Turn order empty, triggering sync...')
        
        setTimeout(async () => {
          try {
            await get().syncGameStartWithRetry()
          } catch (error) {
            console.error('❌ Auto-sync failed:', error)
          }
        }, 100)
      }
      
      return false
    }
    
    const currentTurnIndex = hints.length % turnOrder.length
    const currentUserId = turnOrder[currentTurnIndex]
    
    // 🔧 CYCLE 1 FIX: Removed excessive console.log - only log on turn changes
    const { currentTurnIndex: prevTurnIndex } = get()
    if (currentTurnIndex !== prevTurnIndex) {
      console.log(`🔄 Turn ${currentTurnIndex}: ${currentUserId === myUserId ? 'MY TURN' : 'waiting'}`)
    }
    
    return currentUserId === myUserId
  },
  
  advanceTurn: () => {
    const { currentTurnIndex, turnOrder } = get()
    if (!turnOrder || turnOrder.length === 0) return
    const nextIndex = (currentTurnIndex + 1) % turnOrder.length
    console.log(`🔄 Turn ${currentTurnIndex} -> ${nextIndex} (display only)`)
    set({ currentTurnIndex: nextIndex })
  },


  // ==========================================
  // HINTS
  // ==========================================
  
  submitHint: async (hintText) => {
    // 🔧 CYCLE 2 FIX: Pass currentRound to eliminate N+1 query
    const { roomId, myUserId, currentRound } = get()
    console.log('💬 Submitting hint:', hintText)
    
    try {
      await gameHelpers.submitHint(roomId, myUserId, hintText, currentRound)
      await get().loadHints()
      console.log('✅ Hint submitted')
    } catch (error) {
      console.error('❌ Error submitting hint:', error)
      set({ error: error.message })
      throw error
    }
  },
  
  submitRealModeNext: async () => {
    // 🔧 CYCLE 2 FIX: Pass currentRound to eliminate N+1 query
    const { roomId, myUserId, currentRound } = get()
    console.log('➡️ Real Mode: Next')
    
    try {
      await gameHelpers.submitHint(roomId, myUserId, '[VERBAL]', currentRound)
      await get().loadHints()
      console.log('✅ Turn advanced')
    } catch (error) {
      console.error('❌ Error advancing turn:', error)
      set({ error: error.message })
      throw error
    }
  },


  loadHints: async () => {
    // 🔧 CYCLE 2 FIX: Pass currentRound to eliminate N+1 query
    const { roomId, currentRound } = get()
    
    try {
      const hints = await gameHelpers.getHints(roomId, currentRound)
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
    // 🔧 CYCLE 2 FIX: Pass currentRound to eliminate N+1 query
    const { roomId, myUserId, myUsername, currentRound } = get()
    console.log('💬 Sending chat message:', message)
    
    try {
      await gameHelpers.sendChatMessage(roomId, myUserId, myUsername, message, currentRound)
      await get().loadChatMessages()
      console.log('✅ Chat message sent')
    } catch (error) {
      console.error('❌ Error sending chat message:', error)
      set({ error: error.message })
      throw error
    }
  },
  
  loadChatMessages: async () => {
    // 🔧 CYCLE 2 FIX: Pass currentRound to eliminate N+1 query
    const { roomId, currentRound } = get()
    
    try {
      const messages = await gameHelpers.getChatMessages(roomId, currentRound)
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
    // 🔧 CYCLE 2 FIX: Pass currentRound to eliminate N+1 query
    const { roomId, myUserId, currentRound } = get()
    console.log('🗳️ Submitting vote for:', targetId)
    
    try {
      await gameHelpers.submitVote(roomId, myUserId, targetId, currentRound)
      await get().loadVotes()
      console.log('✅ Vote submitted')
    } catch (error) {
      console.error('❌ Error submitting vote:', error)
      set({ error: error.message })
      throw error
    }
  },


  loadVotes: async () => {
    // 🔧 CYCLE 2 FIX: Pass currentRound to eliminate N+1 query
    const { roomId, currentRound } = get()
    
    try {
      const votes = await gameHelpers.getVotes(roomId, currentRound)
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
    // 🔧 CYCLE 2 FIX: Pass currentRound to eliminate N+1 query
    const { roomId, participants, currentRound } = get()
    console.log('🎯 Checking win conditions...')
    
    try {
      const results = await gameHelpers.calculateVoteResults(roomId, currentRound)
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
      } else {
        console.log('🤝 Vote resulted in a tie - no elimination')
      }


      const gameEnd = await gameHelpers.checkGameEnd(roomId)
      
      if (gameEnd.ended) {
        console.log('🏆 Game over! Winner:', gameEnd.winner)
        
        await gameHelpers.endGame(roomId, gameEnd.winner, gameEnd.traitorIds)
        console.log('✅ Game end written to database')
        
        const finalResults = { ...gameEnd, voteCounts }
        set({ showResults: true, gameResults: finalResults })
        
        const { phaseInterval } = get()
        if (phaseInterval) {
          clearInterval(phaseInterval)
          set({ phaseInterval: null })
        }
        
        get().stopHeartbeat() // ✅ Stop heartbeat when game ends
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
    const { subscriptionState, realtimeChannel: existingChannel, activeChannelId } = get()
    
    // ✅ BUG FIX #5: Prevent duplicate subscriptions
    if (activeChannelId === roomId && (subscriptionState === 'connecting' || subscriptionState === 'connected')) {
      console.log('⏭️ Subscription already active for this room, skipping')
      return
    }
    
    if (existingChannel) {
      console.log('🔄 Cleaning up previous subscription')
      realtimeHelpers.unsubscribe(existingChannel)
    }
    
    set({ subscriptionState: 'connecting', activeChannelId: roomId })
    console.log('📡 Subscribing to real-time updates for room:', roomId)
    
    const channel = realtimeHelpers.subscribeToRoom(roomId, {
      onRoomUpdate: (payload) => {
        console.log('🔄 Room updated:', payload.eventType)
        
        if (payload.eventType === 'UPDATE') {
          const updatedRoom = payload.new
          const currentRoom = get().room
          
          // 🔧 CYCLE 2 FIX: Update currentRound when room updates
          if (updatedRoom.current_round !== currentRoom?.current_round) {
            console.log(`🔄 Round updated: ${currentRoom?.current_round} → ${updatedRoom.current_round}`)
            set({ currentRound: updatedRoom.current_round })
          }
          
          set({ room: updatedRoom })
          
          if (currentRoom?.status === 'PLAYING' && updatedRoom.status === 'FINISHED') {
            console.log('🏁 Game ended via realtime! Navigating to results...')
            
            ;(async () => {
              try {
                const { currentRound } = get()
                const votes = await gameHelpers.getVotes(roomId, currentRound)
                const results = await gameHelpers.calculateVoteResults(roomId, currentRound)
                const gameEnd = await gameHelpers.checkGameEnd(roomId)
                
                const finalResults = {
                  ended: true,
                  winner: updatedRoom.winner || gameEnd.winner,
                  traitorIds: gameEnd.traitorIds,
                  voteCounts: results.voteCounts
                }
                
                set({ showResults: true, gameResults: finalResults })
                get().stopHeartbeat() // ✅ Stop heartbeat when game ends
                console.log('✅ Results loaded for non-host player')
              } catch (error) {
                console.error('❌ Error loading final results:', error)
              }
            })()
          }
          
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
        // ✅ BUG FIX #7: Fixed heartbeat filter - check if ONLY last_seen changed
        if (payload.eventType === 'UPDATE') {
          const oldData = payload.old || {}
          const newData = payload.new || {}
          
          // Get all changed fields
          const changedFields = Object.keys(newData).filter(
            key => oldData[key] !== newData[key]
          )
          
          // If ONLY last_seen changed, skip update
          if (changedFields.length === 1 && changedFields[0] === 'last_seen') {
            // Silent heartbeat update - no UI re-render needed
            return
          }
          
          // If other fields changed (is_alive, username, etc.), log and update
          console.log('👥 Participants updated (meaningful change)')
        } else {
          console.log('👥 Participants updated (INSERT/DELETE)')
        }
        
        // ✅ BUG FIX #6: Increased debounce to 500ms for better batching
        const { participantUpdateTimeout } = get()
        if (participantUpdateTimeout) {
          clearTimeout(participantUpdateTimeout)
        }
        
        const timeout = setTimeout(async () => {
          const roomId = get().roomId
          if (!roomId) return
          const participants = await gameHelpers.getParticipants(roomId)
          set({ participants })
        }, 500) // ✅ BUG FIX #6: Increased from 200ms to 500ms
        
        set({ participantUpdateTimeout: timeout })
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
    
    // ✅ FIX #2: Validate participants before sync
    if (!participants || participants.length === 0) {
      console.error('🚨 Cannot sync: participants array is empty!')
      throw new Error('Cannot sync game start: no participants found')
    }
    
    try {
      // ✅ BUG FIX #8: Fetch room to get current phase (don't hardcode WHISPER!)
      const room = await gameHelpers.getRoom(roomId)
      const currentPhase = room.current_phase || 'WHISPER'
      
      const mySecret = await get().getMySecretWithRetry(roomId, myUserId)
      
      console.log('📝 Synced - My role:', mySecret.role, '| Word:', mySecret.secret_word)
      
      const turnOrder = participants.map(p => p.user_id)
      console.log('📝 Turn order initialized:', turnOrder) 
      
      set({ 
        mySecret,
        gamePhase: currentPhase,  // ✅ BUG FIX #8: Use actual phase from DB
        turnOrder,
        currentTurnIndex: 0
      })
      
      if (room.phase_started_at) {
        get().syncPhaseTimer(currentPhase, room.phase_started_at)
      } else {
        get().startPhaseTimer(currentPhase)
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