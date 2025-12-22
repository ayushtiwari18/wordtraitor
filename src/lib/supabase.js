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
      }
    })
  : null

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null
}

// Game room helpers for anonymous users
export const gameHelpers = {
  // Create room with guest ID and custom settings
  createRoom: async (guestId, username, gameMode = 'SILENT', difficulty = 'MEDIUM', wordPack = 'GENERAL', customSettings = {}) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const roomCode = generateRoomCode()
    
    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        room_code: roomCode,
        host_id: guestId,
        game_mode: gameMode,
        difficulty: difficulty,
        word_pack: wordPack,
        status: 'LOBBY',
        custom_timings: customSettings.timings || null,
        traitor_count: customSettings.traitorCount || 1
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Add host as first participant
    await supabase
      .from('room_participants')
      .insert({
        room_id: data.id,
        user_id: guestId,
        username: username
      })
    
    return data
  },

  // Join existing room
  joinRoom: async (roomCode, guestId, username) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Find room by code
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .eq('status', 'LOBBY')
      .single()
    
    if (roomError) throw new Error('Room not found or already started')
    
    // Check if already joined
    const { data: existing, error: existingError } = await supabase
      .from('room_participants')
      .select('user_id')
      .eq('room_id', room.id)
      .eq('user_id', guestId)
    
    if (existingError) throw existingError
    
    if (Array.isArray(existing) && existing.length > 0) {
      console.log('Already in room, skipping join')
      return { room, participant: existing[0] }
    }
    
    // Check player count
    const { count } = await supabase
      .from('room_participants')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', room.id)
    
    if (count >= room.max_players) throw new Error('Room is full')
    
    // Join room
    const { data, error } = await supabase
      .from('room_participants')
      .insert({
        room_id: room.id,
        user_id: guestId,
        username: username
      })
      .select()
      .single()
    
    if (error) throw error
    return { ...data, room }
  },

  // Auto-join room (used when loading existing room)
  autoJoinRoom: async (roomId, guestId, username) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Check if room is still in lobby
    const { data: room } = await supabase
      .from('game_rooms')
      .select('status, max_players')
      .eq('id', roomId)
      .single()
    
    if (!room || room.status !== 'LOBBY') {
      console.log('Cannot auto-join: room not in lobby')
      return null
    }
    
    // Check if already joined
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
    
    // Check player count
    const { count } = await supabase
      .from('room_participants')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
    
    if (count >= room.max_players) {
      throw new Error('Room is full')
    }
    
    // Join room
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

  // Get room details
  getRoom: async (roomId) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { data, error } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', roomId)
      .single()
    
    if (error) throw error
    return data
  },

  // Get room participants with profiles
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

  // Start game
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

  // Assign roles and words with support for multiple traitors
  assignRoles: async (roomId, participants, difficulty, wordPack, traitorCount = 1) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Get random word pair
    const { data: wordPairs, error: wordError } = await supabase
      .from('word_pairs')
      .select('*')
      .eq('difficulty', difficulty)
      .eq('word_pack', wordPack)
    
    if (wordError || !wordPairs || wordPairs.length === 0) {
      throw new Error('No word pairs found')
    }
    
    const wordPair = wordPairs[Math.floor(Math.random() * wordPairs.length)]
    
    // Randomly select traitors
    const traitorIndices = []
    const availableIndices = participants.map((_, i) => i)
    
    for (let i = 0; i < traitorCount; i++) {
      const randomIndex = Math.floor(Math.random() * availableIndices.length)
      traitorIndices.push(availableIndices[randomIndex])
      availableIndices.splice(randomIndex, 1)
    }
    
    // Assign roles
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

  // Get my secret word
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

  // Submit hint
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

  // Get all hints for current round
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

  // Send chat message (for debate phase)
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

  // Get chat messages for current round
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

  // Submit vote
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

  // Get votes
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

  // Calculate vote results
  calculateVoteResults: async (roomId) => {
    const votes = await gameHelpers.getVotes(roomId)
    
    // Count votes for each target
    const voteCounts = {}
    votes.forEach(vote => {
      voteCounts[vote.target_id] = (voteCounts[vote.target_id] || 0) + 1
    })
    
    // Find most voted
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

  // Eliminate player
  eliminatePlayer: async (roomId, userId) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    const { error } = await supabase
      .from('room_participants')
      .update({ is_alive: false })
      .eq('room_id', roomId)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Check game end conditions (updated for multiple traitors)
  checkGameEnd: async (roomId) => {
    if (!supabase) throw new Error('Supabase not configured')
    
    // Get alive participants
    const { data: alive } = await supabase
      .from('room_participants')
      .select('user_id')
      .eq('room_id', roomId)
      .eq('is_alive', true)
    
    // Get all secrets
    const { data: secrets } = await supabase
      .from('round_secrets')
      .select('user_id, role')
      .eq('room_id', roomId)
    
    const traitors = secrets?.filter(s => s.role === 'TRAITOR') || []
    const aliveTraitors = traitors.filter(t => 
      alive?.some(p => p.user_id === t.user_id)
    )
    
    // Citizens win if all traitors eliminated
    if (aliveTraitors.length === 0) {
      return { 
        ended: true, 
        winner: 'CITIZENS', 
        traitorIds: traitors.map(t => t.user_id)
      }
    }
    
    // Traitors win if they equal or outnumber citizens
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

  // End game
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

  // Leave room
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

// Real-time subscription helpers
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

// Utility: Generate room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}