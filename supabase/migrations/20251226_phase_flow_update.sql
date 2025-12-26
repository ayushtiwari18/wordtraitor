-- ============================================
-- Migration: Phase Flow Update (Execution Plan)
-- Date: 2025-12-26
-- Purpose: Update phase names and flow to match execution plan
-- ============================================

-- Step 1: Update current_phase column to use new phase names
ALTER TABLE game_rooms 
DROP CONSTRAINT IF EXISTS game_rooms_current_phase_check;

-- Add new constraint with updated phase names
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

-- Step 2: Update any existing rooms with old phase names
-- (Only if you have active rooms - safe to run even if none exist)
UPDATE game_rooms 
SET current_phase = 'DEBATE_VOTING' 
WHERE current_phase IN ('DEBATE', 'VERDICT');

-- Step 3: Add index for efficient phase queries
CREATE INDEX IF NOT EXISTS idx_game_rooms_current_phase 
ON game_rooms(current_phase);

-- Step 4: Add index for round queries (optimize multi-round games)
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
SELECT 'Phase flow migration complete! Updated: DEBATE_VOTING, POST_ROUND' AS status;
