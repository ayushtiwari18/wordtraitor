/// <reference types="cypress" />

describe('Phase 2: Lobby & Settings', () => {
  
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/')
    cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 }).should('exist')
  })

  describe('TC040-048: Lobby Display', () => {
    
    it('TC040: should display room code correctly', () => {
      // Create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      
      // Wait for room code
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      // Verify room code format (6 uppercase alphanumeric)
      cy.get('[data-testid="room-code"]').invoke('text').then((code) => {
        expect(code.trim()).to.match(/^[A-Z0-9]{6}$/)
      })
      
      // Verify room code is visible and prominent
      cy.get('[data-testid="room-code"]').should('be.visible')
      cy.get('[data-testid="room-code"]').should('have.class', 'text-5xl') // Large text
    })

    it('TC041: should copy room code to clipboard', () => {
      // Create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      // Get room code
      cy.get('[data-testid="room-code"]').invoke('text').then((code) => {
        const roomCode = code.trim()
        
        // Click copy button (find button near room code)
        cy.get('[data-testid="room-code"]')
          .parent()
          .parent()
          .find('button')
          .first()
          .click()
        
        // Verify copied message appears
        cy.contains('Copied', { timeout: 2000 }).should('be.visible')
        
        // Verify clipboard (Note: Cypress can't directly read clipboard in headless mode)
        // So we just verify the UI feedback
      })
    })

    it('TC042: should show host indicator on creator', () => {
      // Create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      // Wait for participants list
      cy.get('[data-testid="participants-list"]', { timeout: 10000 }).should('exist')
      
      // Verify host indicator exists
      cy.get('[data-testid="is-host"]', { timeout: 5000 }).should('exist')
      cy.get('[data-testid="is-host"]').should('contain', 'Host')
      cy.get('[data-testid="is-host"]').should('be.visible')
    })

    it('TC043: should show "You" badge on own participant', () => {
      // Create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      // Wait for participants list
      cy.get('[data-testid="participants-list"]', { timeout: 10000 }).should('exist')
      
      // Verify "You" badge exists
      cy.contains('You', { timeout: 5000 }).should('be.visible')
      
      // Verify participant item is highlighted (has purple border)
      cy.get('[data-testid="participant-item"]')
        .first()
        .should('have.class', 'border-purple-500')
    })

    it('TC044: should show accurate player count', () => {
      // Create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      // Wait for participants list
      cy.get('[data-testid="participants-list"]', { timeout: 10000 }).should('exist')
      
      // Verify 1 participant initially
      cy.get('[data-testid="participant-item"]').should('have.length', 1)
      
      // Verify player count display (should show "1/8")
      cy.contains(/1\s*\/\s*8/).should('be.visible')
    })

    it('TC045: should display game settings correctly', () => {
      // Create room with specific settings
      cy.get('[data-testid="create-room-button"]').click()
      
      // Select specific settings
      cy.get('[data-testid="game-mode-selector"]').select('REAL')
      cy.get('[data-testid="difficulty-selector"]').select('HARD')
      cy.get('[data-testid="wordpack-selector"]').select('MOVIES')
      
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      // Verify settings displayed
      cy.get('[data-testid="game-mode"]', { timeout: 5000 }).should('contain', 'Real')
      cy.get('[data-testid="difficulty"]').should('contain', 'HARD')
      cy.get('[data-testid="word-pack"]').should('contain', 'MOVIES')
    })

    it('TC046: should show custom settings badge when configured', () => {
      // Create room with custom settings
      cy.get('[data-testid="create-room-button"]').click()
      
      // Open advanced settings
      cy.contains('Advanced Settings').click()
      
      // Set custom traitor count
      cy.get('input[type="number"]').first().clear().type('2')
      
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      // Verify custom settings badge
      cy.contains('Custom', { timeout: 5000 }).should('be.visible')
      
      // Verify traitor count shows 2
      cy.contains(/2/).should('be.visible') // Traitor count
    })

    it('TC047: should expand/collapse phase timings', () => {
      // Create room with custom timings
      cy.get('[data-testid="create-room-button"]').click()
      
      // Open advanced settings
      cy.contains('Advanced Settings').click()
      
      // Change a timing
      cy.contains('Whisper Phase')
        .parent()
        .find('input')
        .clear()
        .type('45')
      
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      // Verify Phase Timings section exists
      cy.contains('Phase Timings', { timeout: 5000 }).should('exist')
      
      // Initially collapsed - timing values not visible
      cy.contains('45s').should('not.be.visible')
      
      // Click to expand
      cy.contains('Phase Timings').click()
      
      // Now visible
      cy.contains('45s', { timeout: 2000 }).should('be.visible')
      
      // Click to collapse
      cy.contains('Phase Timings').click()
      
      // Hidden again
      cy.contains('45s').should('not.be.visible')
    })

    it('TC048: should show warning when less than 2 players', () => {
      // Create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      // Verify warning message
      cy.contains('Need at least 2 players', { timeout: 5000 }).should('be.visible')
      cy.contains('Waiting for').should('be.visible')
    })
  })

  describe('TC049-052: Real-time Participant Updates', () => {
    
    it('TC049: should update participant list when new player joins', () => {
      // Create room and get code
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).invoke('text').then((code) => {
        const roomCode = code.trim()
        
        // Initial count: 1 player
        cy.get('[data-testid="participant-item"]').should('have.length', 1)
        
        // Wait for room to stabilize
        cy.wait(2000)
        
        // Simulate second player joining (clear localStorage = new guest ID)
        cy.clearLocalStorage()
        cy.visit('/')
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 }).should('exist')
        cy.wait(500)
        
        // Join as second player
        cy.get('[data-testid="join-room-button"]').click()
        cy.get('[data-testid="room-code-input"]').type(roomCode)
        cy.get('[data-testid="join-button"]').click()
        
        // Wait for join to complete
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        
        // Should now see 2 participants
        cy.get('[data-testid="participant-item"]', { timeout: 10000 }).should('have.length', 2)
        
        // Player count should be 2/8
        cy.contains(/2\s*\/\s*8/).should('be.visible')
      })
    })

    it('TC050: should NOT show host indicator on joiner', () => {
      // Create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).invoke('text').then((code) => {
        const roomCode = code.trim()
        cy.wait(2000)
        
        // Join as second player
        cy.clearLocalStorage()
        cy.visit('/')
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 }).should('exist')
        cy.wait(500)
        
        cy.get('[data-testid="join-room-button"]').click()
        cy.get('[data-testid="room-code-input"]').type(roomCode)
        cy.get('[data-testid="join-button"]').click()
        
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        
        // Verify NO host indicator on current user
        cy.get('[data-testid="is-host"]').should('not.exist')
        
        // But should still see "You" badge
        cy.contains('You').should('be.visible')
      })
    })
  })

  describe('TC053: Leave Room', () => {
    
    it('TC053: should return to home when leaving room', () => {
      // Create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      // Click leave button
      cy.contains('Leave', { timeout: 5000 }).click()
      
      // Should be back at home
      cy.url().should('eq', Cypress.config().baseUrl + '/')
      
      // Home page elements visible
      cy.get('[data-testid="create-room-button"]').should('be.visible')
      cy.get('[data-testid="join-room-button"]').should('be.visible')
    })
  })
})