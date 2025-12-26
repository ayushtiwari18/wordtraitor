-- Migration: Add RLS policy to block spectators from sending chat messages
-- Date: December 26, 2025
-- Purpose: Prevent eliminated players (is_alive = false) from chatting

-- Drop existing policy if it exists (for re-running migration)
DROP POLICY IF EXISTS "spectators_cannot_send_messages" ON room_messages;

-- Create RLS policy: Only alive players can send messages
CREATE POLICY "spectators_cannot_send_messages"
ON room_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM room_participants
    WHERE room_participants.room_id = room_messages.room_id
      AND room_participants.user_id = auth.uid()
      AND room_participants.is_alive = true  -- ✅ Only alive players can chat
  )
);

-- Add index for performance (if not already exists)
CREATE INDEX IF NOT EXISTS idx_room_participants_alive 
ON room_participants(room_id, user_id, is_alive);

-- Add winner column to game_rooms if not exists
ALTER TABLE game_rooms 
ADD COLUMN IF NOT EXISTS winner TEXT CHECK (winner IN ('CITIZENS', 'TRAITOR'));

-- Add comment for documentation
COMMENT ON POLICY "spectators_cannot_send_messages" ON room_messages IS 
'Prevents spectators (is_alive = false) from sending chat messages. Spectators can still read messages via SELECT.';

COMMENT ON COLUMN game_rooms.winner IS
'Stores the winner of the game: CITIZENS or TRAITOR. Set when game ends in POST_ROUND phase.';
