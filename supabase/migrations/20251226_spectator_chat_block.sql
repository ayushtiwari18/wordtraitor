-- Migration: Block spectators (is_alive=false) from chatting
-- Date: 2025-12-26
-- Purpose: Spectators should only observe, not participate in chat

-- Note: This assumes room_messages table exists
-- If table doesn't exist yet, this migration will be applied when chat is implemented

DO $$ 
BEGIN
  -- Check if room_messages table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'room_messages'
  ) THEN
    -- Drop old permissive policy if it exists
    DROP POLICY IF EXISTS "Anyone can send messages" ON room_messages;
    
    -- Create new restrictive policy
    CREATE POLICY "Only alive players can chat"
      ON room_messages FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM room_participants 
          WHERE room_id = room_messages.room_id 
          AND user_id = room_messages.user_id 
          AND is_alive = true
        )
      );
  END IF;
END $$;
