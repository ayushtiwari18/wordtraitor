// ***********************************************
// Custom commands for WordTraitor testing
// ***********************************************

// ==========================================
// CLEANUP & INITIALIZATION
// ==========================================

// Clear all storage and subscriptions - USE THIS IN beforeEach
Cypress.Commands.add('clearLocalStorage', () => {
  cy.window().then((win) => {
    // Clear all storage
    win.localStorage.clear()
    win.sessionStorage.clear()
    
    // Clear IndexedDB if it exists
    if (win.indexedDB && win.indexedDB.databases) {
      win.indexedDB.databases().then((databases) => {
        databases.forEach((db) => {
          win.indexedDB.deleteDatabase(db.name)
        })
      }).catch(() => {
        // Ignore errors
      })
    }
    
    cy.log('✅ All storage cleared')
  })
})

// Force reload and wait for app initialization
Cypress.Commands.add('resetApp', () => {
  cy.clearLocalStorage()
  cy.visit('/', { timeout: 30000 })
  cy.get('[data-testid="app-root"]', { timeout: 30000 }).should('exist')
  cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 30000 }).should('exist')
  cy.wait(500) // Small buffer for React effects
  cy.log('✅ App reset complete')
})

// ==========================================
// ROOM CREATION WITH RETRY LOGIC
// ==========================================

// Create room with automatic retry for flaky database
Cypress.Commands.add('createRoomReliable', (options = {}) => {
  const { 
    maxRetries = 5,
    gameMode = 'SILENT',
    difficulty = 'MEDIUM',
    wordPack = 'GENERAL'
  } = options
  
  let attempt = 0
  
  function tryCreate() {
    attempt++
    cy.log(`🔄 Room creation attempt ${attempt}/${maxRetries}`)
    
    // Click create button
    cy.get('[data-testid="create-room-button"]', { timeout: 10000 }).click()
    
    // Wait for modal
    cy.get('[data-testid="create-submit-button"]', { timeout: 10000 }).should('be.visible')
    
    // Set game mode if specified
    if (gameMode === 'REAL') {
      cy.get('[data-testid="game-mode-selector"]').select('REAL')
    }
    
    // Submit
    cy.get('[data-testid="create-submit-button"]').click()
    
    // Check result
    cy.wait(3000)
    
    cy.url({ timeout: 15000 }).then((url) => {
      if (url.includes('/lobby/')) {
        cy.log(`✅ Room created successfully on attempt ${attempt}`)
        // Verify room code exists
        cy.get('[data-testid="room-code"]', { timeout: 10000 }).should('exist')
      } else {
        // Check if error occurred
        cy.get('body').then(($body) => {
          const hasError = $body.find('[data-testid="error-message"]').length > 0
          
          if (hasError || url === Cypress.config().baseUrl + '/') {
            if (attempt < maxRetries) {
              cy.log(`⚠️ Creation failed, retrying... (${attempt}/${maxRetries})`)
              
              // Close modal if open
              if ($body.find('[data-testid="create-submit-button"]').length > 0) {
                cy.contains('Cancel').click()
                cy.wait(500)
              }
              
              // Retry
              tryCreate()
            } else {
              throw new Error(`Room creation failed after ${maxRetries} attempts`)
            }
          }
        })
      }
    })
  }
  
  tryCreate()
})

// Original create command (kept for backwards compatibility)
Cypress.Commands.add('createRoom', (options = {}) => {
  const {
    gameMode = 'SILENT',
    difficulty = 'MEDIUM',
    wordPack = 'GENERAL',
    traitorCount = 1,
    customTimings = null
  } = options

  // Open create room modal
  cy.get('[data-testid="create-room-button"]').click()
  
  // Fill in settings
  cy.get('[data-testid="game-mode-selector"]').select(gameMode)
  cy.get('[data-testid="difficulty-selector"]').select(difficulty)
  cy.get('[data-testid="wordpack-selector"]').select(wordPack)
  
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
  cy.get('[data-testid="create-submit-button"]').click()
  
  // Wait for navigation to lobby
  cy.url({ timeout: 20000 }).should('include', '/lobby/')
})

// ==========================================
// ROOM JOINING
// ==========================================

// Join an existing room
Cypress.Commands.add('joinRoom', (roomCode) => {
  cy.get('[data-testid="join-room-button"]').click()
  cy.get('[data-testid="room-code-input"]').type(roomCode)
  cy.get('[data-testid="join-button"]').click()
  cy.url({ timeout: 20000 }).should('include', '/lobby/')
})

// ==========================================
// HELPERS
// ==========================================

// Get room code from lobby
Cypress.Commands.add('getRoomCode', () => {
  return cy.get('[data-testid="room-code"]', { timeout: 10000 })
    .invoke('text')
    .then((code) => {
      const trimmed = code.trim()
      cy.log(`📋 Room code: ${trimmed}`)
      return cy.wrap(trimmed)
    })
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

// ==========================================
// GAME PHASE COMMANDS
// ==========================================

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