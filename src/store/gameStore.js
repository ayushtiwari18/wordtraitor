import { create } from 'zustand'
import { supabase, gameHelpers, realtimeHelpers } from '@/lib/supabase'
import { GAME_PHASES, GAME_STATUS } from '@/lib/constants'

export const useGameStore = create((set, get) => ({
  // Room data
  room: null,
  participants: [],
  mySecret: null,
  
  // Game state
  currentPhase: null,
  currentRound: 1,
  timeRemaining: 0,
  
  // Game data
  hints: [],
  votes: [],
  voteResults: null,
  
  // UI state
  loading: false,
  error: null,
  
  // Real-time channel
  channel: null,

  // Create new room
  createRoom: async (userId, gameMode, difficulty, wordPack) => {
    try {
      set({ loading: true, error: null })
      
      const data = await gameHelpers.createRoom(userId, gameMode, difficulty, wordPack)
      
      // Fetch room details
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', data.room_id)
        .single()
      
      if (roomError) throw roomError
      
      set({ 
        room,
        loading: false 
      })
      
      // Subscribe to real-time updates
      get().subscribeToRoom(data.room_id)
      
      return { success: true, roomId: data.room_id, roomCode: data.room_code }
    } catch (error) {
      console.error('Create room error:', error)
      set({ 
        error: error.message, 
        loading: false 
      })
      return { success: false, error: error.message }
    }
  },

  // Join existing room
  joinRoom: async (roomCode, userId) => {
    try {
      set({ loading: true, error: null })
      
      const data = await gameHelpers.joinRoom(roomCode, userId)
      
      // Fetch room details
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', data.room_id)
        .single()
      
      if (roomError) throw roomError
      
      set({ 
        room,
        loading: false 
      })
      
      // Subscribe to real-time updates
      get().subscribeToRoom(data.room_id)
      
      return { success: true, roomId: data.room_id }
    } catch (error) {
      console.error('Join room error:', error)
      set({ 
        error: error.message, 
        loading: false 
      })
      return { success: false, error: error.message }
    }
  },

  // Load room by ID
  loadRoom: async (roomId) => {
    try {
      set({ loading: true, error: null })
      
      // Fetch room
      const { data: room, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single()
      
      if (roomError) throw roomError
      
      // Fetch participants with profiles
      const { data: participants, error: participantsError } = await supabase
        .from('room_participants')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('room_id', roomId)
      
      if (participantsError) throw participantsError
      
      set({ 
        room,
        participants,
        loading: false 
      })
      
      // Subscribe to real-time updates
      get().subscribeToRoom(roomId)
      
      return { success: true }
    } catch (error) {
      console.error('Load room error:', error)
      set({ 
        error: error.message, 
        loading: false 
      })
      return { success: false, error: error.message }
    }
  },

  // Start new round
  startRound: async (userId) => {
    try {
      const { room } = get()
      if (!room) throw new Error('No active room')
      if (room.host_id !== userId) throw new Error('Only host can start game')
      
      set({ loading: true, error: null })
      
      const roundNumber = room.current_round || 1
      const data = await gameHelpers.startRound(room.id, roundNumber)
      
      // Fetch my secret
      const secret = await gameHelpers.getMySecret(room.id, userId, roundNumber)
      
      set({ 
        mySecret: secret,
        currentRound: roundNumber,
        currentPhase: GAME_PHASES.WHISPER,
        loading: false 
      })
      
      return { success: true, data }
    } catch (error) {
      console.error('Start round error:', error)
      set({ 
        error: error.message, 
        loading: false 
      })
      return { success: false, error: error.message }
    }
  },

  // Submit hint
  submitHint: async (userId, hintText) => {
    try {
      const { room, currentRound } = get()
      if (!room) throw new Error('No active room')
      
      const data = await gameHelpers.submitHint(room.id, userId, currentRound, hintText)
      
      return { success: true }
    } catch (error) {
      console.error('Submit hint error:', error)
      return { success: false, error: error.message }
    }
  },

  // Submit vote
  submitVote: async (userId, targetId) => {
    try {
      const { room, currentRound } = get()
      if (!room) throw new Error('No active room')
      
      const data = await gameHelpers.submitVote(room.id, userId, targetId, currentRound)
      
      return { success: true }
    } catch (error) {
      console.error('Submit vote error:', error)
      return { success: false, error: error.message }
    }
  },

  // Process votes and determine outcome
  processVotes: async () => {
    try {
      const { room, currentRound } = get()
      if (!room) throw new Error('No active room')
      
      const results = await gameHelpers.processVotes(room.id, currentRound)
      
      set({ 
        voteResults: results,
        currentPhase: GAME_PHASES.REVEAL 
      })
      
      return { success: true, results }
    } catch (error) {
      console.error('Process votes error:', error)
      return { success: false, error: error.message }
    }
  },

  // Fetch hints for current round
  fetchHints: async () => {
    try {
      const { room, currentRound } = get()
      if (!room) return
      
      const { data, error } = await supabase
        .from('game_hints')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('room_id', room.id)
        .eq('round_number', currentRound)
        .order('submitted_at', { ascending: true })
      
      if (error) throw error
      
      set({ hints: data || [] })
    } catch (error) {
      console.error('Fetch hints error:', error)
    }
  },

  // Fetch votes for current round
  fetchVotes: async () => {
    try {
      const { room, currentRound } = get()
      if (!room) return
      
      const { data, error } = await supabase
        .from('game_votes')
        .select('*')
        .eq('room_id', room.id)
        .eq('round_number', currentRound)
      
      if (error) throw error
      
      set({ votes: data || [] })
    } catch (error) {
      console.error('Fetch votes error:', error)
    }
  },

  // Set current phase
  setPhase: (phase) => set({ currentPhase: phase }),

  // Set time remaining
  setTimeRemaining: (time) => set({ timeRemaining: time }),

  // Subscribe to real-time updates
  subscribeToRoom: (roomId) => {
    // Unsubscribe from previous channel
    const currentChannel = get().channel
    if (currentChannel) {
      realtimeHelpers.unsubscribe(currentChannel)
    }
    
    // Create new subscription
    const channel = realtimeHelpers.subscribeToRoom(roomId, {
      onRoomUpdate: (payload) => {
        console.log('Room updated:', payload)
        if (payload.eventType === 'UPDATE') {
          set({ room: payload.new })
        }
      },
      
      onParticipantUpdate: (payload) => {
        console.log('Participant updated:', payload)
        get().loadParticipants()
      },
      
      onHintSubmitted: (payload) => {
        console.log('Hint submitted:', payload)
        get().fetchHints()
      },
      
      onVoteSubmitted: (payload) => {
        console.log('Vote submitted:', payload)
        get().fetchVotes()
      }
    })
    
    set({ channel })
  },

  // Load participants
  loadParticipants: async () => {
    try {
      const { room } = get()
      if (!room) return
      
      const { data, error } = await supabase
        .from('room_participants')
        .select(`
          *,
          profile:profiles(*)
        `)
        .eq('room_id', room.id)
      
      if (error) throw error
      
      set({ participants: data || [] })
    } catch (error) {
      console.error('Load participants error:', error)
    }
  },

  // Leave room and cleanup
  leaveRoom: () => {
    const channel = get().channel
    if (channel) {
      realtimeHelpers.unsubscribe(channel)
    }
    
    set({
      room: null,
      participants: [],
      mySecret: null,
      currentPhase: null,
      currentRound: 1,
      timeRemaining: 0,
      hints: [],
      votes: [],
      voteResults: null,
      channel: null
    })
  },

  // Clear error
  clearError: () => set({ error: null })
}))