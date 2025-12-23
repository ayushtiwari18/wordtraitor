# 🔧 TURN SYSTEM & GAME RESTART FIX PLAN

**Date**: December 23, 2025  
**Status**: Planning Phase  
**Priority**: CRITICAL - Blocks MVP Launch

---

## 🎯 BUGS TO FIX

### **BUG #1: Turn System Not Working** 🔴 CRITICAL

**Symptoms**:
- Player 2 cannot submit hints during HINT_DROP phase
- Only Host can submit hints
- Player 2 sees "Waiting for your turn" but turn never arrives

**Root Cause**:
```javascript
// Current broken implementation:
isMyTurnToHint: () => {
  const { turnOrder, currentTurnIndex, myUserId, gamePhase } = get()
  if (gamePhase !== 'HINT_DROP') return false
  if (!turnOrder || turnOrder.length === 0) return false  // ❌ Always false!
  
  const currentUserId = turnOrder[currentTurnIndex]
  return currentUserId === myUserId
}
```

**Problem**: `turnOrder` is initialized in `startGame()` but NOT synced to non-host players via realtime.

**Evidence from logs**:
```
Host: gameStore.js:325 🎲 Starting game with 2 players
Host: (turnOrder initialized locally)

Player 2: gameStore.js:829 📝 Synced - My role: CITIZEN | Word: Whale
Player 2: (turnOrder is empty array! Never initialized)
```

---

### **FIX #1: Sequential Turn System with Timer**

#### **Changes Required**:

**1. Store turn data in database** (New table)
```sql
CREATE TABLE game_turns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID REFERENCES game_rooms(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  current_turn_index INTEGER DEFAULT 0,
  turn_started_at TIMESTAMPTZ,
  turn_order TEXT[] NOT NULL,  -- Array of user_ids
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**2. Initialize turn order when game starts**
```javascript
// In gameHelpers.startGame()
export const startGame = async (roomId) => {
  // ... existing code ...
  
  // Get participants
  const participants = await getParticipants(roomId);
  const turnOrder = participants.map(p => p.user_id);
  
  // Write turn order to DB
  await supabase
    .from('game_turns')
    .insert({
      room_id: roomId,
      round_number: 1,
      turn_order: turnOrder,
      current_turn_index: 0,
      turn_started_at: new Date().toISOString()
    });
};
```

**3. Add turn timer (15 seconds per player)**
```javascript
// In gameStore.js
startTurnTimer: () => {
  const { turnTimer } = get();
  if (turnTimer) clearInterval(turnTimer);
  
  let timeLeft = 15; // 15 seconds per turn
  set({ turnTimeLeft: timeLeft });
  
  const timer = setInterval(() => {
    timeLeft -= 1;
    set({ turnTimeLeft: timeLeft });
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      console.log('⏰ Turn time expired, advancing...');
      get().advanceTurn();
    }
  }, 1000);
  
  set({ turnTimer: timer });
},
```

**4. Advance turn when hint submitted OR timer expires**
```javascript
submitHint: async (hintText) => {
  const { roomId, myUserId, isHost } = get();
  
  await gameHelpers.submitHint(roomId, myUserId, hintText);
  await get().loadHints();
  
  // Host advances turn
  if (isHost) {
    await gameHelpers.advanceTurn(roomId);
  }
},

advanceTurn: async () => {
  const { roomId, currentTurnIndex, turnOrder } = get();
  const nextIndex = (currentTurnIndex + 1) % turnOrder.length;
  
  // Check if all players have submitted
  const { hints } = get();
  if (hints.length >= turnOrder.length) {
    console.log('✅ All hints submitted, ending HINT_DROP phase');
    await get().advancePhase();
    return;
  }
  
  // Write next turn to DB
  await gameHelpers.updateTurn(roomId, nextIndex);
},
```

**5. Sync turn changes via realtime**
```javascript
// In realtimeHelpers.subscribeToRoom()
channel
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'game_turns',
      filter: `room_id=eq.${roomId}`
    },
    (payload) => {
      const { current_turn_index, turn_started_at } = payload.new;
      set({ 
        currentTurnIndex: current_turn_index,
      });
      
      // Restart turn timer
      get().startTurnTimer();
      
      console.log(`🔄 Turn advanced to player ${current_turn_index}`);
    }
  )
