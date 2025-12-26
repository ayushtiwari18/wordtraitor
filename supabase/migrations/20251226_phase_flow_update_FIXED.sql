-- ============================================
-- Migration: Phase Flow Update (FIXED VERSION)
-- Date: 2025-12-26
-- Purpose: Update phase names safely with existing data
-- ============================================

-- Step 1: First, update existing data BEFORE adding constraint
-- This fixes any rooms with old or invalid phase values

-- Update old phase names to new names
UPDATE game_rooms 
SET current_phase = 'DEBATE_VOTING' 
WHERE current_phase IN ('DEBATE', 'VERDICT');

-- Update any NULL phases to LOBBY
UPDATE game_rooms 
SET current_phase = 'LOBBY' 
WHERE current_phase IS NULL;

-- Update any invalid phase values to LOBBY (safe default)
UPDATE game_rooms 
SET current_phase = 'LOBBY' 
WHERE current_phase NOT IN ('LOBBY', 'WHISPER', 'HINT_DROP', 'DEBATE_VOTING', 'REVEAL', 'POST_ROUND');

-- Step 2: NOW drop the old constraint (if it exists)
ALTER TABLE game_rooms 
DROP CONSTRAINT IF EXISTS game_rooms_current_phase_check;

-- Step 3: Add new constraint with updated phase names
ALTER TABLE game_rooms
ADD CONSTRAINT game_rooms_current_phase_check 
CHECK (current_phase IN (
  'LOBBY',
  'WHISPER',
  'HINT_DROP',
  'DEBATE_VOTING',  -- ✅ CHANGED: Combined debate + voting
  'REVEAL',
  'POST_ROUND'      -- ✅ NEW: Game completion phase
));

-- Step 4: Add indexes for efficient phase queries
CREATE INDEX IF NOT EXISTS idx_game_rooms_current_phase 
ON game_rooms(current_phase);

CREATE INDEX IF NOT EXISTS idx_game_hints_round 
ON game_hints(room_id, round_number);

CREATE INDEX IF NOT EXISTS idx_game_votes_round 
ON game_votes(room_id, round_number);

CREATE INDEX IF NOT EXISTS idx_round_secrets_round 
ON round_secrets(room_id, round_number);

-- Step 5: Add helpful comment for developers
COMMENT ON COLUMN game_rooms.current_phase IS 
'Game phase: LOBBY → WHISPER (10s) → HINT_DROP (30s) → DEBATE_VOTING (no timer) → REVEAL → POST_ROUND';

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify migration worked:
SELECT 
  current_phase, 
  COUNT(*) as room_count 
FROM game_rooms 
GROUP BY current_phase;

-- Expected: All phases should be valid (LOBBY, WHISPER, HINT_DROP, DEBATE_VOTING, REVEAL, POST_ROUND)

-- ============================================
-- Phase Flow Documentation
-- ============================================
/*
CORRECT PHASE FLOW (Per Execution Plan):

1. LOBBY
   - Players join, host clicks "Start Game"
   
2. WHISPER (10s timer)
   - Words assigned ONCE per game
   - Players see their secret word
   
3. HINT_DROP (30s timer)
   - All players submit hints
   - Auto-advance when all submitted OR timer ends
   
4. DEBATE_VOTING (NO TIMER - unlimited)
   - Chat enabled (SILENT mode)
   - Players discuss hints
   - Players vote for suspected traitor
   - Advance when: ALL voted OR host force-ends
   
5. REVEAL (5s timer)
   - Show eliminated player's word
   - Check win conditions
   
6. Next Round Logic:
   - If traitor found → POST_ROUND (game over)
   - If traitor survives:
     * Eliminated player becomes spectator
     * Skip WHISPER → go to HINT_DROP (SAME WORDS)
     * Continue until traitor caught or 2 players left
   
7. POST_ROUND
   - Game complete
   - Show results
   - Cleanup round data
   - Return to lobby choice
*/

-- Migration complete! ✅
SELECT '✅ Phase flow migration complete! All existing rooms updated.' AS status;
