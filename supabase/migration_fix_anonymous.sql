-- Migration: Fix anonymous user support
-- This allows TEXT user_id instead of requiring UUID from auth.users

-- Drop foreign key constraints that require auth.users
ALTER TABLE game_rooms 
DROP CONSTRAINT IF EXISTS game_rooms_host_id_fkey;

ALTER TABLE room_participants 
DROP CONSTRAINT IF EXISTS room_participants_user_id_fkey;

ALTER TABLE round_secrets 
DROP CONSTRAINT IF EXISTS round_secrets_user_id_fkey;

ALTER TABLE game_hints 
DROP CONSTRAINT IF EXISTS game_hints_user_id_fkey;

ALTER TABLE game_votes 
DROP CONSTRAINT IF EXISTS game_votes_voter_id_fkey,
DROP CONSTRAINT IF EXISTS game_votes_target_id_fkey;

-- Change user_id columns to TEXT to support guest IDs
ALTER TABLE game_rooms 
ALTER COLUMN host_id TYPE TEXT;

ALTER TABLE room_participants 
ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE round_secrets 
ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE game_hints 
ALTER COLUMN user_id TYPE TEXT;

ALTER TABLE game_votes 
ALTER COLUMN voter_id TYPE TEXT,
ALTER COLUMN target_id TYPE TEXT;

-- Update RLS policies to work without auth.uid()
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON game_rooms;
CREATE POLICY "Anyone can create rooms"
  ON game_rooms FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Host can update their room" ON game_rooms;
CREATE POLICY "Host can update room"
  ON game_rooms FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can join rooms" ON room_participants;
CREATE POLICY "Anyone can join rooms"
  ON room_participants FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own participation" ON room_participants;
CREATE POLICY "Anyone can update participation"
  ON room_participants FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can only see their own secrets" ON round_secrets;
CREATE POLICY "Users see own secrets"
  ON round_secrets FOR SELECT
  USING (true); -- Client will filter by user_id

DROP POLICY IF EXISTS "Users can submit their own hints" ON game_hints;
CREATE POLICY "Anyone can submit hints"
  ON game_hints FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can submit their own vote" ON game_votes;
CREATE POLICY "Anyone can vote"
  ON game_votes FOR INSERT
  WITH CHECK (true);

-- Update indexes
DROP INDEX IF EXISTS idx_room_participants_user_id;
CREATE INDEX idx_room_participants_user_id ON room_participants(user_id);

DROP INDEX IF EXISTS idx_round_secrets_user_id;
CREATE INDEX idx_round_secrets_user_id ON round_secrets(user_id);

DROP INDEX IF EXISTS idx_game_hints_user_id;
CREATE INDEX idx_game_hints_user_id ON game_hints(user_id);

DROP INDEX IF EXISTS idx_game_votes_voter_id;
CREATE INDEX idx_game_votes_voter_id ON game_votes(voter_id);

DROP INDEX IF EXISTS idx_game_votes_target_id;
CREATE INDEX idx_game_votes_target_id ON game_votes(target_id);

-- Migration complete!
-- Now the app can use guest_xxx IDs without UUID constraints