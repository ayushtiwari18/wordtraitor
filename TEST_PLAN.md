# 🧪 WordTraitor - Comprehensive Test Plan

## Overview
This document outlines the systematic testing strategy for WordTraitor, organized by features and priorities.

---

## 🎯 Testing Strategy

### Approach
1. **Feature-by-Feature Testing**: One feature at a time
2. **Fix-Then-Progress**: Fix issues before moving to next feature
3. **Integration Testing**: Test feature interactions
4. **End-to-End Flows**: Complete game scenarios

### Test Execution Order
```
Phase 1: Core Features (P0)
  ├─ Home & Navigation
  ├─ Room Creation & Join
  └─ Guest Identity

Phase 2: Lobby & Settings (P0)
  ├─ Lobby Display
  ├─ Custom Settings
  └─ Real-time Sync

Phase 3: Game Flow - Silent Mode (P0)
  ├─ Whisper Phase
  ├─ Turn-Based Hints
  ├─ Debate with Chat
  ├─ Voting
  └─ Results

Phase 4: Game Flow - Real Mode (P1)
  ├─ Hint Drop (Next Button)
  ├─ Debate (No Chat)
  ├─ Voting
  └─ Results

Phase 5: Advanced Features (P1)
  ├─ Multi-Traitor Support
  ├─ Custom Timings
  └─ Edge Cases

Phase 6: Polish & UX (P2)
  ├─ Error Handling
  ├─ Loading States
  └─ Mobile Responsiveness
```

---

## 📋 Feature Test Matrix

### **PHASE 1: Core Features (P0 - Critical)**

#### 1.1 Home Page & Navigation
**File**: `cypress/e2e/01-home.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC001 | Home page loads correctly | ⏳ Pending |
| TC002 | "Create Room" button opens modal | ⏳ Pending |
| TC003 | "Join Room" button opens modal | ⏳ Pending |
| TC004 | Modal closes on cancel | ⏳ Pending |
| TC005 | How to Play section displays | ⏳ Pending |

**Known Gaps**:
- None identified yet

---

#### 1.2 Guest Identity System
**File**: `cypress/e2e/02-guest-identity.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC010 | Guest ID generated on first visit | ⏳ Pending |
| TC011 | Guest ID persists in localStorage | ⏳ Pending |
| TC012 | Same guest ID used across sessions | ⏳ Pending |
| TC013 | Username generated correctly | ⏳ Pending |
| TC014 | Multiple tabs use same identity | ⏳ Pending |

**Known Gaps**:
- ❌ Guest ID may regenerate unnecessarily
- ❌ No validation for guest ID format

---

#### 1.3 Room Creation
**File**: `cypress/e2e/03-room-creation.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC020 | Create room with default settings | ⏳ Pending |
| TC021 | Room code displayed in lobby | ⏳ Pending |
| TC022 | Creator is marked as host | ⏳ Pending |
| TC023 | Room appears in database | ⏳ Pending |
| TC024 | Advanced settings expand/collapse | ⏳ Pending |
| TC025 | Custom traitor count (2-3) | ⏳ Pending |
| TC026 | Custom phase timings saved | ⏳ Pending |
| TC027 | Invalid settings rejected | ⏳ Pending |

**Known Gaps**:
- ❌ No validation for timing ranges (min/max)
- ❌ Traitor count validation missing
- ⚠️ Error messages not user-friendly

---

#### 1.4 Room Join
**File**: `cypress/e2e/04-room-join.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC030 | Join room with valid code | ⏳ Pending |
| TC031 | Invalid code shows error | ⏳ Pending |
| TC032 | Joining sets host=false | ⏳ Pending |
| TC033 | Auto-join on room reload | ⏳ Pending |
| TC034 | Cannot join full room | ⏳ Pending |
| TC035 | Cannot join started game | ⏳ Pending |

**Known Gaps**:
- ❌ Room code case sensitivity issues
- ❌ No "room not found" vs "room full" distinction
- ⚠️ Auto-join may duplicate participants

---

### **PHASE 2: Lobby & Settings (P0 - Critical)**

