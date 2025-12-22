// ***********************************************************
// This file is processed and loaded automatically before test files.
// ***********************************************************

import './commands'

// Prevent uncaught exceptions from failing tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false prevents Cypress from failing the test
  // We can add specific error handling here
  console.error('Uncaught exception:', err.message)
  return false
})

// Clear localStorage before each test
beforeEach(() => {
  cy.clearLocalStorage()
})

// Add viewport presets
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667)
})

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024)
})

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720)
})