import { defineConfig } from 'cypress'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,
    // INCREASED: Better handling of Supabase network latency
    defaultCommandTimeout: 15000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 30000,
    setupNodeEvents(on, config) {
      // FIXED: Import and register tasks dynamically
      on('task', {
        async mockSecondPlayer(args) {
          const { createClient } = await import('@supabase/supabase-js')
          const supabaseUrl = process.env.VITE_SUPABASE_URL
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

          if (!supabaseUrl || !supabaseServiceKey) {
            console.error('❌ Missing Supabase credentials in environment')
            return { success: false, error: 'Missing credentials' }
          }

          const supabase = createClient(supabaseUrl, supabaseServiceKey)

          try {
            const { roomCode, hostId } = args

            // Get room by code
            const { data: room, error: roomError } = await supabase
              .from('game_rooms')
              .select('id')
              .eq('room_code', roomCode)
              .single()

            if (roomError) throw roomError

            // Create mock participant
            const mockUserId = `mock_player_${Date.now()}`
            const mockUsername = `MockPlayer${Math.floor(Math.random() * 1000)}`

            const { error: participantError } = await supabase
              .from('room_participants')
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

        async setGamePhase(args) {
          const { createClient } = await import('@supabase/supabase-js')
          const supabaseUrl = process.env.VITE_SUPABASE_URL
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

          if (!supabaseUrl || !supabaseServiceKey) {
            return { success: false, error: 'Missing credentials' }
          }

          const supabase = createClient(supabaseUrl, supabaseServiceKey)

          try {
            const { roomCode, phase } = args

            const { data: room, error: roomError } = await supabase
              .from('game_rooms')
              .select('id')
              .eq('room_code', roomCode)
              .single()

            if (roomError) throw roomError

            const { error: updateError } = await supabase
              .from('game_rooms')
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

        async cleanupTestData() {
          const { createClient } = await import('@supabase/supabase-js')
          const supabaseUrl = process.env.VITE_SUPABASE_URL
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

          if (!supabaseUrl || !supabaseServiceKey) {
            return { success: false, error: 'Missing credentials' }
          }

          const supabase = createClient(supabaseUrl, supabaseServiceKey)

          try {
            const cutoffTime = new Date(Date.now() - 3600000).toISOString()

            const { error: roomError } = await supabase
              .from('game_rooms')
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

        async getRoomStats() {
          const { createClient } = await import('@supabase/supabase-js')
          const supabaseUrl = process.env.VITE_SUPABASE_URL
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

          if (!supabaseUrl || !supabaseServiceKey) {
            return { success: false, error: 'Missing credentials' }
          }

          const supabase = createClient(supabaseUrl, supabaseServiceKey)

          try {
            const { count: roomCount, error: roomError } = await supabase
              .from('game_rooms')
              .select('*', { count: 'exact', head: true })

            if (roomError) throw roomError

            const { count: participantCount, error: participantError } = await supabase
              .from('room_participants')
              .select('*', { count: 'exact', head: true })

            if (participantError) throw participantError

            console.log(`📊 Rooms: ${roomCount}, Participants: ${participantCount}`)
            return { success: true, rooms: roomCount, participants: participantCount }
          } catch (error) {
            console.error('❌ Error getting room stats:', error)
            return { success: false, error: error.message }
          }
        },

        async mockGameStart(args) {
          const { createClient } = await import('@supabase/supabase-js')
          const supabaseUrl = process.env.VITE_SUPABASE_URL
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

          if (!supabaseUrl || !supabaseServiceKey) {
            return { success: false, error: 'Missing credentials' }
          }

          const supabase = createClient(supabaseUrl, supabaseServiceKey)

          try {
            const { roomCode } = args

            const { data: room, error: roomError } = await supabase
              .from('game_rooms')
              .select('id')
              .eq('room_code', roomCode)
              .single()

            if (roomError) throw roomError

            await supabase
              .from('game_rooms')
              .update({ status: 'PLAYING', current_phase: 'WHISPER' })
              .eq('id', room.id)

            const { data: participants } = await supabase
              .from('room_participants')
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
      })
      
      return config
    },
    env: {
      // Test configuration for 100-user scale
      MAX_CONCURRENT_GAMES: 20,
      MAX_PLAYERS_PER_GAME: 10,
      TEST_MODE: 'scaled'
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
  },
  retries: {
    runMode: 2,
    openMode: 0,
  },
})