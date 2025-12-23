import { defineConfig } from 'cypress'
import tasks from './cypress/support/tasks.js'

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
      // Register custom tasks for scaled testing
      on('task', {
        mockSecondPlayer: tasks.mockSecondPlayer,
        setGamePhase: tasks.setGamePhase,
        cleanupTestData: tasks.cleanupTestData,
        getRoomStats: tasks.getRoomStats,
        mockGameStart: tasks.mockGameStart
      })
      
      return config
    },
    env: {
      // Test configuration for 100-user scale
      MAX_CONCURRENT_GAMES: 20,
      MAX_PLAYERS_PER_GAME: 10,
      TEST_MODE: 'scaled' // Can be 'scaled' or 'full'
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