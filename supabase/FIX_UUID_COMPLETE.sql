-- COMPLETE FIX FOR UUID ERROR
-- This script handles policies correctly before altering column types

-- ========================================
-- STEP 1: DROP ALL POLICIES
-- ========================================

-- Drop game_rooms policies
DROP POLICY IF EXISTS "Anyone can view game rooms" ON game_rooms;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON game_rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON game_rooms;
DROP POLICY IF EXISTS "Host can update their room" ON game_rooms;
DROP POLICY IF EXISTS "Host can update room" ON game_rooms;
DROP POLICY IF EXISTS "Anyone can create rooms" ON game_rooms;

-- Drop room_participants policies
DROP POLICY IF EXISTS "Anyone can view participants in rooms" ON room_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON room_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON room_participants;
DROP POLICY IF EXISTS "Anyone can join rooms" ON room_participants;
DROP POLICY IF EXISTS "Anyone can update participation" ON room_participants;

-- Drop round_secrets policies
DROP POLICY IF EXISTS "Users can only see their own secrets" ON round_secrets;
DROP POLICY IF EXISTS "System can insert secrets" ON round_secrets;
DROP POLICY IF EXISTS "No updates to secrets" ON round_secrets;
DROP POLICY IF EXISTS "Users see own secrets" ON round_secrets;

-- Drop game_hints policies
DROP POLICY IF EXISTS "Anyone can view hints in their room" ON game_hints;
DROP POLICY IF EXISTS "Users can submit their own hints" ON game_hints;
DROP POLICY IF EXISTS "Anyone can submit hints" ON game_hints;

-- Drop game_votes policies
DROP POLICY IF EXISTS "Anyone can view votes in their room" ON game_votes;
DROP POLICY IF EXISTS "Users can submit their own vote" ON game_votes;
DROP POLICY IF EXISTS "Anyone can vote" ON game_votes;

-- Drop profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles viewable" ON profiles;
DROP POLICY IF EXISTS "Anyone can insert profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can update profile" ON profiles;

-- ========================================
-- STEP 2: DROP FOREIGN KEY CONSTRAINTS
-- ========================================

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

ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- ========================================
-- STEP 3: CHANGE COLUMN TYPES TO TEXT
-- ========================================

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

ALTER TABLE profiles 
ALTER COLUMN id TYPE TEXT;

-- ========================================
-- STEP 4: RECREATE RLS POLICIES
-- ========================================

-- game_rooms policies
CREATE POLICY "Anyone can view game rooms"
  ON game_rooms FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create rooms"
  ON game_rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update rooms"
  ON game_rooms FOR UPDATE
  USING (true);

-- room_participants policies
CREATE POLICY "Anyone can view participants"
  ON room_participants FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join rooms"
  ON room_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update participation"
  ON room_participants FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete participation"
  ON room_participants FOR DELETE
  USING (true);

-- round_secrets policies (client-side filtering)
CREATE POLICY "Anyone can view secrets"
  ON round_secrets FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert secrets"
  ON round_secrets FOR INSERT
  WITH CHECK (true);

-- game_hints policies
CREATE POLICY "Anyone can view hints"
  ON game_hints FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit hints"
  ON game_hints FOR INSERT
  WITH CHECK (true);

-- game_votes policies
CREATE POLICY "Anyone can view votes"
  ON game_votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can vote"
  ON game_votes FOR INSERT
  WITH CHECK (true);

-- profiles policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update profiles"
  ON profiles FOR UPDATE
  USING (true);

-- ========================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_game_rooms_host_id ON game_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_room_code ON game_rooms(room_code);

CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_round_secrets_room_id ON round_secrets(room_id);
CREATE INDEX IF NOT EXISTS idx_round_secrets_user_id ON round_secrets(user_id);

CREATE INDEX IF NOT EXISTS idx_game_hints_room_id ON game_hints(room_id);
CREATE INDEX IF NOT EXISTS idx_game_hints_user_id ON game_hints(user_id);

CREATE INDEX IF NOT EXISTS idx_game_votes_room_id ON game_votes(room_id);
CREATE INDEX IF NOT EXISTS idx_game_votes_voter_id ON game_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_game_votes_target_id ON game_votes(target_id);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- ========================================
-- STEP 6: VERIFY CHANGES
-- ========================================

-- Check column types
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('game_rooms', 'room_participants', 'round_secrets', 'game_hints', 'game_votes', 'profiles')
  AND column_name IN ('host_id', 'user_id', 'voter_id', 'target_id', 'id')
ORDER BY table_name, column_name;

-- ========================================
-- MIGRATION COMPLETE! ✅
-- ========================================
-- Your database now supports anonymous guest users
-- Guest IDs format: guest_timestamp_randomstring
-- All RLS policies have been updated for anonymous access