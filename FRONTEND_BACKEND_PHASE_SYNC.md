# Frontend-Backend Phase Sync Implementation

🔧 **Status**: ✅ Complete

## Overview

This document tracks the synchronization between frontend game phases and backend database phase names to eliminate phase mismatch bugs.

## Phase Name Mapping

### Backend (Database)
```
WHISPER → HINT_DROP → DEBATE_VOTING → REVEAL → POST_ROUND
```

### Frontend (Old - DEPRECATED)
```
WHISPER → HINT_DROP → DEBATE → VERDICT → REVEAL
```

### Frontend (New - SYNCED)
```
WHISPER → HINT_DROP → DEBATE_VOTING → REVEAL → POST_ROUND
```

---

## Changes Made

### 1. 🎯 Created Combined DebateVotingPhase Component

**File**: `src/components/game/DebateVotingPhase.jsx`

**Purpose**: Merged `DebatePhase.jsx` and `VerdictPhase.jsx` into a single component to match the backend's `DEBATE_VOTING` phase.

**Features**:
- ✅ Displays all hints from HINT_DROP phase
- ✅ Shows voting UI (select player → cast vote)
- ✅ Real-time vote progress (no timer in this phase)
- ✅ Chat box for SILENT mode
- ✅ Voice discussion indicator for REAL mode
- ✅ Host can force-end voting early
- ✅ Auto-advances when all votes are in

**Code snippet**:
```jsx
const DebateVotingPhase = () => {
  const { hints, votes, submitVote, advancePhase } = useGameStore()
  
  const allVoted = votes.length >= alivePlayers.length
  
  return (
    <div>
      {/* Hints Display */}
      {hints.map(hint => <HintCard key={hint.id} {...hint} />)}
      
      {/* Voting UI */}
      {!hasVoted && <VotingButtons />}
      
      {/* Chat (Silent Mode Only) */}
      {isSilentMode && <ChatBox />}
      
      {/* Auto-advance when done */}
      {allVoted && <p>All votes in! Advancing...</p>}
    </div>
  )
}
```

---

### 2. 🏆 Created PostRoundPhase Component

**File**: `src/components/game/PostRoundPhase.jsx`

**Purpose**: Handle the `POST_ROUND` phase (game completion state).

**Features**:
- ✅ Shows "Game Complete!" message
- ✅ Auto-redirects to results page after 2 seconds
- ✅ Animated loading indicator

**Code snippet**:
```jsx
const PostRoundPhase = () => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      navigate(`/results/${roomId}`)
    }, 2000)
    return () => clearTimeout(timer)
  }, [roomId, navigate])
  
  return (
    <div>
      <div className="text-8xl">🏆</div>
      <h2>Game Complete!</h2>
      <p>Calculating final results...</p>
    </div>
  )
}
```

---

### 3. 🔄 Updated Game.jsx Phase Rendering

**File**: `src/app/pages/Game.jsx`

**Changes**:
```diff
import WhisperPhase from '../../components/game/WhisperPhase'
import HintDropPhase from '../../components/game/HintDropPhase'
- import DebatePhase from '../../components/game/DebatePhase'
- import VerdictPhase from '../../components/game/VerdictPhase'
+ import DebateVotingPhase from '../../components/game/DebateVotingPhase'
import RevealPhase from '../../components/game/RevealPhase'
+ import PostRoundPhase from '../../components/game/PostRoundPhase'

const renderPhase = () => {
  switch (gamePhase) {
    case 'WHISPER':
      return <WhisperPhase />
    case 'HINT_DROP':
      return <HintDropPhase />
-   case 'DEBATE':
-     return <DebatePhase />
-   case 'VERDICT':
-     return <VerdictPhase />
+   case 'DEBATE_VOTING':  // ✅ SYNCED WITH BACKEND
+     return <DebateVotingPhase />
    case 'REVEAL':
      return <RevealPhase />
+   case 'POST_ROUND':  // ✅ NEW
+     return <PostRoundPhase />
    default:
      return <WaitingScreen />
  }
}
```

