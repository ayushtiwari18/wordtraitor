-- WordTraitor Database Setup
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABLE 1: PROFILES (User Identity)
-- ========================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ========================================
-- TABLE 2: GAME_ROOMS (The Circle/Lobby)
-- ========================================
CREATE TABLE game_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_code TEXT UNIQUE NOT NULL,
  host_id UUID REFERENCES auth.users NOT NULL,
  status TEXT DEFAULT 'LOBBY' CHECK (status IN ('LOBBY', 'PLAYING', 'FINISHED')),
  current_round INTEGER DEFAULT 1,
  game_mode TEXT DEFAULT 'SILENT' CHECK (game_mode IN ('SILENT', 'REAL', 'FLASH', 'AFTER_DARK')),
  difficulty TEXT DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  word_pack TEXT DEFAULT 'GENERAL',
  max_players INTEGER DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- RLS Policies for game_rooms
ALTER TABLE game_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view game rooms"
  ON game_rooms FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create rooms"
  ON game_rooms FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = host_id);

CREATE POLICY "Host can update their room"
  ON game_rooms FOR UPDATE
  USING (auth.uid() = host_id);

-- ========================================
-- TABLE 3: ROOM_PARTICIPANTS (Public Player Info)
-- ========================================
CREATE TABLE room_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  is_alive BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- RLS Policies for room_participants
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants in rooms"
  ON room_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join rooms"
  ON room_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
  ON room_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- ========================================
-- TABLE 4: ROUND_SECRETS (Protected Role & Word Data)
-- ========================================
CREATE TABLE round_secrets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  round_number INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('CITIZEN', 'TRAITOR')),
  secret_word TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id, round_number)
);

-- RLS Policies for round_secrets (CRITICAL SECURITY)
ALTER TABLE round_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own secrets"
  ON round_secrets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert secrets" 
  ON round_secrets FOR INSERT
  WITH CHECK (true); -- Only server-side functions should call this

CREATE POLICY "No updates to secrets"
  ON round_secrets FOR UPDATE
  USING (false);

-- ========================================
-- TABLE 5: GAME_HINTS (Hint Submissions)
-- ========================================
CREATE TABLE game_hints (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  round_number INTEGER NOT NULL,
  hint_text TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for game_hints
ALTER TABLE game_hints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hints in their room"
  ON game_hints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants 
      WHERE room_participants.room_id = game_hints.room_id 
      AND room_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can submit their own hints"
  ON game_hints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- TABLE 6: GAME_VOTES (Voting Records)
-- ========================================
CREATE TABLE game_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms ON DELETE CASCADE NOT NULL,
  round_number INTEGER NOT NULL,
  voter_id UUID REFERENCES auth.users NOT NULL,
  target_id UUID REFERENCES auth.users NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, round_number, voter_id)
);

-- RLS Policies for game_votes
ALTER TABLE game_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes in their room"
  ON game_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants 
      WHERE room_participants.room_id = game_votes.room_id 
      AND room_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can submit their own vote"
  ON game_votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id);

-- ========================================
-- TABLE 7: WORD_PAIRS (Word Database)
-- ========================================
CREATE TABLE word_pairs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  main_word TEXT NOT NULL,
  traitor_word TEXT NOT NULL,
  difficulty TEXT DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  word_pack TEXT DEFAULT 'GENERAL',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for word_pairs
ALTER TABLE word_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view word pairs"
  ON word_pairs FOR SELECT
  USING (true);

-- ========================================
-- SEED DATA: Sample Word Pairs
-- ========================================
INSERT INTO word_pairs (main_word, traitor_word, difficulty, word_pack) VALUES
  ('Ocean', 'Sea', 'HARD', 'GENERAL'),
  ('Piano', 'Guitar', 'MEDIUM', 'GENERAL'),
  ('Cat', 'Kitten', 'MEDIUM', 'GENERAL'),
  ('Sun', 'Moon', 'EASY', 'GENERAL'),
  ('Coffee', 'Tea', 'EASY', 'GENERAL'),
  ('Apple', 'Orange', 'EASY', 'GENERAL'),
  ('Mountain', 'Hill', 'MEDIUM', 'GENERAL'),
  ('River', 'Stream', 'HARD', 'GENERAL'),
  ('Doctor', 'Nurse', 'MEDIUM', 'GENERAL'),
  ('Book', 'Magazine', 'MEDIUM', 'GENERAL'),
  -- Movie pack
  ('Actor', 'Director', 'MEDIUM', 'MOVIES'),
  ('Cinema', 'Theater', 'HARD', 'MOVIES'),
  ('Sequel', 'Prequel', 'HARD', 'MOVIES'),
  -- Tech pack
  ('Laptop', 'Desktop', 'EASY', 'TECH'),
  ('Cloud', 'Server', 'MEDIUM', 'TECH'),
  ('Frontend', 'Backend', 'MEDIUM', 'TECH'),
  ('Bug', 'Feature', 'HARD', 'TECH');

-- ========================================
-- FUNCTIONS: Helper Functions
-- ========================================

-- Function to generate unique room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- INDEXES: Performance Optimization
-- ========================================
CREATE INDEX idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX idx_round_secrets_room_id ON round_secrets(room_id);
CREATE INDEX idx_game_hints_room_id ON game_hints(room_id);
CREATE INDEX idx_game_votes_room_id ON game_votes(room_id);
CREATE INDEX idx_game_rooms_status ON game_rooms(status);
CREATE INDEX idx_game_rooms_room_code ON game_rooms(room_code);

-- ========================================
-- REALTIME: Enable for live updates
-- ========================================
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE game_hints;
ALTER PUBLICATION supabase_realtime ADD TABLE game_votes;

-- Note: round_secrets is NOT added to realtime for security

-- Setup complete! 🎉