```

---

### **BUG #2: Votes Shown Immediately (Not Anonymous)** 🟡 MAJOR

**Symptoms**:
- During VERDICT phase, players can see vote counts in console
- Votes should be hidden until REVEAL phase

**Root Cause**:
```javascript
// In realtime subscription:
onVoteSubmitted: async (payload) => {
  console.log('🗳️ New vote submitted');
  await get().loadVotes();  // ❌ Loads votes immediately!
}
```

---

### **FIX #2: Hide Votes Until REVEAL**

```javascript
// Only load votes during REVEAL phase
onVoteSubmitted: async (payload) => {
  console.log('🗳️ New vote submitted');
  const { gamePhase } = get();
  
  if (gamePhase === 'REVEAL') {
    await get().loadVotes();  // ✅ Only load during reveal
  } else {
    console.log('🔒 Votes hidden until REVEAL phase');
  }
}
```

**Also fix in phase transition**:
```javascript
// In subscribeToRoom() onRoomUpdate:
if (updatedRoom.current_phase === 'REVEAL') {
  get().loadVotes();  // Load votes when entering REVEAL
}
```

---

### **BUG #3: Game Doesn't Restart After Round** 🟡 MAJOR

**Symptoms**:
- After REVEAL phase ends, host auto-leaves room
- Players stuck with no "Play Again" option
- No way to start Round 2 with same players

**Current broken code**:
```javascript
// In Game.jsx:
useEffect(() => {
  if (showResults) {
    console.log('🏆 Game ended, navigating to results');
    navigate('/results');  // ❌ Leaves room!
  }
}, [showResults]);
```

---

### **FIX #3: Add Results Screen with Play Again**

**1. Create Results.jsx component**
```javascript
// src/app/pages/Results.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import useGameStore from '../../store/gameStore';

const Results = () => {
  const navigate = useNavigate();
  const { gameResults, isHost, roomId, startNextRound, leaveRoom } = useGameStore();
  
  const handlePlayAgain = async () => {
    await startNextRound();
    navigate(`/game/${roomId}`);
  };
  
  const handleLeave = async () => {
    await leaveRoom();
    navigate('/');
  };
  
  return (
    <div className="results-screen">
      <h1>🏆 Round Complete!</h1>
      
      <div className="winner">
        {gameResults?.winner === 'CITIZENS' ? '✅ Citizens Win!' : '💀 Traitors Win!'}
      </div>
      
      <div className="eliminated">
        Eliminated: {gameResults?.eliminatedPlayer?.username}
      </div>
      
      <div className="vote-breakdown">
        <h3>Vote Results:</h3>
        {/* Show vote counts */}
      </div>
      
      {isHost ? (
        <button onClick={handlePlayAgain}>🔄 Start Round 2</button>
      ) : (
        <p>⏳ Waiting for host to start next round...</p>
      )}
      
      <button onClick={handleLeave}>🚪 Leave Game</button>
    </div>
  );
};

export default Results;
```

**2. Add startNextRound() to gameStore**
```javascript
startNextRound: async () => {
  const { roomId, participants } = get();
  console.log('🔄 Starting next round...');
  
  try {
    // Increment round number
    const { room } = get();
    const nextRound = room.current_round + 1;
    
    await supabase
      .from('game_rooms')
      .update({ 
        current_round: nextRound,
        current_phase: 'WHISPER',
        phase_started_at: new Date().toISOString()
      })
      .eq('id', roomId);
    
    // Reset game state
    set({
      gamePhase: 'WHISPER',
      hints: [],
      votes: [],
      chatMessages: [],
      currentTurnIndex: 0,
      showResults: false,
      gameResults: null
    });
    
    // Assign new roles
    await gameHelpers.assignRoles(roomId, participants, room.difficulty, room.word_pack, room.traitor_count);
    
    // Start new phase timer
    get().startPhaseTimer('WHISPER');
    
    console.log('✅ Round', nextRound, 'started!');
  } catch (error) {
    console.error('❌ Error starting next round:', error);
    throw error;
  }
},
```

**3. Update Game.jsx navigation**
```javascript
// Remove auto-navigation to /results
// Keep players in /game route, show Results overlay instead

