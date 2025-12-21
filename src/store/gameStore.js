import { create } from 'zustand'
import { supabase, gameHelpers, realtimeHelpers } from '../lib/supabase'
import { createBotSquad, BotManager } from '../lib/aiBot'

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

  // TEST MODE
  isTestMode: false,
  bots: [],
  botManager: null,
  botSecrets: {},

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
  // TEST MODE
  // ==========================================

  startTestMode: async () => {
    console.log('🤖 Starting test mode...')
    set({ isLoading: true, error: null, isTestMode: true })
    
    try {
      const { guestId, guestUsername } = get().initializeGuest()
      console.log(`👤 You: ${guestUsername} (${guestId})`)
      
      // Create bots
      const bots = createBotSquad()
      const botManager = new BotManager(bots)
      console.log(`🤖 Created ${bots.length} AI bots`)
      
      // Create mock room
      const mockRoom = {
        id: `test_room_${Date.now()}`,
        room_code: 'TEST00',
        host_id: guestId,
        status: 'LOBBY',
        game_mode: 'SILENT',
        difficulty: 'MEDIUM',
        word_pack: 'GENERAL',
        max_players: 8,
        created_at: new Date().toISOString()
      }

      // Create mock participants (you + 4 bots)
      const mockParticipants = [
        {
          id: `p_${guestId}`,
          room_id: mockRoom.id,
          user_id: guestId,
          username: guestUsername,
          is_alive: true,
          joined_at: new Date().toISOString()
        },
        ...bots.map(bot => ({
          id: `p_${bot.id}`,
          room_id: mockRoom.id,
          user_id: bot.id,
          username: bot.name,
          is_alive: true,
          joined_at: new Date().toISOString()
        }))
      ]

      console.log(`✅ Created ${mockParticipants.length} participants:`, 
        mockParticipants.map(p => p.username))

      // Set all state at once
      set({
        room: mockRoom,
        roomId: mockRoom.id,
        participants: mockParticipants,
        bots,
        botManager,
        isHost: true,
        isLoading: false,
        isConnected: true // Important: mark as connected immediately
      })

      console.log('🎮 Test mode initialized successfully!')
      return mockRoom
      
    } catch (error) {
      console.error('❌ Error starting test mode:', error)
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  startTestGame: async () => {
    console.log('🎮 Starting test game...')
    set({ isLoading: true })
    
    try {
      const { participants, myUserId, bots } = get()
      
      if (participants.length === 0) {
        throw new Error('No participants found!')
      }

      // Randomly select traitor
      const allPlayers = participants
      const traitorIndex = Math.floor(Math.random() * allPlayers.length)
      const traitorId = allPlayers[traitorIndex].user_id

      console.log(`🎲 Selecting traitor: ${traitorIndex + 1}/${allPlayers.length}`)
      console.log(`🕵️ Traitor: ${allPlayers[traitorIndex].username} (${traitorId})`)

      // Mock word pairs
      const wordPair = {
        main_word: 'Ocean',
        traitor_word: 'Sea'
      }

      // Assign roles
      const myRole = traitorId === myUserId ? 'TRAITOR' : 'CITIZEN'
      const myWord = traitorId === myUserId ? wordPair.traitor_word : wordPair.main_word

      console.log(`👤 Your role: ${myRole}`)
      console.log(`📝 Your word: "${myWord}"`)

      // Store bot secrets
      const botSecrets = {}
      bots.forEach(bot => {
        const isBotTraitor = traitorId === bot.id
        botSecrets[bot.id] = {
          role: isBotTraitor ? 'TRAITOR' : 'CITIZEN',
          secret_word: isBotTraitor ? wordPair.traitor_word : wordPair.main_word
        }
        bot.role = botSecrets[bot.id].role
        bot.secretWord = botSecrets[bot.id].secret_word
      })

      // Update room status
      const { room } = get()
      set({ 
        room: { ...room, status: 'PLAYING' },
        mySecret: { role: myRole, secret_word: myWord },
        gamePhase: 'WHISPER',
        botSecrets,
        isLoading: false
      })

      console.log('✅ Test game started! Beginning WHISPER phase...')

      // Start phase timer
      get().startPhaseTimer('WHISPER')
      
    } catch (error) {
      console.error('❌ Error starting test game:', error)
      set({ error: error.message, isLoading: false })
      throw error
    }
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
    const { roomId, myUserId, realtimeChannel, isTestMode } = get()
    
    try {
      if (!isTestMode && roomId && myUserId) {
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
        gameResults: null,
        isTestMode: false,
        bots: [],
        botManager: null,
        botSecrets: {}
      })
    } catch (error) {
      console.error('Error leaving room:', error)
    }
  },

  // ==========================================
  // GAME FLOW
  // ==========================================
  
  startGame: async () => {
    const { isTestMode } = get()
    
    if (isTestMode) {
      return get().startTestGame()
    }

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

    // Trigger bot actions for test mode
    const { isTestMode, botManager } = get()
    if (isTestMode && botManager) {
      const gameState = {
        roomId: get().roomId,
        hints: get().hints,
        votes: get().votes,
        participants: get().participants,
        botSecrets: get().botSecrets
      }
      botManager.handlePhase(phaseName, gameState, {
        submitHint: get().submitTestHint,
        submitVote: get().submitTestVote
      })
    }
  },

  advancePhase: async () => {
    const { gamePhase, roomId, isTestMode } = get()
    const currentPhase = GAME_PHASES[gamePhase]
    
    if (!currentPhase?.next) {
      // Game round complete, check win conditions
      await get().checkWinConditions()
      return
    }
    
    console.log(`➡️ Advancing from ${gamePhase} to ${currentPhase.next}`)
    set({ gamePhase: currentPhase.next })
    
    // Load data for new phase
    if (currentPhase.next === 'DEBATE') {
      if (!isTestMode) await get().loadHints()
    } else if (currentPhase.next === 'REVEAL') {
      if (!isTestMode) await get().loadVotes()
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
    const { roomId, myUserId, isTestMode } = get()
    
    if (isTestMode) {
      return get().submitTestHint(roomId, myUserId, hintText)
    }
    
    try {
      await gameHelpers.submitHint(roomId, myUserId, hintText)
      await get().loadHints()
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  submitTestHint: async (roomId, userId, hintText) => {
    const { hints } = get()
    const newHint = {
      id: `hint_${Date.now()}_${Math.random()}`,
      room_id: roomId,
      user_id: userId,
      hint_text: hintText,
      submitted_at: new Date().toISOString()
    }
    set({ hints: [...hints, newHint] })
    return newHint
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
    const { roomId, myUserId, isTestMode } = get()
    
    if (isTestMode) {
      return get().submitTestVote(roomId, myUserId, targetId)
    }
    
    try {
      await gameHelpers.submitVote(roomId, myUserId, targetId)
      await get().loadVotes()
    } catch (error) {
      set({ error: error.message })
      throw error
    }
  },

  submitTestVote: async (roomId, voterId, targetId) => {
    const { votes } = get()
    const newVote = {
      id: `vote_${Date.now()}_${Math.random()}`,
      room_id: roomId,
      voter_id: voterId,
      target_id: targetId,
      voted_at: new Date().toISOString()
    }
    set({ votes: [...votes, newVote] })
    return newVote
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
    const { roomId, isTestMode, participants, botSecrets, mySecret } = get()
    
    try {
      let eliminatedId, voteCounts

      if (isTestMode) {
        // Calculate votes locally
        const { votes } = get()
        voteCounts = {}
        votes.forEach(vote => {
          voteCounts[vote.target_id] = (voteCounts[vote.target_id] || 0) + 1
        })
        
        let maxVotes = 0
        Object.entries(voteCounts).forEach(([id, count]) => {
          if (count > maxVotes) {
            maxVotes = count
            eliminatedId = id
          }
        })

        console.log('📊 Vote counts:', voteCounts)
        console.log('💀 Eliminated:', participants.find(p => p.user_id === eliminatedId)?.username)
      } else {
        const results = await gameHelpers.calculateVoteResults(roomId)
        eliminatedId = results.eliminatedId
        voteCounts = results.voteCounts
      }
      
      if (eliminatedId) {
        // Eliminate player
        const updatedParticipants = participants.map(p => 
          p.user_id === eliminatedId ? { ...p, is_alive: false } : p
        )
        set({ participants: updatedParticipants })
        
        if (!isTestMode) {
          await gameHelpers.eliminatePlayer(roomId, eliminatedId)
        }
        
        // Add to eliminated list
        const { eliminated } = get()
        set({ eliminated: [...eliminated, eliminatedId] })
      }
      
      // Check if game should end
      const alive = participants.filter(p => p.is_alive && p.user_id !== eliminatedId)
      
      // Find traitor
      let traitorId
      if (isTestMode) {
        traitorId = mySecret?.role === 'TRAITOR' ? get().myUserId : 
                   Object.entries(botSecrets).find(([id, secret]) => secret.role === 'TRAITOR')?.[0]
      } else {
        const gameEnd = await gameHelpers.checkGameEnd(roomId)
        if (gameEnd.ended) {
          const results = { ...gameEnd, voteCounts }
          set({ showResults: true, gameResults: results })
          
          const { phaseInterval } = get()
          if (phaseInterval) clearInterval(phaseInterval)
          return
        }
      }

      const isTraitorAlive = alive.some(p => p.user_id === traitorId)
      
      console.log(`👥 Alive: ${alive.length}/${participants.length}`)
      console.log(`🕵️ Traitor alive: ${isTraitorAlive}`)

      // Citizens win if traitor eliminated
      if (!isTraitorAlive) {
        console.log('🏆 Citizens win! Traitor was eliminated!')
        set({ 
          showResults: true,
          gameResults: { winner: 'CITIZENS', traitorId, voteCounts }
        })
        const { phaseInterval } = get()
        if (phaseInterval) clearInterval(phaseInterval)
        return
      }
      
      // Traitor wins if only 2 players left
      if (alive.length <= 2) {
        console.log('🏆 Traitor wins! Only 2 players remain!')
        set({ 
          showResults: true,
          gameResults: { winner: 'TRAITOR', traitorId, voteCounts }
        })
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
      const mySecret = await gameHelpers.getMySecret(roomId, myUserId)
      
      set({ 
        mySecret,
        gamePhase: 'WHISPER'
      })
      
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