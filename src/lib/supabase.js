import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Real-time features disabled.')
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': 'wordtraitor-web',
          'Connection': 'keep-alive'
        }
      }
    })
  : null

export const isSupabaseConfigured = () => {
  return supabase !== null
}

function isUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

async function withRetry(promiseFn, operationName, maxRetries = 3, baseDelay = 1000, timeout = 20000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const promise = promiseFn()
      const result = await Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`${operationName} timed out after ${timeout}ms`)), timeout)
        )
      ])
      return result
    } catch (error) {
      const isTimeout = error.message?.includes('timed out')
      const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network') || error.name === 'AbortError'
      const isRateLimit = error.message?.includes('429') || error.message?.includes('rate limit')
      
      if (attempt < maxRetries && (isTimeout || isNetworkError || isRateLimit)) {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        console.log(`⏳ Retry ${attempt}/${maxRetries} after ${delay}ms (${operationName})`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      if (isTimeout) {
        throw new Error('Database timeout - please check your connection and try again')
      }
      if (isRateLimit) {
        throw new Error('Too many requests - please wait a moment and try again')
      }
      throw error
    }
  }
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export const gameHelpers = {
  createRoom: async (guestId, username, gameMode = 'SILENT', difficulty = 'MEDIUM', wordPack = 'GENERAL', customSettings = {}) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const maxCodeRetries = 5
    let lastError = null
    
    for (let codeAttempt = 1; codeAttempt <= maxCodeRetries; codeAttempt++) {
      const roomCode = generateRoomCode()
      console.log(`🎲 Generated room code (attempt ${codeAttempt}/${maxCodeRetries}):`, roomCode)
      
      if (codeAttempt === 1) {
        console.log('👤 Creating room for:', username, '(', guestId.slice(0, 15), '...)')
        console.log('⚙️ Settings:', { gameMode, difficulty, wordPack, traitorCount: customSettings.traitorCount || 1 })
      }
      
      try {
        const startTime = Date.now()
        console.log('⏱️ [1/2] Inserting into game_rooms table...')
        
        const { data, error } = await withRetry(
          () => supabase
            .from('game_rooms')
            .insert({
              room_code: roomCode,
              host_id: guestId,
              game_mode: gameMode,
              difficulty: difficulty,
              word_pack: wordPack,
              status: 'LOBBY',
              max_players: 8,
              custom_timings: customSettings.timings || null,
              traitor_count: customSettings.traitorCount || 1
            })
            .select()
            .single(),
          'Room creation (game_rooms insert)',
          3,
          1000,
          20000
        )
        
        const elapsed1 = Date.now() - startTime
        
        if (error) {
          if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
            console.log(`⚠️ Room code ${roomCode} already exists, trying another...`)
            lastError = error
            continue
          }
          
          console.error('❌ Room creation error:')
          console.error('  Message:', error.message)
          console.error('  Code:', error.code)
          console.error('  Details:', error.details)
          console.error('  Hint:', error.hint)
          throw error
        }
        
        console.log(`✅ [1/2] Room record created in ${elapsed1}ms - ID: ${data?.id?.slice(0, 8)}...`)
        
        const startTime2 = Date.now()
        console.log('⏱️ [2/2] Adding host to room_participants table...')
        
        const { error: participantError } = await withRetry(
          () => supabase
            .from('room_participants')
            .insert({
              room_id: data.id,
              user_id: guestId,
              username: username
            }),
          'Add participant (room_participants insert)',
          3,
          1000,
          20000
        )
        
        const elapsed2 = Date.now() - startTime2
        console.log(`✅ [2/2] Host added to participants in ${elapsed2}ms`)
        
        if (participantError) {
          console.error('❌ Participant add error:')
          console.error('  Message:', participantError.message)
          console.error('  Code:', participantError.code)
          throw participantError
        }
        
        const totalTime = Date.now() - startTime
        console.log(`🎉 Room creation complete in ${totalTime}ms total`)
        console.log('📋 Room details:', { id: data.id, room_code: data.room_code, host_id: data.host_id })
        
        return data
        
      } catch (error) {
        if (error.code !== '23505' && !error.message?.includes('duplicate') && !error.message?.includes('unique')) {
          console.error('💥 FATAL: Room creation failed')
          console.error('   Error name:', error.name)
          console.error('   Error message:', error.message)
          throw error
        }
        
        lastError = error
      }
    }
    
    throw new Error(`Failed to generate unique room code after ${maxCodeRetries} attempts`)
  },

  joinRoom: async (roomCode, guestId, username) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    try {
      const { data: room, error: roomError } = await withRetry(
        () => supabase
          .from('game_rooms')
          .select('*')
          .eq('room_code', roomCode.toUpperCase())
          .single(),
        'Room lookup',
        3,
        1000,
        15000
      )
      
      if (roomError) {
        console.error('❌ Room lookup error:', {
          code: roomError.code,
          message: roomError.message,
          roomCode: roomCode
        })
        
        if (roomError.code === 'PGRST116') {
          throw new Error('Room not found')
        }
        throw new Error(`Database error: ${roomError.message}`)
      }
      
      if (room.status !== 'LOBBY') {
        throw new Error(`Room is already ${room.status.toLowerCase()}`)
      }
      
      const { data: existing } = await supabase
        .from('room_participants')
        .select('user_id')
        .eq('room_id', room.id)
        .eq('user_id', guestId)
      
      if (Array.isArray(existing) && existing.length > 0) {
        console.log('Already in room, skipping join')
        return room
      }
      
      const { count } = await supabase
        .from('room_participants')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', room.id)
      
      if (room.max_players && count >= room.max_players) {
        throw new Error('Room is full')
      }
      
      const { error } = await withRetry(
        () => supabase
          .from('room_participants')
          .insert({
            room_id: room.id,
            user_id: guestId,
            username: username
          }),
        'Join room (room_participants insert)',
        3,
        1000,
        15000
      )
      
      if (error) throw error
      
      console.log('✅ Successfully joined room:', roomCode)
      return room
      
    } catch (error) {
      console.error('❌ Join room failed:', error.message)
      throw error
    }
  },

  autoJoinRoom: async (roomId, guestId, username) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data: room } = await supabase
      .from('game_rooms')
      .select('status, max_players')
      .eq('id', roomId)
      .single()
    
    if (!room || room.status !== 'LOBBY') {
      console.log('Cannot auto-join: room not in lobby')
      return null
    }
    
    const { data: existing, error: existingError } = await supabase
      .from('room_participants')
      .select('user_id')
      .eq('room_id', roomId)
      .eq('user_id', guestId)
    
    if (existingError) throw existingError
    
    if (Array.isArray(existing) && existing.length > 0) {
      console.log('Already in room')
      return existing[0]
    }
    
    const { count } = await supabase
      .from('room_participants')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
    
    if (room.max_players && count >= room.max_players) {
      throw new Error('Room is full')
    }
    
    const { data, error } = await supabase
      .from('room_participants')
      .insert({
        room_id: roomId,
        user_id: guestId,
        username: username
      })
      .select()
      .single()
    
    if (error) throw error
    console.log('✅ Auto-joined room')
    return data
  },

  getRoom: async (roomIdOrCode) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const isId = isUUID(roomIdOrCode)
    
    if (isId) {
      console.log('🔍 Fetching room by ID:', roomIdOrCode)
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomIdOrCode)
        .single()
      
      if (error) throw error
      return data
    } else {
      console.log('🔍 Fetching room by code:', roomIdOrCode)
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomIdOrCode.toUpperCase())
        .single()
      
      if (error) throw error
      return data
    }
  },

  getParticipants: async (roomId) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', roomId)
      .order('joined_at')
    
    if (error) throw error
    return data
  },

  startGame: async (roomId) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('game_rooms')
      .update({ 
        status: 'PLAYING',
        started_at: new Date().toISOString(),
        current_round: 1
      })
      .eq('id', roomId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 🔧 FIX #2: Server-authoritative phase advancement
  advancePhase: async (roomId, newPhase) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    console.log(`🔧 Writing phase transition to DB: ${newPhase}`)
    
    const { data, error } = await supabase
      .from('game_rooms')
      .update({ 
        current_phase: newPhase,
        phase_started_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single()
    
    if (error) {
      console.error('❌ Failed to write phase to DB:', error)
      throw error
    }
    
    console.log(`✅ Phase ${newPhase} written to DB at ${data.phase_started_at}`)
    return data
  },

  assignRoles: async (roomId, participants, difficulty, wordPack, traitorCount = 1) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data: wordPairs, error: wordError } = await supabase
      .from('word_pairs')
      .select('*')
      .eq('difficulty', difficulty)
      .eq('word_pack', wordPack)
    
    if (wordError || !wordPairs || wordPairs.length === 0) {
      throw new Error('No word pairs found')
    }
    
    const wordPair = wordPairs[Math.floor(Math.random() * wordPairs.length)]
    
    const traitorIndices = []
    const availableIndices = participants.map((_, i) => i)
    
    for (let i = 0; i < traitorCount; i++) {
      const randomIndex = Math.floor(Math.random() * availableIndices.length)
      traitorIndices.push(availableIndices[randomIndex])
      availableIndices.splice(randomIndex, 1)
    }
    
    const assignments = participants.map((p, index) => ({
      room_id: roomId,
      user_id: p.user_id,
      round_number: 1,
      role: traitorIndices.includes(index) ? 'TRAITOR' : 'CITIZEN',
      secret_word: traitorIndices.includes(index) ? wordPair.traitor_word : wordPair.main_word
    }))
    
    const { error } = await supabase
      .from('round_secrets')
      .insert(assignments)
    
    if (error) throw error
    
    const traitorIds = traitorIndices.map(i => participants[i].user_id)
    return { wordPair, traitorIds }
  },

  getMySecret: async (roomId, userId) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('round_secrets')
      .select('role, secret_word')
      .eq('room_id', roomId)
      .eq('user_id', userId)
    
    if (error) throw error
    
    const row = data?.[0] ?? null
    if (!row) {
      console.log('No secret yet for this player')
      return null
    }
    return row
  },

  submitHint: async (roomId, userId, hintText) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data: room } = await supabase
      .from('game_rooms')
      .select('current_round')
      .eq('id', roomId)
      .single()
    
    const { data, error } = await supabase
      .from('game_hints')
      .insert({
        room_id: roomId,
        user_id: userId,
        round_number: room.current_round,
        hint_text: hintText
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  getHints: async (roomId) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data: room } = await supabase
      .from('game_rooms')
      .select('current_round')
      .eq('id', roomId)
      .single()
    
    const { data, error } = await supabase
      .from('game_hints')
      .select('*')
      .eq('room_id', roomId)
      .eq('round_number', room.current_round)
      .order('submitted_at')
    
    if (error) throw error
    return data
  },

  sendChatMessage: async (roomId, userId, username, message) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data: room } = await supabase
      .from('game_rooms')
      .select('current_round')
      .eq('id', roomId)
      .single()
    
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        user_id: userId,
        username: username,
        message: message,
        round_number: room.current_round
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  getChatMessages: async (roomId) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data: room } = await supabase
      .from('game_rooms')
      .select('current_round')
      .eq('id', roomId)
      .single()
    
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .eq('round_number', room.current_round)
      .order('created_at')
    
    if (error) throw error
    return data || []
  },

  submitVote: async (roomId, voterId, targetId) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data: room } = await supabase
      .from('game_rooms')
      .select('current_round')
      .eq('id', roomId)
      .single()
    
    const { data, error } = await supabase
      .from('game_votes')
      .insert({
        room_id: roomId,
        round_number: room.current_round,
        voter_id: voterId,
        target_id: targetId
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  getVotes: async (roomId) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data: room } = await supabase
      .from('game_rooms')
      .select('current_round')
      .eq('id', roomId)
      .single()
    
    const { data, error } = await supabase
      .from('game_votes')
      .select('*')
      .eq('room_id', roomId)
      .eq('round_number', room.current_round)
    
    if (error) throw error
    return data
  },

  calculateVoteResults: async (roomId) => {
    const votes = await gameHelpers.getVotes(roomId)
    
    const voteCounts = {}
    votes.forEach(vote => {
      voteCounts[vote.target_id] = (voteCounts[vote.target_id] || 0) + 1
    })
    
    let maxVotes = 0
    let eliminatedId = null
    Object.entries(voteCounts).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count
        eliminatedId = id
      }
    })
    
    return { eliminatedId, voteCounts, votes }
  },

  eliminatePlayer: async (roomId, userId) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { error } = await supabase
      .from('room_participants')
      .update({ is_alive: false })
      .eq('room_id', roomId)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  checkGameEnd: async (roomId) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data: alive } = await supabase
      .from('room_participants')
      .select('user_id')
      .eq('room_id', roomId)
      .eq('is_alive', true)
    
    const { data: secrets } = await supabase
      .from('round_secrets')
      .select('user_id, role')
      .eq('room_id', roomId)
    
    const traitors = secrets?.filter(s => s.role === 'TRAITOR') || []
    const aliveTraitors = traitors.filter(t => 
      alive?.some(p => p.user_id === t.user_id)
    )
    
    if (aliveTraitors.length === 0) {
      return { 
        ended: true, 
        winner: 'CITIZENS', 
        traitorIds: traitors.map(t => t.user_id)
      }
    }
    
    const aliveCitizens = alive.length - aliveTraitors.length
    if (aliveTraitors.length >= aliveCitizens) {
      return { 
        ended: true, 
        winner: 'TRAITORS', 
        traitorIds: traitors.map(t => t.user_id)
      }
    }
    
    return { ended: false }
  },

  endGame: async (roomId, winner, traitorIds) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('game_rooms')
      .update({ 
        status: 'FINISHED',
        finished_at: new Date().toISOString()
      })
      .eq('id', roomId)
      .select()
      .single()
    
    if (error) throw error
    return { ...data, winner, traitorIds }
  },

  leaveRoom: async (roomId, userId) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { error } = await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId)
    
    if (error) throw error
  }
}

export const realtimeHelpers = {
  subscribeToRoom: (roomId, callbacks) => {
    if (!supabase) {
      console.warn('Supabase not configured, real-time disabled')
      return null
    }
    
    const channel = supabase.channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`
        },
        callbacks.onRoomUpdate
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`
        },
        callbacks.onParticipantUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_hints',
          filter: `room_id=eq.${roomId}`
        },
        callbacks.onHintSubmitted
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_votes',
          filter: `room_id=eq.${roomId}`
        },
        callbacks.onVoteSubmitted
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        callbacks.onChatMessage || (() => {})
      )
      .subscribe()
    
    return channel
  },

  unsubscribe: (channel) => {
    if (channel && supabase) {
      supabase.removeChannel(channel)
    }
  }
}