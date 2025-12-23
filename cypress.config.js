import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,
    // INCREASED: Better handling of Supabase network latency
    defaultCommandTimeout: 15000, // Increased from 10s to 15s
    requestTimeout: 15000, // Increased from 10s to 15s
    responseTimeout: 15000, // Increased from 10s to 15s
    pageLoadTimeout: 30000, // Added for slow initial loads
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    env: {
      // Add environment variables here if needed
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