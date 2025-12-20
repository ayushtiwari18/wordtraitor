import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Helper functions for common operations
export const authHelpers = {
  signUp: async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    })
    
    if (error) throw error
    
    // Create profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
        })
      
      if (profileError) throw profileError
    }
    
    return data
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }
}

// Game room helpers
export const gameHelpers = {
  createRoom: async (userId, gameMode = 'SILENT', difficulty = 'MEDIUM', wordPack = 'GENERAL') => {
    const { data, error } = await supabase
      .rpc('create_game_room', {
        p_host_id: userId,
        p_game_mode: gameMode,
        p_difficulty: difficulty,
        p_word_pack: wordPack
      })
    
    if (error) throw error
    return data
  },

  joinRoom: async (roomCode, userId) => {
    // Find room by code
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('id, status, max_players')
      .eq('room_code', roomCode.toUpperCase())
      .single()
    
    if (roomError) throw roomError
    if (!room) throw new Error('Room not found')
    if (room.status !== 'LOBBY') throw new Error('Game already started')
    
    // Check player count
    const { count, error: countError } = await supabase
      .from('room_participants')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', room.id)
    
    if (countError) throw countError
    if (count >= room.max_players) throw new Error('Room is full')
    
    // Join room
    const { data, error } = await supabase
      .from('room_participants')
      .insert({
        room_id: room.id,
        user_id: userId
      })
      .select()
      .single()
    
    if (error) throw error
    return { ...data, room_id: room.id }
  },

  startRound: async (roomId, roundNumber) => {
    const { data, error } = await supabase
      .rpc('start_new_round', {
        p_room_id: roomId,
        p_round_number: roundNumber
      })
    
    if (error) throw error
    return data
  },

  submitHint: async (roomId, userId, roundNumber, hintText) => {
    const { data, error } = await supabase
      .from('game_hints')
      .insert({
        room_id: roomId,
        user_id: userId,
        round_number: roundNumber,
        hint_text: hintText
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  submitVote: async (roomId, voterId, targetId, roundNumber) => {
    const { data, error } = await supabase
      .from('game_votes')
      .insert({
        room_id: roomId,
        voter_id: voterId,
        target_id: targetId,
        round_number: roundNumber
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  processVotes: async (roomId, roundNumber) => {
    const { data, error } = await supabase
      .rpc('process_vote_results', {
        p_room_id: roomId,
        p_round_number: roundNumber
      })
    
    if (error) throw error
    return data
  },

  getMySecret: async (roomId, userId, roundNumber) => {
    const { data, error } = await supabase
      .from('round_secrets')
      .select('role, secret_word')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .eq('round_number', roundNumber)
      .single()
    
    if (error) throw error
    return data
  }
}

// Real-time subscription helpers
export const realtimeHelpers = {
  subscribeToRoom: (roomId, callbacks) => {
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
      .subscribe()
    
    return channel
  },

  unsubscribe: (channel) => {
    if (channel) {
      supabase.removeChannel(channel)
    }
  }
}