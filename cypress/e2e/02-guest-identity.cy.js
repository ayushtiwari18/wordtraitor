describe('Phase 2: Guest Identity System', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage()
    cy.visit('/')
    // Wait for React useEffect to initialize guest
    cy.wait(300)
  })

  describe('TC010: Guest ID generated on first visit', () => {
    it('should generate guest ID when visiting for first time', () => {
      // Check localStorage has guestId
      cy.window().then((win) => {
        const guestId = win.localStorage.getItem('guestId')
        expect(guestId).to.exist
        expect(guestId).to.be.a('string')
        expect(guestId.length).to.be.greaterThan(0)
      })
    })

    it('should generate guest ID with correct format', () => {
      cy.window().then((win) => {
        const guestId = win.localStorage.getItem('guestId')
        // Should start with 'guest_'
        expect(guestId).to.match(/^guest_/)
      })
    })

    it('should generate guest ID containing timestamp and random string', () => {
      cy.window().then((win) => {
        const guestId = win.localStorage.getItem('guestId')
        // Format: guest_{timestamp}_{random}
        const parts = guestId.split('_')
        expect(parts.length).to.equal(3)
        expect(parts[0]).to.equal('guest')
        expect(parts[1]).to.match(/^\d+$/) // timestamp is numeric
        expect(parts[2].length).to.be.greaterThan(0) // has random part
      })
    })
  })

  describe('TC011: Guest ID persists in localStorage', () => {
    it('should save guest ID to localStorage', () => {
      cy.window().then((win) => {
        const guestId = win.localStorage.getItem('guestId')
        expect(guestId).to.not.be.null
      })
    })

    it('should keep same guest ID after page reload', () => {
      let firstGuestId
      
      // Get initial guest ID
      cy.window().then((win) => {
        firstGuestId = win.localStorage.getItem('guestId')
      })

      // Reload page
      cy.reload()
      cy.wait(300) // Wait for initialization

      // Check guest ID is the same
      cy.window().then((win) => {
        const secondGuestId = win.localStorage.getItem('guestId')
        expect(secondGuestId).to.equal(firstGuestId)
      })
    })

    it('should not regenerate guest ID on subsequent visits', () => {
      let originalGuestId

      // First visit - get guest ID
      cy.window().then((win) => {
        originalGuestId = win.localStorage.getItem('guestId')
      })

      // Navigate away and back
      cy.visit('https://example.com')
      cy.visit('/')
      cy.wait(300) // Wait for initialization

      // Check guest ID hasn't changed
      cy.window().then((win) => {
        const currentGuestId = win.localStorage.getItem('guestId')
        expect(currentGuestId).to.equal(originalGuestId)
      })
    })
  })

  describe('TC012: Same guest ID used across sessions', () => {
    it('should use existing guest ID from localStorage', () => {
      const customGuestId = 'guest_1234567890_testuser'
      
      // Set a custom guest ID
      cy.window().then((win) => {
        win.localStorage.setItem('guestId', customGuestId)
      })

      // Reload to trigger initialization
      cy.reload()
      cy.wait(300)

      // Check it uses the existing ID
      cy.window().then((win) => {
        const guestId = win.localStorage.getItem('guestId')
        expect(guestId).to.equal(customGuestId)
      })
    })

    it('should not overwrite existing guest ID', () => {
      const existingGuestId = 'guest_9999999999_existing'
      
      // Set existing ID before visit
      cy.clearLocalStorage()
      cy.window().then((win) => {
        win.localStorage.setItem('guestId', existingGuestId)
        win.localStorage.setItem('guestUsername', 'ExistingPlayer')
      })

      // Reload page
      cy.reload()
      cy.wait(300)

      // Check ID hasn't changed
      cy.window().then((win) => {
        const guestId = win.localStorage.getItem('guestId')
        expect(guestId).to.equal(existingGuestId)
      })
    })
  })

  describe('TC013: Username generated correctly', () => {
    it('should generate username on first visit', () => {
      cy.window().then((win) => {
        const username = win.localStorage.getItem('guestUsername')
        expect(username).to.exist
        expect(username).to.be.a('string')
      })
    })

    it('should generate username with Player prefix', () => {
      cy.window().then((win) => {
        const username = win.localStorage.getItem('guestUsername')
        expect(username).to.match(/^Player\d+$/)
      })
    })

    it('should generate username with 4-digit number', () => {
      cy.window().then((win) => {
        const username = win.localStorage.getItem('guestUsername')
        // Extract number from "Player1234"
        const numberPart = username.replace('Player', '')
        expect(numberPart).to.match(/^\d+$/)
        expect(parseInt(numberPart)).to.be.at.most(9999)
      })
    })

    it('should persist username in localStorage', () => {
      let firstUsername
      
      cy.window().then((win) => {
        firstUsername = win.localStorage.getItem('guestUsername')
      })

      cy.reload()
      cy.wait(300)

      cy.window().then((win) => {
        const secondUsername = win.localStorage.getItem('guestUsername')
        expect(secondUsername).to.equal(firstUsername)
      })
    })
  })

  describe('TC014: Multiple tabs use same identity', () => {
    it('should use same guest ID when opening in new tab', () => {
      let guestId

      // Get guest ID from first tab
      cy.window().then((win) => {
        guestId = win.localStorage.getItem('guestId')
      })

      // Simulate new tab by clearing memory but keeping localStorage
      cy.reload()
      cy.wait(300)

      // Check it uses same ID
      cy.window().then((win) => {
        const newTabGuestId = win.localStorage.getItem('guestId')
        expect(newTabGuestId).to.equal(guestId)
      })
    })

    it('should not create duplicate guest IDs', () => {
      let firstId
      let secondId

      // First "tab"
      cy.window().then((win) => {
        firstId = win.localStorage.getItem('guestId')
      })

      // Second "tab" (reload)
      cy.reload()
      cy.wait(300)
      cy.window().then((win) => {
        secondId = win.localStorage.getItem('guestId')
      })

      // Should be identical
      cy.then(() => {
        expect(firstId).to.equal(secondId)
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle corrupted localStorage gracefully', () => {
      // Clear and set invalid empty data
      cy.clearLocalStorage()
      
      // Set empty strings (corrupted data)
      cy.window().then((win) => {
        win.localStorage.setItem('guestId', '')
        win.localStorage.setItem('guestUsername', '')
      })

      // Reload to trigger reinitialization
      cy.reload()
      cy.wait(300)

      // Should have generated new valid IDs
      cy.window().then((win) => {
        const guestId = win.localStorage.getItem('guestId')
        const username = win.localStorage.getItem('guestUsername')
        
        expect(guestId).to.not.be.empty
        expect(username).to.not.be.empty
        expect(guestId).to.match(/^guest_/)
        expect(username).to.match(/^Player\d+$/)
      })
    })

    it('should generate unique IDs on different visits', () => {
      let firstId

      // First visit
      cy.window().then((win) => {
        firstId = win.localStorage.getItem('guestId')
      })

      // Clear and create new user
      cy.clearLocalStorage()
      cy.reload()
      cy.wait(300)

      // Get new ID
      cy.window().then((win) => {
        const secondId = win.localStorage.getItem('guestId')
        
        // IDs should be different
        expect(secondId).to.not.be.null
        expect(firstId).to.not.equal(secondId)
      })
    })
  })
})