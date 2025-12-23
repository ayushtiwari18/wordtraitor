# Cypress Test Fixes - December 23, 2025

## Overview

This document explains the fixes applied to resolve failing Cypress E2E tests in the `07-game-mechanics.cy.js` file.

## Problems Identified

### 1. **Context Switching Failures** ❌
**Error:** `Expected to find element [data-testid="room-code"], but never found it`

**Root Cause:** 
- When switching between player contexts (host ↔ player2), the test was:
  1. Setting `localStorage` values
  2. Then navigating with `cy.visit()`
  3. The page reload was clearing the just-set localStorage values

**Impact:** Tests failed when trying to switch back to host context after player 2 joined.

---

### 2. **Supabase Rate Limiting** ⚠️
**Error:** `TypeError: Failed to fetch` with retries

**Root Cause:**
- Tests were creating rooms too quickly (7-second delays between tests)
- Supabase was rate-limiting API requests
- Network calls were timing out or failing intermittently

**Impact:** Random test failures due to network/API unavailability.

---

### 3. **Auto-Join Creating Extra Participants** 👥
**Error:** `Too many elements found. Found 3, expected 2`

**Root Cause:**
- `gameStore.js`'s `loadRoom()` function was auto-joining users not in the room
- When tests switched contexts, the new guest_id wasn't recognized as existing participant
- This created a 3rd participant entry in the database

**Impact:** Tests expecting 2 players found 3 players.

---

### 4. **Cypress Syntax Error** ❌
**Error:** `TypeError: cy.get(...)...should(...).or is not a function`

**Root Cause:**
- Cypress doesn't have an `.or()` method
- Test TC074 was using invalid syntax: `.should('be.disabled').or('not.exist')`

**Impact:** Test failed with syntax error.

---

## Fixes Applied

### Fix 1: Context Switching (07-game-mechanics.cy.js)

**Before:**
```javascript
cy.clearLocalStorage()
cy.window().then((hostWin) => {
  hostWin.localStorage.setItem('guest_id', hostId)
  hostWin.localStorage.setItem('username', hostUsername)
})
cy.visit(`/lobby/${roomCode}`) // ❌ Page reload clears localStorage
```

**After:**
```javascript
cy.visit(`/lobby/${roomCode}`, {
  onBeforeLoad(win) { // ✅ Set BEFORE page loads
    win.localStorage.clear()
    win.localStorage.setItem('guest_id', hostId)
    win.localStorage.setItem('username', hostUsername)
  }
})
```

**Result:** localStorage is set correctly before the page loads.

---

### Fix 2: Rate Limiting (07-game-mechanics.cy.js)

**Before:**
```javascript
afterEach(() => {
  cy.wait(7000) // ❌ Too short for Supabase
})
```

**After:**
```javascript
afterEach(() => {
  cy.wait(12000) // ✅ Increased to 12 seconds
})
```

**Result:** More time between tests reduces rate limit hits.

---

### Fix 3: Auto-Join Logic (src/store/gameStore.js)

**Before:**
```javascript
const alreadyJoined = participants.some(p => p.user_id === guestId)
```

**After:**
```javascript
const alreadyJoined = participants.some(p => {
  // Normalize guest_id by removing prefix if present
  const normalizedGuestId = guestId.replace('guest_', '')
  const normalizedParticipantId = p.user_id.replace('guest_', '')
  return p.user_id === guestId || normalizedParticipantId === normalizedGuestId
})

console.log('🔍 Checking participant status: guestId=', guestId.slice(0, 20), 'alreadyJoined=', alreadyJoined)

if (!alreadyJoined && room.status === 'LOBBY') {
  console.log('🆕 Not in room, auto-joining...')
  // Auto-join logic
} else {
  if (alreadyJoined) {
    console.log('✅ Already in room, skipping auto-join')
  }
  // ...
}
```

**Result:** 
- Better participant detection
- Added logging for debugging
- Prevents duplicate joins

---

### Fix 4: Cypress Syntax Error (07-game-mechanics.cy.js)

**Before:**
```javascript
cy.get('[data-testid="vote-option"]')
  .should('be.disabled')
  .or('not.exist') // ❌ Invalid syntax
```

**After:**
```javascript
cy.get('body').then($body => {
  const voteOptions = $body.find('[data-testid="vote-option"]')
  if (voteOptions.length > 0) {
    cy.wrap(voteOptions).should('be.disabled')
  }
}) // ✅ Proper conditional check
```