{showResults && (
  <Results 
    onPlayAgain={() => startNextRound()} 
    onLeave={() => {
      leaveRoom();
      navigate('/');
    }}
  />
)}
```

---

### **BUG #4: RevealPhase Crashes** 🔴 CRITICAL

**Symptoms**:
```
RevealPhase.jsx:21 Error calculating results: 
TypeError: Cannot read properties of null (reading 'current_round')
```

**Root Cause**:
```javascript
// In RevealPhase.jsx:
const calculateResults = async () => {
  const results = await gameHelpers.calculateVoteResults(roomId);
  // ... but roomId is null because player left!
};
```

---

### **FIX #4: Prevent Early Room Exit**

**1. Don't auto-leave after game ends**
```javascript
// Remove this from Game.jsx:
useEffect(() => {
  return () => {
    console.log('👋 Game unmounting (no auto leave)');
    // ❌ DON'T call leaveRoom() here
  };
}, []);
```

**2. Add null checks in RevealPhase**
```javascript
const calculateResults = async () => {
  const { roomId, room } = useGameStore();
  
  if (!roomId || !room) {
    console.error('❌ Room not loaded, cannot calculate results');
    return;
  }
  
  try {
    const results = await gameHelpers.calculateVoteResults(roomId);
    setResults(results);
  } catch (error) {
    console.error('Error calculating results:', error);
  }
};
```

---

## 📊 IMPLEMENTATION ORDER

### **Phase 1: Critical Fixes** (30 minutes)
1. ✅ Fix turn system (Bug #1) - **BLOCKING**
2. ✅ Fix RevealPhase crash (Bug #4) - **BLOCKING**

### **Phase 2: UX Improvements** (20 minutes)
3. ✅ Add Results screen with Play Again (Bug #3)
4. ✅ Hide votes until REVEAL (Bug #2)

### **Phase 3: Database Changes** (10 minutes)
5. ✅ Create `game_turns` table
6. ✅ Add realtime subscription for turn changes

---

## 🧪 TESTING CHECKLIST

After implementing fixes, test:

- [ ] **Turn System**
  - [ ] Player 1 gets first turn (15s timer)
  - [ ] After hint or timeout, Player 2 gets turn
  - [ ] Turn indicator shows whose turn it is
  - [ ] All players can submit hints

- [ ] **Vote Privacy**
  - [ ] During VERDICT, votes are hidden
  - [ ] During REVEAL, votes are shown
  - [ ] Console logs don't leak vote data

- [ ] **Game Restart**
  - [ ] After round ends, Results screen shows
  - [ ] Host sees "Start Round 2" button
  - [ ] Non-host sees "Waiting for host"
  - [ ] Both players stay in room
  - [ ] Round 2 starts with new roles/words

- [ ] **Crash Prevention**
  - [ ] RevealPhase doesn't crash
  - [ ] Room state persists through game end
  - [ ] Manual leave button works

---

## 🎯 SUCCESS CRITERIA

**MVP is ready when**:
✅ 2 players can complete full game (Whisper → Reveal)  
✅ Both players can submit hints during their turn  
✅ Votes are anonymous until reveal  
✅ Game can restart for Round 2  
✅ No crashes during gameplay  

---

## 📝 FILES TO MODIFY

1. **src/store/gameStore.js** (Turn system, restart logic)
2. **src/lib/supabase.js** (Turn management, DB writes)
3. **src/app/pages/Results.jsx** (NEW - Results screen)
4. **src/app/pages/Game.jsx** (Remove auto-leave, add Results overlay)
5. **src/components/game/RevealPhase.jsx** (Add null checks)
6. **src/components/game/HintPhase.jsx** (Add turn indicator UI)
7. **Database Migration** (Create game_turns table)

---

**Ready to implement? Reply "Push the fixes" to proceed!**