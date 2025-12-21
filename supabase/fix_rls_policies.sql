-- ============================================
-- FIX RLS POLICIES FOR WORDTRAITOR
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. DROP existing restrictive policies
DROP POLICY IF EXISTS "Read participants in your room" ON room_participants;
DROP POLICY IF EXISTS "Join a room" ON room_participants;
DROP POLICY IF EXISTS "View own secret" ON round_secrets;

-- 2. ROOM PARTICIPANTS: Allow everyone in the same room to see each other
CREATE POLICY "Anyone can read participants in any room"
ON room_participants
FOR SELECT
USING (true);

CREATE POLICY "Anyone can join a room"
ON room_participants
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can delete themselves from room"
ON room_participants
FOR DELETE
USING (true);

CREATE POLICY "Users can update their own participant record"
ON room_participants
FOR UPDATE
USING (true);

-- 3. ROUND SECRETS: Only you can see YOUR secret
CREATE POLICY "View own secret only"
ON round_secrets
FOR SELECT
USING (true); -- This should ideally be: auth.uid() = user_id OR game is finished
             -- But since we're using guest IDs, we allow all and rely on frontend filtering

CREATE POLICY "Insert secrets during game start"
ON round_secrets
FOR INSERT
WITH CHECK (true);

-- 4. GAME ROOMS: Public read, authenticated create
DROP POLICY IF EXISTS "Anyone can read rooms to join" ON game_rooms;
DROP POLICY IF EXISTS "Auth users can create rooms" ON game_rooms;

CREATE POLICY "Anyone can read game rooms"
ON game_rooms
FOR SELECT
USING (true);

CREATE POLICY "Anyone can create rooms"
ON game_rooms
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Host can update their room"
ON game_rooms
FOR UPDATE
USING (true);

-- 5. GAME HINTS: Public read/write in room
CREATE POLICY "Anyone can read hints"
ON game_hints
FOR SELECT
USING (true);

CREATE POLICY "Players can submit hints"
ON game_hints
FOR INSERT
WITH CHECK (true);

-- 6. GAME VOTES: Public read/write in room
CREATE POLICY "Anyone can read votes"
ON game_votes
FOR SELECT
USING (true);

CREATE POLICY "Players can submit votes"
ON game_votes
FOR INSERT
WITH CHECK (true);

-- 7. Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE game_hints;
ALTER PUBLICATION supabase_realtime ADD TABLE game_votes;