**Result:** Test runs without syntax errors.

---

### Fix 5: Cypress Config Timeouts (cypress.config.js)

**Before:**
```javascript
defaultCommandTimeout: 10000,
requestTimeout: 10000,
responseTimeout: 10000,
// No pageLoadTimeout
```

**After:**
```javascript
defaultCommandTimeout: 15000, // +5s
requestTimeout: 15000, // +5s
responseTimeout: 15000, // +5s
pageLoadTimeout: 30000, // NEW
```

**Result:** More tolerance for slow Supabase responses.

---

## Testing Instructions

### 1. **Run the Fixed Tests**

```bash
# Make sure your dev server is running
npm run dev

# In another terminal, run Cypress
npx cypress open

# Or run headlessly
npx cypress run --spec "cypress/e2e/07-game-mechanics.cy.js"
```

### 2. **Expected Results**

✅ **TC057-TC061 (Whisper Phase):** Should pass with proper role/word display  
✅ **TC062-TC069 (Hint Drop):** Should pass with turn-based hints working  
✅ **TC070-TC073 (Discussion):** Should pass with hint display  
✅ **TC074-TC081 (Voting):** Should pass with voting UI functional  

### 3. **If Tests Still Fail**

#### Check Supabase Connection

```bash
# Test if Supabase is accessible
curl https://ytytsdilcwxlzdstxhgo.supabase.co/rest/v1/

# Check your .env file
cat .env.local
# Should contain:
# VITE_SUPABASE_URL=https://ytytsdilcwxlzdstxhgo.supabase.co
# VITE_SUPABASE_ANON_KEY=your_key_here
```

#### Verify Supabase Project Status

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Check if your project is:
   - ✅ Active (not paused)
   - ✅ Within quota limits
   - ✅ No outages reported

#### Increase Test Delays Further

If rate limiting persists:

```javascript
afterEach(() => {
  cy.wait(15000) // Increase from 12s to 15s
})
```

---

## Commits Applied

1. **Commit 1:** `fix: Cypress test failures - context switching, auto-join, and syntax errors`
   - File: `cypress/e2e/07-game-mechanics.cy.js`
   - SHA: `827cd0b8c0e4e25194af0dff538b5a9b184298f0`

2. **Commit 2:** `fix: Prevent auto-join creating 3rd participant in tests`
   - File: `src/store/gameStore.js`
   - SHA: `df5f9f341e70327b6f9250e7164ad026714508a5`

3. **Commit 3:** `fix: Improve Cypress timeouts and retries for Supabase stability`
   - File: `cypress.config.js`
   - SHA: `47f13d9f3579d8d58411439c445dde05e4d411d1`

---

## Key Takeaways

### ✅ What Was Fixed

1. **Context Switching:** Use `onBeforeLoad` to set localStorage before page loads
2. **Rate Limiting:** Increased delays between tests from 7s → 12s
3. **Auto-Join:** Better participant detection with normalized ID comparison
4. **Syntax Errors:** Fixed `.or()` usage with proper conditional checks
5. **Timeouts:** Increased all Cypress timeouts by 5s for network stability

### 📝 Best Practices Learned

1. **Always use `onBeforeLoad`** when setting localStorage before navigation
2. **Rate limiting is real** - give APIs time to breathe between test runs
3. **Normalize IDs** when comparing user identities across different formats
4. **Cypress doesn't support `.or()`** - use conditional checks with `.then()`
5. **Increase timeouts for remote APIs** - local tests may need 10s, but Supabase needs 15s+

### 🚀 Future Improvements

1. **Mock Supabase in CI/CD** to avoid rate limits entirely
2. **Create test-specific rooms** that expire after test completion
3. **Add retry logic** with exponential backoff for flaky network calls
4. **Use fixtures** for common test data instead of creating fresh rooms

---

## Support

If issues persist:

1. Check [Cypress Documentation](https://docs.cypress.io/)
2. Check [Supabase Status](https://status.supabase.com/)
3. Review browser console logs for additional errors
4. Check Cypress video recordings in `cypress/videos/`

---

**Last Updated:** December 23, 2025  
**Author:** AI Assistant  
**Repository:** [ayushtiwari18/wordtraitor](https://github.com/ayushtiwari18/wordtraitor)
