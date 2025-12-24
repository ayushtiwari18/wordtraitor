-- =====================================================
-- HEARTBEAT TRACKING SYSTEM FOR ZOMBIE PLAYER CLEANUP
-- =====================================================
-- This migration adds heartbeat tracking to room_participants
-- to automatically detect and cleanup disconnected players.
--
-- HOW TO RUN:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste this entire file
-- 4. Click "Run"
--
-- WHAT THIS DOES:
-- - Adds `last_seen` column (auto-updates on heartbeat)
-- - Creates index for efficient queries
-- - Sets up automatic timestamp updates
-- =====================================================

-- Step 1: Add last_seen column to room_participants
ALTER TABLE room_participants
ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now();

-- Step 2: Create index for efficient heartbeat queries
CREATE INDEX IF NOT EXISTS idx_room_participants_last_seen 
ON room_participants(last_seen);

-- Step 3: Create index for room_id + last_seen queries (cleanup)
CREATE INDEX IF NOT EXISTS idx_room_participants_room_last_seen 
ON room_participants(room_id, last_seen);

-- Step 4: Enable moddatetime extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- Step 5: Create trigger to auto-update last_seen on row update
-- This ensures last_seen is updated whenever heartbeat writes occur
DROP TRIGGER IF EXISTS handle_last_seen_update ON room_participants;

CREATE TRIGGER handle_last_seen_update 
BEFORE UPDATE ON room_participants
FOR EACH ROW 
EXECUTE FUNCTION moddatetime(last_seen);

-- =====================================================
-- VERIFICATION QUERIES (Run these to confirm setup)
-- =====================================================

-- Check if column exists
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'room_participants' AND column_name = 'last_seen';

-- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'room_participants' AND indexname LIKE '%last_seen%';

-- Check trigger
-- SELECT trigger_name, event_manipulation, action_timing 
-- FROM information_schema.triggers 
-- WHERE event_object_table = 'room_participants' AND trigger_name = 'handle_last_seen_update';

-- =====================================================
-- OPTIONAL: Cleanup stale players (15+ seconds idle)
-- =====================================================
-- This query removes players who haven't sent heartbeat in 15+ seconds
-- You can run this manually or create a Supabase Edge Function to run it periodically
--
-- DELETE FROM room_participants
-- WHERE last_seen < now() - interval '15 seconds'
-- AND room_id IN (
--   SELECT id FROM game_rooms WHERE status = 'PLAYING'
-- );

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Your database now supports heartbeat tracking!
-- The React app will automatically:
-- 1. Send heartbeat every 5 seconds
-- 2. Update last_seen timestamp
-- 3. Detect disconnected players after 15 seconds
-- =====================================================