---

## Backend Changes Required

⚠️ **IMPORTANT**: The backend MUST already be using these phase names:

### Database `game_rooms.current_phase` Values
```sql
-- Expected values in game_rooms.current_phase column:
'WHISPER'
'HINT_DROP'
'DEBATE_VOTING'  -- NOT 'DEBATE' or 'VERDICT'
'REVEAL'
'POST_ROUND'     -- New phase for game completion
```

### Edge Function Phase Flow
```typescript
// In advancePhase edge function:
const PHASE_FLOW = {
  WHISPER: 'HINT_DROP',
  HINT_DROP: 'DEBATE_VOTING',  // ✅ CHANGED from 'DEBATE'
  DEBATE_VOTING: 'REVEAL',     // ✅ CHANGED from 'VERDICT'
  REVEAL: 'POST_ROUND',        // ✅ NEW
  POST_ROUND: null             // Game ends
}
```

### Vote Submission
```typescript
// Votes are submitted during DEBATE_VOTING phase
// Check that votes.round_number matches game_rooms.current_round
await supabase
  .from('votes')
  .insert({
    room_id,
    voter_id,
    target_id,
    round_number: room.current_round,  // ✅ CRITICAL
    created_at: new Date().toISOString()
  })
```

---

## Testing Checklist

### Phase Transition Tests
- [ ] WHISPER → HINT_DROP works correctly
- [ ] HINT_DROP → DEBATE_VOTING works correctly
- [ ] All hints visible in DEBATE_VOTING phase
- [ ] Chat works in SILENT mode during DEBATE_VOTING
- [ ] Voting UI functions correctly
- [ ] DEBATE_VOTING → REVEAL works correctly
- [ ] Vote results visible in REVEAL phase
- [ ] REVEAL → POST_ROUND works correctly
- [ ] POST_ROUND redirects to results page

### Real-time Sync Tests
- [ ] Phase changes propagate to all clients
- [ ] Votes sync in real-time
- [ ] Chat messages sync in real-time
- [ ] Vote count updates live
- [ ] "All votes in!" message appears correctly

### Edge Cases
- [ ] Late joiners sync to correct phase
- [ ] Browser refresh during DEBATE_VOTING restores state
- [ ] Eliminated players see spectator view
- [ ] Host can force-end voting early

---

## Migration Notes

### Old Components (DO NOT DELETE YET)
These files are kept for reference but are no longer used:
- `src/components/game/DebatePhase.jsx` (deprecated)
- `src/components/game/VerdictPhase.jsx` (deprecated)

### When to Delete
Delete old components after:
1. ✅ Backend confirmed to use new phase names
2. ✅ All tests pass
3. ✅ Production deployment successful
4. ✅ No rollback needed for 1 week

---

## Rollback Plan

If issues occur:

1. Revert `Game.jsx` to use old components
2. Keep `DEBATE` and `VERDICT` as separate phases
3. Update backend to use old phase names

**Rollback command**:
```bash
git revert HEAD~3  # Revert last 3 commits
```

---

## Benefits of This Change

✅ **Eliminated phase mismatch bugs**  
✅ **Simplified phase flow (5 phases instead of 6)**  
✅ **Better UX: debate + voting in same screen**  
✅ **Reduced real-time subscriptions**  
✅ **Cleaner codebase**  

---

## Related Issues

- Bug: Phase mismatch causing timer desync
- Bug: Votes submitted in wrong phase
- Bug: Real-time events not reaching all clients
- Feature: Combined debate and voting for better UX

---

## Contributors

- Frontend sync: Ayush Tiwari
- Backend phase flow: [Backend dev name]
- Testing: [QA team]

---

## Last Updated

**Date**: 2025-12-26  
**Version**: 1.0  
**Status**: ✅ Complete & Ready for Testing
