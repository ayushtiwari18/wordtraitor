# 🧪 WordTraitor - Testing Guide

## Prerequisites

1. **Node.js 18.x** installed
2. **Dependencies installed**: `npm install`
3. **Supabase configured**: `.env` file with credentials
4. **Dev server running**: `npm run dev` (in separate terminal)

---

## Running Tests

### Option 1: Interactive Mode (Recommended for Development)

```bash
npm test
```

This opens Cypress UI where you can:
- Select which tests to run
- Watch tests execute in real-time
- Debug failures with time-travel
- See detailed error messages

### Option 2: Headless Mode (CI/CD)

```bash
npm run test:ci
```

Runs all tests in headless mode with:
- Video recording of failures
- Screenshots on errors
- Terminal output

---

## Test Execution Steps

### Phase 1: Initial Setup

1. **Start dev server**:
   ```bash
   npm run dev
   ```
   Should run on `http://localhost:5173`

2. **Verify Supabase connection**:
   - Check `.env` file exists
   - Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Test by visiting app in browser

3. **Open Cypress**:
   ```bash
   npm test
   ```

---

### Phase 2: Run Tests One-by-One

**Start with Phase 1:**

1. In Cypress UI, select `01-home.cy.js`
2. Watch all tests execute
3. Note any failures

**Expected Results:**
- ✅ All TC001-TC005 should pass
- ✅ Advanced settings tests should pass
- ✅ Form validation should pass

**If tests fail:**
1. Check error message in Cypress
2. Check browser console (F12)
3. Verify element selectors
4. Report issue for fixing

---

### Phase 3: Progressive Testing

**After Phase 1 passes, move to next:**

```
01-home.cy.js          ✅ → 02-guest-identity.cy.js
02-guest-identity.cy.js ✅ → 03-room-creation.cy.js
03-room-creation.cy.js  ✅ → 04-room-join.cy.js
... and so on
```

**Do NOT proceed** to next phase until current phase passes!

---

## Test Structure

```
cypress/
├── e2e/
│   ├── 01-home.cy.js              ← Phase 1: Start here
│   ├── 02-guest-identity.cy.js    ← Phase 1: Next
│   ├── 03-room-creation.cy.js     ← Phase 1: Then
│   ├── ... (to be created)
│   └── 17-responsive.cy.js
├── support/
│   ├── commands.js                ← Custom commands
│   └── e2e.js                     ← Setup hooks
└── fixtures/                      ← Test data (optional)
```

---

## Custom Commands

Use these in your tests:

```javascript
// Create a room
cy.createRoom({
  gameMode: 'SILENT',
  difficulty: 'MEDIUM',
  traitorCount: 2
})

// Join a room
cy.joinRoom('ABC123')

// Wait for realtime
cy.waitForRealtime()

// Submit hint
cy.submitHint('ocean')

// Send chat
cy.sendChatMessage('I think it\'s Bob!')

// Start game (host)
cy.startGame()
```

---

## Debugging Failed Tests

### Step 1: Check the Error Message
```
CypressError: Timed out retrying after 10000ms: 
  Expected to find element: 'button', 
  but never found it.
```

This means the button doesn't exist or has different text.

### Step 2: Check Browser Console
Click on the test step in Cypress to see:
- Console logs
- Network requests
- React errors

### Step 3: Verify Element Selector
```javascript
// Instead of:
cy.contains('button', 'Create Room')

// Try:
cy.get('button').contains('Create Room')
// or
cy.get('[data-testid="create-room-btn"]')
```

### Step 4: Add Wait Times
```javascript
// If element appears after delay:
cy.contains('button', 'Create Room', { timeout: 10000 })
```

### Step 5: Check Realtime Connection
```javascript
// Wait for connection before proceeding
cy.waitForRealtime()
cy.contains('Connected').should('be.visible')
```

---

## Common Issues

### Issue 1: "baseUrl not responding"
**Solution**: Make sure dev server is running on port 5173
```bash
npm run dev
```

### Issue 2: "Supabase not configured"
**Solution**: Check `.env` file exists with proper values

### Issue 3: Tests time out
**Solution**: Increase timeout in `cypress.config.js`
```javascript
defaultCommandTimeout: 10000  // Increase to 15000
```

### Issue 4: Realtime not connecting
**Solution**: 
1. Check Supabase dashboard
2. Verify realtime enabled on tables
3. Check network tab for websocket connection

### Issue 5: Flaky tests (pass sometimes, fail others)
**Solution**:
1. Add explicit waits: `cy.wait(1000)`
2. Use `.should()` assertions (retry automatically)
3. Wait for network requests to complete

---

## Test Data Cleanup

After running tests, you may want to clean up:

1. **Manual cleanup** (Supabase Dashboard):
   - Delete test rooms from `game_rooms`
   - Delete test participants from `room_participants`

2. **Automatic cleanup** (add to test):
```javascript
after(() => {
  // Clean up test data
  cy.leaveRoom()
})
```

---

## Reporting Issues

When a test fails:

1. **Note the test case**: e.g., "TC003 fails"
2. **Copy error message**: Full Cypress error
3. **Screenshot**: Take screenshot of failure
4. **Steps to reproduce**: What you did before failure
5. **Expected vs Actual**: What should happen vs what did

**Report Format:**
```
Test: TC003 - Join Room button opens modal
Error: Element not found
Expected: Modal should open
Actual: Modal did not appear
Screenshot: [attach]
Steps: 
  1. Visited home page
  2. Clicked Join Room button
  3. Expected modal, but nothing happened
```

---

## Next Steps

✅ **Phase 1 Complete**: All home page tests pass  
→ **Phase 2**: Run `02-guest-identity.cy.js`  

❌ **Phase 1 Failed**: Fix issues before proceeding

---

## Questions?

Refer to:
- **TEST_PLAN.md**: Overall strategy
- **Cypress Docs**: https://docs.cypress.io
- **Project README**: Setup instructions