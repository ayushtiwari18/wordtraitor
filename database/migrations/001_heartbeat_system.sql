-- =====================================================
-- HEARTBEAT SYSTEM MIGRATION (SAFE VERSION)
-- =====================================================
-- This migration adds last_seen tracking for zombie player cleanup
-- Safe to run multiple times (idempotent)

-- Step 1: Add last_seen column if it doesn't exist
ALTER TABLE room_participants 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT NOW();

-- Step 2: Set existing rows to NOW() if NULL
UPDATE room_participants 
SET last_seen = NOW() 
WHERE last_seen IS NULL;

-- Step 3: Drop existing trigger if it exists (to avoid conflict)
DROP TRIGGER IF EXISTS trigger_update_last_seen ON room_participants;

-- Step 4: Drop existing function if it exists
DROP FUNCTION IF EXISTS update_last_seen();

-- Step 5: Create the function
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create the trigger
CREATE TRIGGER trigger_update_last_seen
BEFORE UPDATE ON room_participants
FOR EACH ROW
EXECUTE FUNCTION update_last_seen();

-- Step 7: Add index for efficient queries (if doesn't exist)
CREATE INDEX IF NOT EXISTS idx_room_participants_last_seen 
ON room_participants(last_seen);

-- Step 8: Add composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_room_participants_room_last_seen 
ON room_participants(room_id, last_seen);

-- =====================================================
-- VERIFICATION QUERY (Run separately to check)
-- =====================================================
-- SELECT 
--   column_name, 
--   data_type, 
--   column_default,
--   is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'room_participants' 
-- AND column_name = 'last_seen';

-- =====================================================
-- TEST QUERY (Run separately to verify trigger works)
-- =====================================================
-- UPDATE room_participants 
-- SET username = username 
-- WHERE user_id = (SELECT user_id FROM room_participants LIMIT 1);
-- 
-- SELECT user_id, username, last_seen 
-- FROM room_participants 
-- ORDER BY last_seen DESC 
-- LIMIT 5;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- DROP TRIGGER IF EXISTS trigger_update_last_seen ON room_participants;
-- DROP FUNCTION IF EXISTS update_last_seen();
-- DROP INDEX IF EXISTS idx_room_participants_last_seen;
-- DROP INDEX IF EXISTS idx_room_participants_room_last_seen;
-- ALTER TABLE room_participants DROP COLUMN IF EXISTS last_seen;