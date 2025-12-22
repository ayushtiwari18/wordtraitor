// ***********************************************
// Custom commands for WordTraitor testing
// ***********************************************

// Create a new game room
Cypress.Commands.add('createRoom', (options = {}) => {
  const {
    gameMode = 'SILENT',
    difficulty = 'MEDIUM',
    wordPack = 'GENERAL',
    traitorCount = 1,
    customTimings = null
  } = options

  // Open create room modal
  cy.contains('button', 'Create Room').click()
  
  // Fill in settings
  cy.get('select').eq(0).select(gameMode)
  cy.get('select').eq(1).select(difficulty)
  cy.get('select').eq(2).select(wordPack)
  
  // Advanced settings if provided
  if (traitorCount > 1 || customTimings) {
    cy.contains('button', 'Advanced Settings').click()
    
    if (traitorCount > 1) {
      cy.get('input[type="number"]').first().clear().type(traitorCount.toString())
    }
    
    if (customTimings) {
      Object.keys(customTimings).forEach((phase, index) => {
        cy.get('input[type="number"]').eq(index + 1).clear().type(customTimings[phase].toString())
      })
    }
  }
  
  // Submit
  cy.contains('button', 'Create Room').click()
  
  // Wait for navigation to lobby
  cy.url().should('include', '/lobby/')
  
  // Get and return room code
  cy.get('div').contains(/[A-Z0-9]{6}/).invoke('text').as('roomCode')
})

// Join an existing room
Cypress.Commands.add('joinRoom', (roomCode) => {
  cy.contains('button', 'Join Room').click()
  cy.get('input[type="text"]').type(roomCode)
  cy.contains('button', 'Join Game').click()
  cy.url().should('include', '/lobby/')
})

// Wait for realtime connection
Cypress.Commands.add('waitForRealtime', () => {
  cy.contains('Connected', { timeout: 10000 }).should('be.visible')
})

// Get guest ID from localStorage
Cypress.Commands.add('getGuestId', () => {
  return cy.window().then((win) => {
    return win.localStorage.getItem('guestId')
  })
})

// Set custom guest ID
Cypress.Commands.add('setGuestId', (guestId) => {
  cy.window().then((win) => {
    win.localStorage.setItem('guestId', guestId)
  })
})

// Clear guest data
Cypress.Commands.add('clearGuestData', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('guestId')
    win.localStorage.removeItem('guestUsername')
  })
})

// Wait for game phase
Cypress.Commands.add('waitForPhase', (phaseName) => {
  const phaseTexts = {
    WHISPER: 'View Your Word',
    HINT_DROP: 'Drop Your Hint',
    DEBATE: 'Debate Time',
    VERDICT: 'Cast Your Vote',
    REVEAL: 'Round Results'
  }
  
  cy.contains(phaseTexts[phaseName], { timeout: 15000 }).should('be.visible')
})

// Submit a hint
Cypress.Commands.add('submitHint', (hintText) => {
  cy.get('input[placeholder*="hint"]').type(hintText)
  cy.contains('button', 'Submit Hint').click()
})

// Click Next (Real Mode)
Cypress.Commands.add('clickNext', () => {
  cy.contains('button', 'Next Player').click()
})

// Send chat message
Cypress.Commands.add('sendChatMessage', (message) => {
  cy.get('input[placeholder*="message"]').type(message)
  cy.contains('button', 'Send').click()
})

// Cast vote
Cypress.Commands.add('castVote', (playerName) => {
  cy.contains(playerName).parent().parent().contains('Vote').click()
  cy.contains('button', 'Confirm Vote').click()
})

// Check if player is host
Cypress.Commands.add('isHost', () => {
  return cy.get('body').then(($body) => {
    return $body.text().includes('Start Game')
  })
})

// Start game (host only)
Cypress.Commands.add('startGame', () => {
  cy.contains('button', 'Start Game').click()
  cy.url().should('include', '/game/')
})

// Leave room
Cypress.Commands.add('leaveRoom', () => {
  cy.contains('button', 'Leave').click()
  cy.url().should('eq', Cypress.config().baseUrl + '/')
})