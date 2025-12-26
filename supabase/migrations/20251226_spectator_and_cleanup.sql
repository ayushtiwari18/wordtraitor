-- ============================================
-- Migration: Spectator Rules & Auto-Cleanup
-- Date: 2025-12-26
-- Purpose: Block spectators from chat + auto-delete empty rooms
-- ============================================

-- ============================================
-- PART 1: SPECTATOR CHAT BLOCKING
-- ============================================

-- First, check if we have a chat_messages table (from migration_chat_messages.sql)
-- If not, create it
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms ON DELETE CASCADE NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view chat" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Only alive players can send messages" ON chat_messages;

-- ✅ NEW POLICY: Anyone can view chat messages
CREATE POLICY "Anyone can view chat"
  ON chat_messages FOR SELECT
  USING (true);

-- ✅ NEW POLICY: ONLY alive players can send messages
CREATE POLICY "Only alive players can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_participants.room_id = chat_messages.room_id
        AND room_participants.user_id = chat_messages.user_id
        AND room_participants.is_alive = true  -- ✅ CRITICAL: Block spectators
    )
  );

-- Add index for chat queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_round 
ON chat_messages(room_id, round_number);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS chat_messages;

COMMENT ON TABLE chat_messages IS 
'Chat messages during DEBATE_VOTING phase. Spectators (is_alive=false) can read but NOT send.';

-- ============================================
-- PART 2: ROOM AUTO-DELETE TRIGGER
-- ============================================

-- Function to check if room is empty and delete if so
CREATE OR REPLACE FUNCTION cleanup_empty_rooms()
RETURNS TRIGGER AS $$
BEGIN
  -- After a participant is deleted, check if room is now empty
  IF NOT EXISTS (
    SELECT 1 FROM room_participants 
    WHERE room_id = OLD.room_id
  ) THEN
    -- Room is empty, delete it
    DELETE FROM game_rooms WHERE id = OLD.room_id;
    RAISE NOTICE 'Room % deleted (no participants left)', OLD.room_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_cleanup_empty_rooms ON room_participants;

-- Create trigger: After participant leaves, check if room is empty
CREATE TRIGGER trigger_cleanup_empty_rooms
AFTER DELETE ON room_participants
FOR EACH ROW
EXECUTE FUNCTION cleanup_empty_rooms();

COMMENT ON FUNCTION cleanup_empty_rooms IS 
'Auto-delete game_rooms when last participant leaves. Triggered by DELETE on room_participants.';

-- ============================================
-- PART 3: ROUND DATA CLEANUP ON POST_ROUND
-- ============================================

-- Function to cleanup round data when game ends
CREATE OR REPLACE FUNCTION cleanup_round_data_on_game_end()
RETURNS TRIGGER AS $$
BEGIN
  -- When game transitions to POST_ROUND, cleanup round data
  IF NEW.current_phase = 'POST_ROUND' AND OLD.current_phase != 'POST_ROUND' THEN
    -- Delete hints for all rounds
    DELETE FROM game_hints WHERE room_id = NEW.id;
    
    -- Delete votes for all rounds
    DELETE FROM game_votes WHERE room_id = NEW.id;
    
    -- Delete chat messages for all rounds
    DELETE FROM chat_messages WHERE room_id = NEW.id;
    
    -- Delete round secrets (game is over)
    DELETE FROM round_secrets WHERE room_id = NEW.id;
    
    RAISE NOTICE 'Round data cleaned for room % (POST_ROUND)', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_cleanup_round_data ON game_rooms;

-- Create trigger: Cleanup when entering POST_ROUND
CREATE TRIGGER trigger_cleanup_round_data
AFTER UPDATE OF current_phase ON game_rooms
FOR EACH ROW
WHEN (NEW.current_phase = 'POST_ROUND')
EXECUTE FUNCTION cleanup_round_data_on_game_end();

COMMENT ON FUNCTION cleanup_round_data_on_game_end IS 
'Auto-cleanup hints, votes, chat, and secrets when game enters POST_ROUND phase.';

-- ============================================
-- PART 4: HELPER FUNCTION - Manual Cleanup
-- ============================================

-- Utility function for manual cleanup (can be called by edge functions)
CREATE OR REPLACE FUNCTION manual_cleanup_round(
  p_room_id UUID,
  p_round_number INTEGER
)
RETURNS void AS $$
BEGIN
  DELETE FROM game_hints 
  WHERE room_id = p_room_id AND round_number = p_round_number;
  
  DELETE FROM game_votes 
  WHERE room_id = p_room_id AND round_number = p_round_number;
  
  DELETE FROM chat_messages 
  WHERE room_id = p_room_id AND round_number = p_round_number;
  
  -- DO NOT delete round_secrets (persist for entire game)
  
  RAISE NOTICE 'Manual cleanup complete for room %, round %', p_room_id, p_round_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION manual_cleanup_round IS 
'Manually cleanup hints/votes/chat for a specific round. Call from edge functions if needed.';

-- ============================================
-- TESTING QUERIES (Run these to verify)
-- ============================================

/*
Test spectator chat block:

-- 1. Create test room and players
INSERT INTO game_rooms (room_code, host_id) VALUES ('TEST123', 'guest_test_1');

INSERT INTO room_participants (room_id, user_id, username, is_alive) VALUES
((SELECT id FROM game_rooms WHERE room_code = 'TEST123'), 'guest_test_1', 'Alice', true),
((SELECT id FROM game_rooms WHERE room_code = 'TEST123'), 'guest_test_2', 'Bob', false); -- Spectator

-- 2. Try sending message as spectator (should FAIL)
INSERT INTO chat_messages (room_id, user_id, username, message, round_number)
VALUES (
  (SELECT id FROM game_rooms WHERE room_code = 'TEST123'),
  'guest_test_2',  -- Bob is spectator
  'Bob',
  'This should fail',
  1
);
-- Expected: ERROR - new row violates row-level security policy

-- 3. Try sending message as alive player (should SUCCEED)
INSERT INTO chat_messages (room_id, user_id, username, message, round_number)
VALUES (
  (SELECT id FROM game_rooms WHERE room_code = 'TEST123'),
  'guest_test_1',  -- Alice is alive
  'Alice',
  'This should work',
  1
);
-- Expected: SUCCESS

-- Cleanup
DELETE FROM game_rooms WHERE room_code = 'TEST123';
*/

/*
Test room auto-delete:

-- 1. Create test room with one player
INSERT INTO game_rooms (room_code, host_id) VALUES ('AUTO_DEL', 'guest_auto_1');
INSERT INTO room_participants (room_id, user_id, username) VALUES
((SELECT id FROM game_rooms WHERE room_code = 'AUTO_DEL'), 'guest_auto_1', 'TestUser');

-- 2. Verify room exists
SELECT * FROM game_rooms WHERE room_code = 'AUTO_DEL';

-- 3. Delete last participant (should trigger room deletion)
DELETE FROM room_participants 
WHERE room_id = (SELECT id FROM game_rooms WHERE room_code = 'AUTO_DEL');

-- 4. Verify room is auto-deleted
SELECT * FROM game_rooms WHERE room_code = 'AUTO_DEL';
-- Expected: 0 rows (room auto-deleted)
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

SELECT '✅ Migration complete! Features added:' AS status
UNION ALL SELECT '  1. Spectators blocked from chat (is_alive check)'
UNION ALL SELECT '  2. Empty rooms auto-deleted (trigger on participant leave)'
UNION ALL SELECT '  3. Round data auto-cleanup on POST_ROUND (trigger)'
UNION ALL SELECT '  4. Manual cleanup function available';