#### 2.1 Lobby Display
**File**: `cypress/e2e/05-lobby.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC040 | Room code copyable | ⏳ Pending |
| TC041 | Participants list updates live | ⏳ Pending |
| TC042 | Host indicator shown | ⏳ Pending |
| TC043 | "You" badge on own participant | ⏳ Pending |
| TC044 | Player count accurate | ⏳ Pending |
| TC045 | Settings displayed correctly | ⏳ Pending |
| TC046 | Custom settings visible | ⏳ Pending |
| TC047 | Phase timings expandable | ⏳ Pending |

**Known Gaps**:
- ❌ Realtime connection status may be inaccurate
- ⚠️ Participant list may show duplicates
- ❌ Leave button doesn't clean up properly

---

#### 2.2 Game Start
**File**: `cypress/e2e/06-game-start.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC050 | Host can start with 2+ players | ⏳ Pending |
| TC051 | Non-host cannot start | ⏳ Pending |
| TC052 | Cannot start with <2 players | ⏳ Pending |
| TC053 | All players navigate to game | ⏳ Pending |
| TC054 | Roles assigned correctly | ⏳ Pending |
| TC055 | Words assigned per difficulty | ⏳ Pending |
| TC056 | Turn order initialized | ⏳ Pending |

**Known Gaps**:
- ❌ Race condition in role assignment
- ❌ Turn order may not match participant order
- ⚠️ Word pair selection not random enough

---

### **PHASE 3: Game Flow - Silent Mode (P0 - Critical)**

#### 3.1 Whisper Phase
**File**: `cypress/e2e/07-whisper-phase.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC060 | Secret word displayed | ⏳ Pending |
| TC061 | Role shown (Citizen/Traitor) | ⏳ Pending |
| TC062 | Timer counts down | ⏳ Pending |
| TC063 | Auto-advance to Hint Drop | ⏳ Pending |
| TC064 | Custom timing respected | ⏳ Pending |

**Known Gaps**:
- ⚠️ Timer may drift across clients
- ❌ No indication when phase will end

---

#### 3.2 Turn-Based Hints (Silent Mode)
**File**: `cypress/e2e/08-turn-based-hints.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC070 | First player's turn active | ⏳ Pending |
| TC071 | Turn indicator shows current player | ⏳ Pending |
| TC072 | Only current player can submit | ⏳ Pending |
| TC073 | Turn advances after submission | ⏳ Pending |
| TC074 | All players submit in order | ⏳ Pending |
| TC075 | Submitted players marked done | ⏳ Pending |
| TC076 | Phase advances when all done | ⏳ Pending |
| TC077 | Eliminated players skipped | ⏳ Pending |

**Known Gaps**:
- ❌ **CRITICAL**: Turn doesn't advance for non-submitter
- ❌ Turn indicator not synced across clients
- ❌ Waiting players see no indication of current turn
- ⚠️ Turn order resets incorrectly after elimination

---

#### 3.3 Debate Phase (Silent Mode)
**File**: `cypress/e2e/09-debate-chat.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC080 | Hints displayed correctly | ⏳ Pending |
| TC081 | Chat box visible | ⏳ Pending |
| TC082 | Messages send successfully | ⏳ Pending |
| TC083 | Messages appear for all players | ⏳ Pending |
| TC084 | Username shown per message | ⏳ Pending |
| TC085 | Auto-scroll to latest message | ⏳ Pending |
| TC086 | Character limit enforced (200) | ⏳ Pending |
| TC087 | Timestamp displayed | ⏳ Pending |

**Known Gaps**:
- ❌ **CRITICAL**: Chat messages may not sync realtime
- ❌ Old messages from previous rounds shown
- ⚠️ Chat scroll position jumps unexpectedly
- ❌ No indication when someone is typing

---

#### 3.4 Voting Phase
**File**: `cypress/e2e/10-voting.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC090 | Alive players shown as options | ⏳ Pending |
| TC091 | Dead players not voteable | ⏳ Pending |
| TC092 | Vote submission works | ⏳ Pending |
| TC093 | Cannot vote twice | ⏳ Pending |
| TC094 | Vote count updates | ⏳ Pending |
| TC095 | Phase advances when all voted | ⏳ Pending |

**Known Gaps**:
- ❌ Vote changes not prevented
- ⚠️ Vote visibility before reveal

---

#### 3.5 Results & Win Conditions
**File**: `cypress/e2e/11-results.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC100 | Eliminated player shown | ⏳ Pending |
| TC101 | Vote counts displayed | ⏳ Pending |
| TC102 | Player marked dead | ⏳ Pending |
| TC103 | Citizens win if traitor eliminated | ⏳ Pending |
| TC104 | Traitor wins if 2 players left | ⏳ Pending |
| TC105 | Multi-traitor win conditions | ⏳ Pending |
| TC106 | Game continues to next round | ⏳ Pending |

**Known Gaps**:
- ❌ **CRITICAL**: Win condition check timing
- ❌ Traitor reveal may show wrong players
- ⚠️ Next round doesn't reset state properly

---

### **PHASE 4: Game Flow - Real Mode (P1 - Important)**

#### 4.1 Real Mode Hint Drop
**File**: `cypress/e2e/12-real-mode-hints.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC110 | "Next Player" button shown | ⏳ Pending |
| TC111 | No text input visible | ⏳ Pending |
| TC112 | Button advances turn | ⏳ Pending |
| TC113 | Hint marked as [VERBAL] | ⏳ Pending |
| TC114 | Turn-based system works | ⏳ Pending |

