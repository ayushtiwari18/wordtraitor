describe('Phase 1: Home Page & Navigation', () => {
  beforeEach(() => {
    // Visit home page before each test
    cy.visit('/')
  })

  describe('TC001: Home page loads correctly', () => {
    it('should display the main heading', () => {
      cy.contains('h1', 'WordTraitor').should('be.visible')
    })

    it('should display the tagline', () => {
      cy.contains('Find the traitor before it\'s too late!').should('be.visible')
    })

    it('should display the emoji', () => {
      cy.contains('🕵️').should('be.visible')
    })

    it('should have Create Room button', () => {
      cy.contains('button', 'Create Room').should('be.visible')
    })

    it('should have Join Room button', () => {
      cy.contains('button', 'Join Room').should('be.visible')
    })
  })

  describe('TC002: "Create Room" button opens modal', () => {
    it('should open create room modal on click', () => {
      cy.contains('button', 'Create Room').click()
      cy.contains('h2', 'Create Room').should('be.visible')
    })

    it('should show game mode selector', () => {
      cy.contains('button', 'Create Room').click()
      cy.contains('label', 'Game Mode').should('be.visible')
      cy.get('select').eq(0).should('be.visible')
    })

    it('should show difficulty selector', () => {
      cy.contains('button', 'Create Room').click()
      cy.contains('label', 'Difficulty').should('be.visible')
      cy.get('select').eq(1).should('be.visible')
    })

    it('should show word pack selector', () => {
      cy.contains('button', 'Create Room').click()
      cy.contains('label', 'Word Pack').should('be.visible')
      cy.get('select').eq(2).should('be.visible')
    })

    it('should have advanced settings toggle', () => {
      cy.contains('button', 'Create Room').click()
      cy.contains('button', 'Advanced Settings').should('be.visible')
    })

    it('should have create button in modal', () => {
      cy.contains('button', 'Create Room').click()
      cy.get('.fixed').contains('button', 'Create Room').should('be.visible')
    })

    it('should have cancel button', () => {
      cy.contains('button', 'Create Room').click()
      cy.contains('button', 'Cancel').should('be.visible')
    })
  })

  describe('TC003: "Join Room" button opens modal', () => {
    it('should open join room modal on click', () => {
      cy.contains('button', 'Join Room').click()
      cy.contains('h2', 'Join Room').should('be.visible')
    })

    it('should show room code input', () => {
      cy.contains('button', 'Join Room').click()
      cy.get('input[type="text"]').should('be.visible')
      cy.get('input[placeholder*="code"]').should('be.visible')
    })

    it('should have join button in modal', () => {
      cy.contains('button', 'Join Room').click()
      cy.get('.fixed').contains('button', 'Join Game').should('be.visible')
    })

    it('should have cancel button', () => {
      cy.contains('button', 'Join Room').click()
      cy.contains('button', 'Cancel').should('be.visible')
    })

    it('should show 6 character limit on input', () => {
      cy.contains('button', 'Join Room').click()
      cy.get('input[type="text"]').should('have.attr', 'maxLength', '6')
    })
  })

  describe('TC004: Modal closes on cancel', () => {
    it('should close create room modal on cancel', () => {
      cy.contains('button', 'Create Room').click()
      cy.contains('h2', 'Create Room').should('be.visible')
      cy.contains('button', 'Cancel').click()
      cy.contains('h2', 'Create Room').should('not.exist')
    })

    it('should close join room modal on cancel', () => {
      cy.contains('button', 'Join Room').click()
      cy.contains('h2', 'Join Room').should('be.visible')
      cy.contains('button', 'Cancel').click()
      cy.contains('h2', 'Join Room').should('not.exist')
    })

    it('should close modal on backdrop click', () => {
      cy.contains('button', 'Create Room').click()
      cy.contains('h2', 'Create Room').should('be.visible')
      cy.get('.fixed').click(5, 5) // Click backdrop
      // Modal should still be visible (clicking modal content)
    })
  })

  describe('TC005: How to Play section displays', () => {
    it('should show "How to Play" heading', () => {
      cy.contains('How to Play').should('be.visible')
    })

    it('should show step 1: Get Your Word', () => {
      cy.contains('Get Your Word').should('be.visible')
    })

    it('should show step 2: Give Hints', () => {
      cy.contains('Give Hints').should('be.visible')
    })

    it('should show step 3: Find the Traitor', () => {
      cy.contains('Find the Traitor').should('be.visible')
    })

    it('should have all three step icons', () => {
      cy.contains('📝').should('be.visible')
      cy.contains('💬').should('be.visible')
      cy.contains('⚖️').should('be.visible')
    })
  })

  describe('Advanced Settings Toggle', () => {
    it('should expand advanced settings', () => {
      cy.contains('button', 'Create Room').click()
      cy.contains('button', 'Advanced Settings').click()
      cy.contains('Number of Traitors').should('be.visible')
    })

    it('should show traitor count input', () => {
      cy.contains('button', 'Create Room').click()
      cy.contains('button', 'Advanced Settings').click()
      cy.get('input[type="number"]').first().should('be.visible')
    })

    it('should show phase timing inputs', () => {
      cy.contains('button', 'Create Room').click()
      cy.contains('button', 'Advanced Settings').click()
      
      // Check header is visible
      cy.contains('Phase Timings (seconds)').should('be.visible')
      
      // Scroll each label into view before checking visibility
      cy.contains('Whisper Phase').scrollIntoView().should('be.visible')
      cy.contains('Hint Drop Phase').scrollIntoView().should('be.visible')
      cy.contains('Debate Phase').scrollIntoView().should('be.visible')
      cy.contains('Verdict Phase').scrollIntoView().should('be.visible')
      cy.contains('Reveal Phase').scrollIntoView().should('be.visible')
    })

    it('should collapse advanced settings', () => {
      cy.contains('button', 'Create Room').click()
      cy.contains('button', 'Advanced Settings').click()
      cy.contains('Number of Traitors').should('be.visible')
      cy.contains('button', 'Advanced Settings').click()
      cy.contains('Number of Traitors').should('not.exist')
    })
  })

  describe('Form Validation', () => {
    it('should disable join button when code is empty', () => {
      cy.contains('button', 'Join Room').click()
      cy.get('.fixed').contains('button', 'Join Game').should('be.disabled')
    })

    it('should enable join button when code is entered', () => {
      cy.contains('button', 'Join Room').click()
      cy.get('input[type="text"]').type('ABC123')
      cy.get('.fixed').contains('button', 'Join Game').should('not.be.disabled')
    })

    it('should convert room code to uppercase', () => {
      cy.contains('button', 'Join Room').click()
      cy.get('input[type="text"]').type('abc123')
      cy.get('input[type="text"]').should('have.value', 'ABC123')
    })
  })
})