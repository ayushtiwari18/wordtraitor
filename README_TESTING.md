# WordTraitor - Testing Guide

## 🎯 **Quick Start**

### **Option 1: Scaled Tests (Recommended for Development)**

✅ **Best for:** Daily development, CI/CD, MVP launch  
⏱️ **Duration:** ~5 minutes  
💾 **API Calls:** ~100  

```bash
# 1. Run setup script
chmod +x scripts/setup-scaled-tests.sh
./scripts/setup-scaled-tests.sh

# 2. Start dev server
npm run dev

# 3. Run scaled tests (in another terminal)
npx cypress run --spec "cypress/e2e/07-game-mechanics-scaled.cy.js"
```

### **Option 2: Full Tests (Run Weekly)**

🔍 **Best for:** Pre-release validation, comprehensive coverage  
⏱️ **Duration:** ~15 minutes  
💾 **API Calls:** ~250  

```bash
# 1. Start dev server
npm run dev

# 2. Run full test suite
npx cypress run --spec "cypress/e2e/07-game-mechanics.cy.js"
```

---

## 📊 **Test Suite Comparison**

| Feature | Full Suite | Scaled Suite |
|---------|------------|-------------|
| **Test Count** | 25 tests | 9 tests |
| **Duration** | ~15 min | ~5 min |
| **API Calls** | ~250 | ~100 |
| **Database Writes** | ~150 | ~60 |
| **Coverage** | Comprehensive | Critical paths |
| **Use Case** | Pre-release | Daily dev |
| **Rate Limiting** | Possible | Unlikely |

---

## 📁 **File Organization**

```
wordtraitor/
├── cypress/
│   ├── e2e/
│   │   ├── 07-game-mechanics.cy.js          # Full suite (25 tests)
│   │   └── 07-game-mechanics-scaled.cy.js   # Scaled suite (9 tests) ⭐
│   ├── support/
│   │   ├── tasks.js                         # DB mocking tasks
│   │   └── commands.js                      # Custom commands
│   └── cypress.config.js                    # Test config
├── scripts/
│   └── setup-scaled-tests.sh                # Setup automation
├── SCALED_TESTING.md                        # 📚 Detailed guide
├── CYPRESS_FIXES.md                         # 🔧 Fix documentation
└── README_TESTING.md                        # 🎯 This file
```

---

## ⚡ **What Makes Scaled Tests Fast?**

### **1. Mock Second Player** (80% faster)

**Instead of:**
```javascript
// Open new tab
// Navigate to join page
// Enter room code
// Click join button
// Wait for participant sync
```

**We do:**
```javascript
cy.task('mockSecondPlayer', { roomCode })
```

### **2. Skip Phase Timers** (99% faster)

**Instead of:**
```javascript
cy.wait(30000) // Whisper phase
cy.wait(60000) // Hint Drop phase
cy.wait(120000) // Debate phase
```

**We do:**
```javascript
cy.task('setGamePhase', { roomCode, phase: 'VERDICT' })
```

### **3. Test Only Critical Paths**

**Instead of:** Testing every edge case (25 tests)  
**We test:** Core user journeys (9 tests)

---

## 🛠 **Setup Requirements**

### **1. Environment Variables**

Create `.env.local`:

```bash
VITE_SUPABASE_URL=https://ytytsdilcwxlzdstxhgo.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # Required for scaled tests
```

**Getting Service Role Key:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Settings > API
4. Copy the **service_role** key (not anon key!)

⚠️ **Security:** Never commit `.env.local` to git! It's already in `.gitignore`.

### **2. Dependencies**

```bash
npm install
```

### **3. Database Access**

Ensure your Supabase project is:
- ✅ Active (not paused)
- ✅ Within quota limits
- ✅ Accessible from your IP

---

## 🏃 **Running Tests**

### **Headless Mode (CI/CD)**

```bash
# Scaled tests
npx cypress run --spec "cypress/e2e/07-game-mechanics-scaled.cy.js"

# Full tests
npx cypress run --spec "cypress/e2e/07-game-mechanics.cy.js"

# All tests
npx cypress run
```