**Known Gaps**:
- ⚠️ [VERBAL] hints shown in debate phase
- ❌ No visual indicator for verbal hints

---

#### 4.2 Real Mode Debate
**File**: `cypress/e2e/13-real-mode-debate.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC120 | Chat NOT visible | ⏳ Pending |
| TC121 | Only hints displayed | ⏳ Pending |
| TC122 | Full-width hint layout | ⏳ Pending |

**Known Gaps**:
- None identified yet

---

### **PHASE 5: Advanced Features (P1 - Important)**

#### 5.1 Multi-Traitor Games
**File**: `cypress/e2e/14-multi-traitor.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC130 | 2 traitors assigned correctly | ⏳ Pending |
| TC131 | 3 traitors assigned correctly | ⏳ Pending |
| TC132 | All traitors get traitor word | ⏳ Pending |
| TC133 | Win condition: all traitors dead | ⏳ Pending |
| TC134 | Win condition: traitors ≥ citizens | ⏳ Pending |
| TC135 | Results show all traitors | ⏳ Pending |

**Known Gaps**:
- ❌ **CRITICAL**: Traitor assignment may fail with small player count
- ⚠️ Win condition calculation edge cases

---

#### 5.2 Custom Phase Timings
**File**: `cypress/e2e/15-custom-timings.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC140 | Custom timings saved correctly | ⏳ Pending |
| TC141 | Each phase uses custom duration | ⏳ Pending |
| TC142 | Default used if not customized | ⏳ Pending |
| TC143 | Timer accurate to custom values | ⏳ Pending |

**Known Gaps**:
- ❌ getPhaseDuration has typo ("getPhaseD uration")
- ⚠️ Timing validation missing

---

### **PHASE 6: Polish & Edge Cases (P2 - Nice to Have)**

#### 6.1 Error Handling
**File**: `cypress/e2e/16-error-handling.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC150 | Network error handling | ⏳ Pending |
| TC151 | Supabase error messages | ⏳ Pending |
| TC152 | Invalid state recovery | ⏳ Pending |
| TC153 | Disconnection handling | ⏳ Pending |

---

#### 6.2 Mobile Responsiveness
**File**: `cypress/e2e/17-responsive.cy.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC160 | Mobile viewport (375px) | ⏳ Pending |
| TC161 | Tablet viewport (768px) | ⏳ Pending |
| TC162 | Chat usable on mobile | ⏳ Pending |
| TC163 | Buttons accessible on mobile | ⏳ Pending |

---

## 🔧 Known Critical Gaps to Fix

### Priority 0 (Blockers)
1. **Turn System Sync**: Turn doesn't advance for other players
2. **Chat Realtime**: Messages not appearing instantly
3. **Win Conditions**: Timing and calculation issues
4. **Traitor Assignment**: May fail with edge cases

### Priority 1 (Major)
5. **Auto-Join Duplicates**: Participant list shows duplicates
6. **Turn Order Reset**: Doesn't handle eliminations correctly
7. **Phase Timer Sync**: Drift across clients
8. **Typo in gameStore**: `getPhaseDuration` has space

### Priority 2 (Minor)
9. **Room Code Case**: Inconsistent handling
10. **Error Messages**: Not user-friendly
11. **Loading States**: Missing in some flows
12. **Chat Scroll**: Jumps unexpectedly

---

## 🚀 Execution Plan

### Step 1: Setup (✅ Complete)
- [x] Cypress installed
- [x] Configuration created
- [x] Custom commands added
- [x] Test plan documented

### Step 2: Phase 1 Tests (Next)
1. Create `01-home.cy.js`
2. Run tests
3. Fix any failures
4. Move to next file

### Step 3: Fix Critical Gaps
- As tests reveal issues, fix immediately
- Update test plan with actual results
- Document fixes in commit messages

### Step 4: Integration Testing
- Complete game flows
- Multi-player scenarios
- Edge case validation

---

## 📊 Success Criteria

- [ ] All P0 tests pass
- [ ] All P1 tests pass
- [ ] Critical gaps fixed
- [ ] Major gaps fixed
- [ ] Documentation complete
- [ ] CI/CD integration (optional)

---

## 📝 Notes

- Tests should be **idempotent** (can run multiple times)
- Each test should **clean up** after itself
- Use **real Supabase** (not mocked) for integration testing
- **Parallel execution** not recommended (realtime conflicts)

---

**Last Updated**: December 22, 2025  
**Status**: Phase 1 Ready to Execute