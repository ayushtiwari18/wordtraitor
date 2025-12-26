-- ============================================
-- Diagnostic Query: Check Existing Room Data
-- Purpose: See what phase values exist in your database
-- Run this BEFORE the migration to understand your data
-- ============================================

-- Query 1: Check all current phase values
SELECT 
  current_phase,
  COUNT(*) as room_count,
  status,
  MAX(created_at) as most_recent_room
FROM game_rooms
GROUP BY current_phase, status
ORDER BY room_count DESC;

-- Expected output will show you:
-- - What phase values currently exist
-- - How many rooms have each phase
-- - Room status (LOBBY, PLAYING, FINISHED)

-- Query 2: Check for NULL or invalid phases
SELECT 
  room_code,
  current_phase,
  status,
  created_at
FROM game_rooms
WHERE current_phase IS NULL 
   OR current_phase NOT IN ('LOBBY', 'WHISPER', 'HINT_DROP', 'DEBATE', 'VERDICT', 'REVEAL', 'DEBATE_VOTING', 'POST_ROUND')
ORDER BY created_at DESC;

-- Query 3: Check constraint status
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'game_rooms'::regclass
  AND conname LIKE '%phase%';

-- ============================================
-- What These Results Mean
-- ============================================
/*
Query 1 might show:
- current_phase = NULL           → Need to set to LOBBY
- current_phase = 'DEBATE'       → Need to change to DEBATE_VOTING
- current_phase = 'VERDICT'      → Need to change to DEBATE_VOTING
- current_phase = 'PLAYING'      → Invalid, need to fix
- current_phase = 'some_old_val' → Invalid, need to fix

Query 2 will show:
- Any rooms with problematic phase values
- These are the rows causing the constraint violation

Query 3 will show:
- Current constraint definition
- What phase values are currently allowed
*/

-- ============================================
-- Quick Fix (If You See Invalid Data)
-- ============================================
/*
If you see rooms with invalid phases, run this manually:

-- Option A: Delete all invalid rooms (SAFEST for testing)
DELETE FROM game_rooms 
WHERE current_phase IS NULL 
   OR current_phase NOT IN ('LOBBY', 'WHISPER', 'HINT_DROP', 'DEBATE', 'VERDICT', 'REVEAL');

-- Option B: Fix invalid rooms to LOBBY (SAFER for production)
UPDATE game_rooms 
SET current_phase = 'LOBBY', status = 'LOBBY'
WHERE current_phase IS NULL 
   OR current_phase NOT IN ('LOBBY', 'WHISPER', 'HINT_DROP', 'DEBATE', 'VERDICT', 'REVEAL');

Then run the FIXED migration.
*/

-- ============================================
-- After Migration Verification
-- ============================================
/*
After running 20251226_phase_flow_update_FIXED.sql, run this:

SELECT 
  current_phase,
  COUNT(*) as room_count
FROM game_rooms
GROUP BY current_phase
ORDER BY room_count DESC;

Expected phases:
- LOBBY
- WHISPER
- HINT_DROP
- DEBATE_VOTING  (not DEBATE or VERDICT anymore)
- REVEAL
- POST_ROUND

No other values should exist!
*/