### **Interactive Mode (Development)**

```bash
npx cypress open
```

Then select the test file you want to run.

### **Specific Test**

```bash
# Run only one test
npx cypress run --spec "cypress/e2e/07-game-mechanics-scaled.cy.js" \
  --grep "TC057: should display role assignment"
```

---

## 🐛 **Troubleshooting**

### **Error: "cy.task('mockSecondPlayer') timed out"**

**Cause:** Cypress tasks not registered

**Fix:**
```javascript
// cypress.config.js
import tasks from './cypress/support/tasks.js'

setupNodeEvents(on, config) {
  on('task', tasks)
}
```

### **Error: "Missing SUPABASE_SERVICE_ROLE_KEY"**

**Cause:** Service role key not in `.env.local`

**Fix:** Add to `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### **Error: "Failed to fetch" / Rate Limiting**

**Cause:** Too many API calls too quickly

**Fix 1:** Use scaled tests (fewer API calls)
```bash
npx cypress run --spec "cypress/e2e/07-game-mechanics-scaled.cy.js"
```

**Fix 2:** Increase delays in `afterEach`:
```javascript
afterEach(() => {
  cy.wait(15000) // Increase from 12s to 15s
})
```

### **Tests Pass Locally, Fail in CI**

**Cause:** Different network conditions

**Fix:** Increase timeouts in `cypress.config.js`:
```javascript
defaultCommandTimeout: 20000, // From 15000
requestTimeout: 20000,
responseTimeout: 20000,
```

---

## 📈 **Performance Monitoring**

### **Check Database Usage During Tests**

```javascript
cy.task('getRoomStats').then((stats) => {
  console.log(`Active rooms: ${stats.rooms}`)
  console.log(`Active players: ${stats.participants}`)
})
```

### **Clean Up Test Data**

```bash
# Remove test rooms older than 1 hour
cy.task('cleanupTestData')
```

### **Monitor Test Duration**

```bash
# Run with timing
time npx cypress run --spec "cypress/e2e/07-game-mechanics-scaled.cy.js"
```

---

## 📚 **Documentation**

| File | Purpose |
|------|--------|
| [SCALED_TESTING.md](./SCALED_TESTING.md) | Complete guide to scaled testing (100-user capacity) |
| [CYPRESS_FIXES.md](./CYPRESS_FIXES.md) | Original test fixes and troubleshooting |
| [README_TESTING.md](./README_TESTING.md) | This file - quick start guide |

---

## 🚀 **CI/CD Integration**

### **GitHub Actions Example**

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  cypress:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run scaled tests
        run: |
          npm run dev &
          npx wait-on http://localhost:5173
          npx cypress run --spec "cypress/e2e/07-game-mechanics-scaled.cy.js"
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

---

## 🎯 **Best Practices**

### **✅ Do:**

1. **Use scaled tests for daily development**
2. **Run full tests before releases**
3. **Monitor database usage** with `getRoomStats`
4. **Clean up test data** regularly
5. **Keep service role key secure**

### **❌ Don't:**

1. **Don't commit `.env.local`** to git
2. **Don't run full tests on every commit** (too slow)
3. **Don't use production database** for testing
4. **Don't create excessive test rooms** (database bloat)
5. **Don't skip setup script** (validates environment)

---

## 🔗 **Quick Links**

- [Cypress Documentation](https://docs.cypress.io/)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Status](https://status.supabase.com/)
- [Project Repository](https://github.com/ayushtiwari18/wordtraitor)

---

## 📞 **Support**

If you need help:

1. 📚 Read [SCALED_TESTING.md](./SCALED_TESTING.md) for detailed guide
2. 🔧 Check [CYPRESS_FIXES.md](./CYPRESS_FIXES.md) for common fixes
3. 🔍 Review Cypress videos in `cypress/videos/`
4. 🐛 Check Supabase logs in dashboard

---

**Last Updated:** December 23, 2025  
**Version:** 1.0.0 (100-User Scale)  
**Status:** ✅ Production Ready
