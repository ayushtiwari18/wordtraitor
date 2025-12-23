import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    // FIX: Increased timeouts from 10s to 30s for better network resilience
    requestTimeout: 30000,
    responseTimeout: 30000,
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