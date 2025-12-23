/**
 * Cypress Plugin Tasks for Scaled Testing
 * 
 * These tasks allow tests to directly manipulate the database
 * for faster execution and reduced API calls.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default {
  /**
   * Mock Second Player
   * Directly adds a mock participant to the database
   * instead of going through full UI flow
   */
  async mockSecondPlayer({ roomCode, hostId }) {
    try {
      // Get room by code
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', roomCode)
        .single()

      if (roomError) throw roomError

      // Create mock participant
      const mockUserId = `mock_player_${Date.now()}`
      const mockUsername = `MockPlayer${Math.floor(Math.random() * 1000)}`

      const { error: participantError } = await supabase
        .from('participants')
        .insert({
          room_id: room.id,
          user_id: mockUserId,
          username: mockUsername,
          is_host: false,
          is_alive: true
        })

      if (participantError) throw participantError

      console.log(`✅ Mock player added: ${mockUsername} (${mockUserId})`)
      return { success: true, userId: mockUserId, username: mockUsername }
    } catch (error) {
      console.error('❌ Error mocking second player:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Set Game Phase
   * Directly sets the game phase in database
   * Skips waiting for timers to expire
   */
  async setGamePhase({ roomCode, phase }) {
    try {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', roomCode)
        .single()

      if (roomError) throw roomError

      // Update room phase
      const { error: updateError } = await supabase
        .from('rooms')
        .update({ current_phase: phase })
        .eq('id', room.id)

      if (updateError) throw updateError

      console.log(`✅ Game phase set to: ${phase}`)
      return { success: true, phase }
    } catch (error) {
      console.error('❌ Error setting game phase:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Cleanup Test Data
   * Removes all test rooms and participants created during tests
   */
  async cleanupTestData() {
    try {
      const cutoffTime = new Date(Date.now() - 3600000).toISOString() // 1 hour ago

      // Delete old test rooms
      const { error: roomError } = await supabase
        .from('rooms')
        .delete()
        .lt('created_at', cutoffTime)

      if (roomError) throw roomError

      console.log('✅ Test data cleaned up')
      return { success: true }
    } catch (error) {
      console.error('❌ Error cleaning up test data:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get Room Stats
   * Returns current room and participant counts
   * Useful for monitoring test impact on database
   */
  async getRoomStats() {
    try {
      const { count: roomCount, error: roomError } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })

      if (roomError) throw roomError

      const { count: participantCount, error: participantError } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })

      if (participantError) throw participantError

      console.log(`📊 Rooms: ${roomCount}, Participants: ${participantCount}`)
      return { success: true, rooms: roomCount, participants: participantCount }
    } catch (error) {
      console.error('❌ Error getting room stats:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Mock Game Start
   * Sets up a game in PLAYING state with roles assigned
   * Useful for testing mid-game features without setup overhead
   */
  async mockGameStart({ roomCode, myUserId }) {
    try {
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', roomCode)
        .single()

      if (roomError) throw roomError

      // Update room to PLAYING
      await supabase
        .from('rooms')
        .update({ status: 'PLAYING', current_phase: 'WHISPER' })
        .eq('id', room.id)

      // Assign roles
      const { data: participants } = await supabase
        .from('participants')
        .select('user_id')
        .eq('room_id', room.id)

      for (let i = 0; i < participants.length; i++) {
        const role = i === 0 ? 'TRAITOR' : 'CITIZEN'
        const word = i === 0 ? 'IMPOSTER_WORD' : 'CITIZEN_WORD'

        await supabase
          .from('participant_secrets')
          .insert({
            room_id: room.id,
            user_id: participants[i].user_id,
            role,
            secret_word: word
          })
      }

      console.log('✅ Game started with roles assigned')
      return { success: true }
    } catch (error) {
      console.error('❌ Error mocking game start:', error)
      return { success: false, error: error.message }
    }
  }
}
