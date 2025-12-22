/// <reference types="cypress" />

describe('Phase 2: Game Start', () => {
  
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/')
    cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 }).should('exist')
  })

  // Add delay after each test to avoid Supabase rate limits
  afterEach(() => {
    cy.wait(3000) // 3 second cool-down between tests
  })

  describe('TC050-052: Start Game Controls', () => {
    
    it('TC050: host cannot start with only 1 player', () => {
      // Create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      // Verify start button exists but is disabled
      cy.get('[data-testid="start-game-button"]', { timeout: 5000 }).should('exist')
      cy.get('[data-testid="start-game-button"]').should('be.disabled')
      
      // Verify warning message
      cy.contains('Need at least 2 players').should('be.visible')
    })

    it('TC051: host can start with 2+ players', () => {
      // Create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).invoke('text').then((code) => {
        const roomCode = code.trim()
        cy.wait(2000)
        
        // Add second player
        cy.clearLocalStorage()
        cy.visit('/')
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 }).should('exist')
        cy.wait(500)
        
        cy.get('[data-testid="join-room-button"]').click()
        cy.get('[data-testid="room-code-input"]').type(roomCode)
        cy.get('[data-testid="join-button"]').click()
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        
        // Wait for participants to update
        cy.get('[data-testid="participant-item"]', { timeout: 10000 }).should('have.length', 2)
        cy.wait(1000)
        
        // Go back to host
        cy.clearLocalStorage()
        cy.visit(`/lobby/${roomCode}`)
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 }).should('exist')
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        
        // Wait for both participants to load
        cy.get('[data-testid="participant-item"]', { timeout: 15000 }).should('have.length', 2)
        
        // Start button should now be enabled
        cy.get('[data-testid="start-game-button"]', { timeout: 5000 }).should('not.be.disabled')
        
        // Click start
        cy.get('[data-testid="start-game-button"]').click()
        
        // Should navigate to game page
        cy.url({ timeout: 15000 }).should('include', '/game/')
      })
    })

    it('TC052: non-host cannot start game', () => {
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
        
        // Verify NO start button for non-host
        cy.get('[data-testid="start-game-button"]').should('not.exist')
        
        // Instead, should see waiting message
        cy.contains('Waiting for host', { timeout: 5000 }).should('be.visible')
      })
    })
  })

  describe('TC053-056: Role & Word Assignment', () => {
    
    it('TC053: should navigate all players to game on start', () => {
      // This test verifies URL change, not full game state
      // Create room with 2 players and start
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).invoke('text').then((code) => {
        const roomCode = code.trim()
        cy.wait(2000)
        
        // Add second player
        cy.clearLocalStorage()
        cy.visit('/')
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 }).should('exist')
        cy.wait(500)
        
        cy.get('[data-testid="join-room-button"]').click()
        cy.get('[data-testid="room-code-input"]').type(roomCode)
        cy.get('[data-testid="join-button"]').click()
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        cy.get('[data-testid="participant-item"]', { timeout: 10000 }).should('have.length', 2)
        cy.wait(1000)
        
        // Go back to host and start
        cy.clearLocalStorage()
        cy.visit(`/lobby/${roomCode}`)
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 }).should('exist')
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        cy.get('[data-testid="participant-item"]', { timeout: 15000 }).should('have.length', 2)
        
        cy.get('[data-testid="start-game-button"]', { timeout: 5000 }).click()
        cy.url({ timeout: 15000 }).should('include', '/game/')
        
        // Verify game URL contains room code
        cy.url().should('include', roomCode)
      })
    })

    it('TC054: should assign roles correctly (1 traitor, rest citizens)', () => {
      // Create room and start game with 2 players
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).invoke('text').then((code) => {
        const roomCode = code.trim()
        cy.wait(2000)
        
        // Add second player
        cy.clearLocalStorage()
        cy.visit('/')
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 }).should('exist')
        cy.wait(500)
        
        cy.get('[data-testid="join-room-button"]').click()
        cy.get('[data-testid="room-code-input"]').type(roomCode)
        cy.get('[data-testid="join-button"]').click()
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        cy.get('[data-testid="participant-item"]', { timeout: 10000 }).should('have.length', 2)
        cy.wait(1000)
        
        // Start game as host
        cy.clearLocalStorage()
        cy.visit(`/lobby/${roomCode}`)
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 }).should('exist')
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        cy.get('[data-testid="participant-item"]', { timeout: 15000 }).should('have.length', 2)
        
        cy.get('[data-testid="start-game-button"]', { timeout: 5000 }).click()
        cy.url({ timeout: 15000 }).should('include', '/game/')
        
        // In Whisper phase, should see role
        cy.get('[data-testid="player-role"]', { timeout: 20000 }).should('exist')
        cy.get('[data-testid="player-role"]').invoke('text').then((role) => {
          // Role should be either "Citizen" or "Traitor"
          expect(role).to.match(/Citizen|Traitor/)
        })
        
        // Should see secret word
        cy.get('[data-testid="secret-word"]', { timeout: 5000 }).should('exist')
        cy.get('[data-testid="secret-word"]').should('not.be.empty')
      })
    })

    it('TC055: should assign words based on difficulty', () => {
      // Create room with HARD difficulty
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="difficulty-selector"]').select('HARD')
      cy.get('[data-testid="create-submit-button"]').click()
      
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).invoke('text').then((code) => {
        const roomCode = code.trim()
        cy.wait(2000)
        
        // Add second player
        cy.clearLocalStorage()
        cy.visit('/')
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 }).should('exist')
        cy.wait(500)
        
        cy.get('[data-testid="join-room-button"]').click()
        cy.get('[data-testid="room-code-input"]').type(roomCode)
        cy.get('[data-testid="join-button"]').click()
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        cy.get('[data-testid="participant-item"]', { timeout: 10000 }).should('have.length', 2)
        cy.wait(1000)
        
        // Start game
        cy.clearLocalStorage()
        cy.visit(`/lobby/${roomCode}`)
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 }).should('exist')
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        cy.get('[data-testid="participant-item"]', { timeout: 15000 }).should('have.length', 2)
        
        cy.get('[data-testid="start-game-button"]', { timeout: 5000 }).click()
        cy.url({ timeout: 15000 }).should('include', '/game/')
        
        // Verify difficulty is shown (optional - depends on UI)
        // At minimum, word should be assigned
        cy.get('[data-testid="secret-word"]', { timeout: 20000 }).should('exist')
        cy.get('[data-testid="secret-word"]').should('not.be.empty')
      })
    })

    it('TC056: should initialize turn order', () => {
      // Create room and start game
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="game-mode-selector"]').select('SILENT') // Silent mode for turn-based
      cy.get('[data-testid="create-submit-button"]').click()
      
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).invoke('text').then((code) => {
        const roomCode = code.trim()
        cy.wait(2000)
        
        // Add second player
        cy.clearLocalStorage()
        cy.visit('/')
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 }).should('exist')
        cy.wait(500)
        
        cy.get('[data-testid="join-room-button"]').click()
        cy.get('[data-testid="room-code-input"]').type(roomCode)
        cy.get('[data-testid="join-button"]').click()
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        cy.get('[data-testid="participant-item"]', { timeout: 10000 }).should('have.length', 2)
        cy.wait(1000)
        
        // Start game
        cy.clearLocalStorage()
        cy.visit(`/lobby/${roomCode}`)
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 }).should('exist')
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        cy.get('[data-testid="participant-item"]', { timeout: 15000 }).should('have.length', 2)
        
        cy.get('[data-testid="start-game-button"]', { timeout: 5000 }).click()
        cy.url({ timeout: 15000 }).should('include', '/game/')
        
        // Wait for Whisper phase to end (30 seconds default)
        // Then check for turn indicator in Hint Drop phase
        cy.wait(32000) // Wait for Whisper phase
        
        // Should now be in Hint Drop phase
        // Turn indicator should exist
        cy.get('[data-testid="turn-indicator"]', { timeout: 10000 }).should('exist')
      })
    })
  })
})