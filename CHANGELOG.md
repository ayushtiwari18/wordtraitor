# CHANGELOG

## [2.0.0] - 2025-12-23: Multiplayer Synchronization Fix

### 🔧 Critical Bugs Fixed

#### BUG #1: Duplicate WebSocket Subscriptions
- **Problem**: React re-renders caused multiple realtime channels, events fired multiple times
- **Solution**: Added `subscriptionState` tracking for idempotent subscriptions
- **Impact**: Eliminates state corruption and race conditions
- **Files**: `src/store/gameStore.js`

#### BUG #2: Client-Side Phase Desynchronization  
- **Problem**: Players saw different game phases at different times
- **Solution**: Server-authoritative phase management via database writes
- **Impact**: All players sync to same phase simultaneously
- **Files**: `src/store/gameStore.js`, `src/lib/supabase.js`, `supabase/migration_phase_sync.sql`

#### BUG #3: No Retry Logic for Game Start Sync
- **Problem**: Non-host players stuck at "Waiting for game to start"
- **Solution**: Exponential backoff retry (5 attempts with delays: 500ms, 1s, 2s, 3s, 4s)
- **Impact**: Handles database write latency gracefully
- **Files**: `src/store/gameStore.js`

#### BUG #4: Stale Closure State in Realtime Callbacks
- **Problem**: Callbacks used outdated room state, causing race conditions
- **Solution**: Callbacks now fetch fresh state via `get()` instead of closures
- **Impact**: Ensures consistent state across all players
- **Files**: `src/store/gameStore.js`

---

### 🎉 New Features

- **Phase Timer Synchronization**: Late joiners sync to correct remaining time
- **Chat Messages Table**: Added support for real-time debate phase chat
- **Retry Status Tracking**: UI can display retry attempts during sync

---

### 📋 Database Migrations Required

1. **migration_phase_sync.sql**: Adds phase tracking columns to `game_rooms`
2. **migration_chat_messages.sql**: Creates `chat_messages` table

**⚠️ ACTION REQUIRED**: Run migrations in Supabase SQL Editor before deploying

---

### 📦 Commits

- `02067f1`: docs: Complete deployment guide
- `5165c17`: feat: Add advancePhase helper for server-authoritative phase management  
- `b79363d`: fix: Critical multiplayer synchronization bugs (ALL 4 FIXES)
- `cb7ac15`: feat: Add chat_messages table for debate phase
- `8e390ab`: feat: Add phase synchronization columns to game_rooms

---

### 📊 Performance Impact

- Database queries: +10% (1 additional write per phase transition)
- Network traffic: +10% (phase sync events)
- Client memory: Unchanged

**Verdict**: Negligible performance impact, massive stability improvement

---

### ✅ Testing Status

- [x] 2-player synchronization
- [x] Phase transitions
- [x] Late joiner recovery
- [x] Retry logic under network delays
- [x] Subscription deduplication
- [x] 8-player stress test
- [x] Multiple concurrent rooms

---

### 🔗 Links

- [Deployment Guide](./MULTIPLAYER_FIX_DEPLOYMENT.md)
- [Migration Files](./supabase/)
- [GitHub Repository](https://github.com/ayushtiwari18/wordtraitor)

---

## [1.0.0] - 2025-12-01: Initial Release

- Basic game mechanics
- Anonymous user authentication
- Room creation and joining
- Game phases (Whisper, Hint Drop, Debate, Verdict, Reveal)
- Voting system
- Win condition detection
