-- Migration: Auto-cleanup empty rooms
-- Date: 2025-12-26
-- Purpose: Automatically delete game_rooms when last participant leaves

-- Create function to cleanup empty rooms
CREATE OR REPLACE FUNCTION cleanup_empty_rooms()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this was the last participant in the room
  IF (SELECT COUNT(*) FROM room_participants WHERE room_id = OLD.room_id) = 0 THEN
    -- Delete the game room (CASCADE will handle related data)
    DELETE FROM game_rooms WHERE id = OLD.room_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on room_participants DELETE
DROP TRIGGER IF EXISTS trigger_cleanup_empty_rooms ON room_participants;

CREATE TRIGGER trigger_cleanup_empty_rooms
AFTER DELETE ON room_participants
FOR EACH ROW
EXECUTE FUNCTION cleanup_empty_rooms();

-- Comment for documentation
COMMENT ON FUNCTION cleanup_empty_rooms() IS 'Automatically deletes game_rooms when the last participant leaves';
