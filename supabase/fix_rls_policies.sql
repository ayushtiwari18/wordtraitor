-- ============================================
-- FIX RLS POLICIES FOR WORDTRAITOR
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. DROP ALL existing policies to start fresh
DROP POLICY IF EXISTS "Read participants in your room" ON room_participants;
DROP POLICY IF EXISTS "Join a room" ON room_participants;
DROP POLICY IF EXISTS "Anyone can read participants in any room" ON room_participants;
DROP POLICY IF EXISTS "Anyone can read participants" ON room_participants;
DROP POLICY IF EXISTS "Anyone can join a room" ON room_participants;
DROP POLICY IF EXISTS "Anyone can join" ON room_participants;
DROP POLICY IF EXISTS "Users can delete themselves from room" ON room_participants;
DROP POLICY IF EXISTS "Anyone can leave" ON room_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON room_participants;

DROP POLICY IF EXISTS "View own secret" ON round_secrets;
DROP POLICY IF EXISTS "View own secret only" ON round_secrets;
DROP POLICY IF EXISTS "Insert secrets during game start" ON round_secrets;
DROP POLICY IF EXISTS "Insert secrets" ON round_secrets;

DROP POLICY IF EXISTS "Anyone can read rooms to join" ON game_rooms;
DROP POLICY IF EXISTS "Auth users can create rooms" ON game_rooms;
DROP POLICY IF EXISTS "Anyone can read game rooms" ON game_rooms;
DROP POLICY IF EXISTS "Anyone can create rooms" ON game_rooms;
DROP POLICY IF EXISTS "Host can update their room" ON game_rooms;

DROP POLICY IF EXISTS "Anyone can read hints" ON game_hints;
DROP POLICY IF EXISTS "Players can submit hints" ON game_hints;
DROP POLICY IF EXISTS "See hints in my room" ON game_hints;
DROP POLICY IF EXISTS "Post hint" ON game_hints;

DROP POLICY IF EXISTS "Anyone can read votes" ON game_votes;
DROP POLICY IF EXISTS "Players can submit votes" ON game_votes;

-- 2. ROOM PARTICIPANTS: Allow everyone to see and join
CREATE POLICY "rp_select_all"
ON room_participants
FOR SELECT
USING (true);

CREATE POLICY "rp_insert_all"
ON room_participants
FOR INSERT
WITH CHECK (true);

CREATE POLICY "rp_delete_all"
ON room_participants
FOR DELETE
USING (true);

CREATE POLICY "rp_update_all"
ON room_participants
FOR UPDATE
USING (true);

-- 3. ROUND SECRETS: Allow reading (frontend filters)
CREATE POLICY "rs_select_all"
ON round_secrets
FOR SELECT
USING (true);

CREATE POLICY "rs_insert_all"
ON round_secrets
FOR INSERT
WITH CHECK (true);

-- 4. GAME ROOMS: Public access
CREATE POLICY "gr_select_all"
ON game_rooms
FOR SELECT
USING (true);

CREATE POLICY "gr_insert_all"
ON game_rooms
FOR INSERT
WITH CHECK (true);

CREATE POLICY "gr_update_all"
ON game_rooms
FOR UPDATE
USING (true);

-- 5. GAME HINTS: Public access
CREATE POLICY "gh_select_all"
ON game_hints
FOR SELECT
USING (true);

CREATE POLICY "gh_insert_all"
ON game_hints
FOR INSERT
WITH CHECK (true);

-- 6. GAME VOTES: Public access
CREATE POLICY "gv_select_all"
ON game_votes
FOR SELECT
USING (true);

CREATE POLICY "gv_insert_all"
ON game_votes
FOR INSERT
WITH CHECK (true);

-- 7. Enable Realtime for all tables (ignore errors if already enabled)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE game_hints;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE game_votes;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;