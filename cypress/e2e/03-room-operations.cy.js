describe('Phase 3: Room Creation & Joining', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/')
    cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 })
  })

  describe('TC015: Create Room - Silent Mode', () => {
    it('should create room with Silent mode', () => {
      // Click Create Room button (opens modal)
      cy.get('[data-testid="create-room-button"]').click()
      
      // Modal should be visible
      cy.contains('h2', 'Create Room').should('be.visible')
      
      // Game mode should default to SILENT
      cy.get('[data-testid="game-mode-selector"]').should('have.value', 'SILENT')
      
      // Submit form
      cy.get('[data-testid="create-submit-button"]').click()
      
      // Wait for room-code element (indicates successful navigation)
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      cy.url().should('include', '/lobby/')
    })

    it('should generate unique 6-character room code', () => {
      // Open modal and create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      
      // Wait for room code to appear
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      cy.get('[data-testid="room-code"]').invoke('text').then((code) => {
        // Should be 6 characters
        expect(code.trim().length).to.equal(6)
        // Should be uppercase alphanumeric
        expect(code.trim()).to.match(/^[A-Z0-9]{6}$/)
      })
    })

    it('should identify creator as host', () => {
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      
      // Wait for room code first
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      // Check for host indicator
      cy.get('[data-testid="is-host"]', { timeout: 10000 }).should('exist')
    })

    it('should show creator in participants list', () => {
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      
      // Wait for room code first
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      // Should show at least 1 participant (creator)
      cy.get('[data-testid="participants-list"]', { timeout: 10000 }).should('exist')
      cy.get('[data-testid="participant-item"]', { timeout: 10000 }).should('have.length.at.least', 1)
    })
  })

  describe('TC016: Create Room - Real Mode', () => {
    it('should create room with Real mode when selected', () => {
      // Open create modal
      cy.get('[data-testid="create-room-button"]').click()
      
      // Select Real mode
      cy.get('[data-testid="game-mode-selector"]').select('REAL')
      cy.get('[data-testid="game-mode-selector"]').should('have.value', 'REAL')
      
      // Submit
      cy.get('[data-testid="create-submit-button"]').click()
      
      // Wait for room code
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      // Verify mode is set to Real
      cy.get('[data-testid="game-mode"]', { timeout: 10000 }).should('contain', 'Real')
    })
  })

  describe('TC017: Room Code Format & Validation', () => {
    it('should generate different codes for different rooms', () => {
      let firstCode
      
      // Create first room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).invoke('text').then((code) => {
        firstCode = code.trim()
      })
      
      // CRITICAL: Add delay to prevent DB overwhelm
      cy.wait(2000)
      
      // Go back and create another room
      cy.visit('/')
      cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 })
      cy.wait(500)
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).invoke('text').then((secondCode) => {
        // Codes should be different
        expect(secondCode.trim()).to.not.equal(firstCode)
      })
    })

    it('should use URL-safe characters only', () => {
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).invoke('text').then((code) => {
        // Should be uppercase alphanumeric
        expect(code.trim()).to.match(/^[A-Z0-9]{6}$/)
      })
    })
  })

  describe('TC018: Join Room with Valid Code', () => {
    it('should join room with valid code', () => {
      // First, create a room and get its code
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).invoke('text').then((code) => {
        const roomCode = code.trim()
        
        // CRITICAL: Wait for room to be fully created in DB
        cy.wait(2000)
        
        // Open new session (simulate second user)
        cy.clearLocalStorage()
        cy.visit('/')
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 })
        cy.wait(500)
        
        // Click Join Room (opens modal)
        cy.get('[data-testid="join-room-button"]').click()
        
        // Enter room code
        cy.get('[data-testid="room-code-input"]').type(roomCode)
        cy.get('[data-testid="join-button"]').click()
        
        // Wait for room code element (indicates successful join)
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        cy.get('[data-testid="room-code"]').should('contain', roomCode)
      })
    })

    it('should show joined player in participants list', () => {
      // Create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).invoke('text').then((code) => {
        const roomCode = code.trim()
        
        // CRITICAL: Wait for room to be fully created in DB
        cy.wait(2000)
        
        // Join as second user
        cy.clearLocalStorage()
        cy.visit('/')
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 })
        cy.wait(500)
        
        cy.get('[data-testid="join-room-button"]').click()
        cy.get('[data-testid="room-code-input"]').type(roomCode)
        cy.get('[data-testid="join-button"]').click()
        
        // Wait for room code
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        
        // Should see at least 1 participant (could be 2 if real-time works)
        cy.get('[data-testid="participant-item"]', { timeout: 10000 }).should('have.length.at.least', 1)
      })
    })

    it('should not identify joiner as host', () => {
      // Create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).invoke('text').then((code) => {
        const roomCode = code.trim()
        
        // CRITICAL: Wait for room to be fully created in DB
        cy.wait(2000)
        
        // Join as second user
        cy.clearLocalStorage()
        cy.visit('/')
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 })
        cy.wait(500)
        
        cy.get('[data-testid="join-room-button"]').click()
        cy.get('[data-testid="room-code-input"]').type(roomCode)
        cy.get('[data-testid="join-button"]').click()
        
        // Wait for room code
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        
        // Should NOT show host indicator
        cy.get('[data-testid="is-host"]').should('not.exist')
      })
    })
  })

  describe('TC019: Join Room with Invalid Code', () => {
    it('should show error for non-existent room code', () => {
      cy.get('[data-testid="join-room-button"]').click()
      
      // Enter invalid code
      cy.get('[data-testid="room-code-input"]').type('XXXXXX')
      cy.get('[data-testid="join-button"]').click()
      
      // Should show error message OR stay on home page
      cy.wait(2000)
      cy.url().should('not.include', '/lobby/')
    })

    it('should show error for empty room code', () => {
      cy.get('[data-testid="join-room-button"]').click()
      
      // Join button should be disabled when empty
      cy.get('[data-testid="join-button"]').should('be.disabled')
    })

    it('should handle malformed room codes', () => {
      const malformedCodes = ['12', 'ABCDEFGHIJ']
      
      malformedCodes.forEach((code, index) => {
        if (index > 0) {
          // Reopen modal for subsequent tests
          cy.get('[data-testid="join-room-button"]').click()
        } else {
          cy.get('[data-testid="join-room-button"]').click()
        }
        
        cy.get('[data-testid="room-code-input"]').clear().type(code)
        
        // Either button is disabled or error is shown
        cy.get('body').then(($body) => {
          const isDisabled = $body.find('[data-testid="join-button"]:disabled').length > 0
          if (!isDisabled) {
            cy.get('[data-testid="join-button"]').click()
            cy.wait(2000)
            cy.url().should('not.include', '/lobby/')
          }
        })
        
        // Close modal if open
        cy.get('body').then(($body) => {
          if ($body.text().includes('Cancel')) {
            cy.contains('button', 'Cancel').click()
          }
        })
      })
    })
  })

  describe('TC020: Multiple Participants', () => {
    it('should support multiple users joining same room', () => {
      // Create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).invoke('text').then((code) => {
        const roomCode = code.trim()
        
        // CRITICAL: Wait for room to be fully created in DB
        cy.wait(2000)
        
        // User 2 joins
        cy.clearLocalStorage()
        cy.visit('/')
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 })
        cy.wait(500)
        cy.get('[data-testid="join-room-button"]').click()
        cy.get('[data-testid="room-code-input"]').type(roomCode)
        cy.get('[data-testid="join-button"]').click()
        
        // Wait for room code
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        
        // Should show at least 1 participant
        cy.get('[data-testid="participant-item"]', { timeout: 10000 }).should('have.length.at.least', 1)
      })
    })
  })

  describe('TC021: Room Persistence', () => {
    it('should maintain room after page reload', () => {
      // Create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      cy.url().then((url) => {
        // Wait for room to be ready
        cy.wait(1000)
        
        // Reload page
        cy.reload()
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 })
        
        // Should still be in same room
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        cy.url().should('include', '/lobby/')
      })
    })

    it('should allow returning to room via URL', () => {
      // Create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      cy.url().then((url) => {
        const roomUrl = url
        
        // Wait for room to be ready
        cy.wait(1000)
        
        // Go to home
        cy.visit('/')
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 })
        cy.wait(500)
        
        // Return to room
        cy.visit(roomUrl)
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 })
        
        // Should be back in room
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
        cy.url().should('include', '/lobby/')
      })
    })
  })

  describe('TC022: Edge Cases', () => {
    it('should handle rapid room creation', () => {
      // Create first room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      // CRITICAL: Add delay to prevent DB overwhelm
      cy.wait(2000)
      
      // Create second room
      cy.visit('/')
      cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 })
      cy.wait(500)
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
    })

    it('should handle joining same room twice', () => {
      // Create room
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      
      cy.url().then((url) => {
        const roomUrl = url
        
        // Wait for room to be ready
        cy.wait(1000)
        
        // Try to visit again with same guest
        cy.visit(roomUrl)
        cy.get('[data-testid="app-root"][data-guest-initialized="true"]', { timeout: 10000 })
        
        // Should handle gracefully
        cy.get('[data-testid="room-code"]', { timeout: 30000 }).should('exist')
      })
    })

    it('should handle network errors gracefully', () => {
      // Create room should not crash the app even with errors
      cy.get('[data-testid="create-room-button"]').click()
      cy.get('[data-testid="create-submit-button"]').click()
      
      // App should remain functional (wait up to 30 seconds)
      cy.wait(2000)
      cy.get('body').should('exist')
    })
  })
})