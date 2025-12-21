-- WordTraitor Database Setup (Anonymous Users Edition)
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- TABLE 1: GAME_ROOMS (The Circle/Lobby)
-- ========================================
CREATE TABLE IF NOT EXISTS game_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_code TEXT UNIQUE NOT NULL,
  host_id TEXT NOT NULL, -- Guest ID as text
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

CREATE POLICY "Anyone can create rooms"
  ON game_rooms FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update rooms"
  ON game_rooms FOR UPDATE
  USING (true);

-- ========================================
-- TABLE 2: ROOM_PARTICIPANTS (Public Player Info)
-- ========================================
CREATE TABLE IF NOT EXISTS room_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms ON DELETE CASCADE NOT NULL,
  user_id TEXT NOT NULL, -- Guest ID as text
  username TEXT NOT NULL,
  avatar TEXT,
  is_alive BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- RLS Policies for room_participants
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants"
  ON room_participants FOR SELECT
  USING (true);

CREATE POLICY "Anyone can join rooms"
  ON room_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update participation"
  ON room_participants FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can leave rooms"
  ON room_participants FOR DELETE
  USING (true);

-- ========================================
-- TABLE 3: ROUND_SECRETS (Protected Role & Word Data)
-- ========================================
CREATE TABLE IF NOT EXISTS round_secrets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms ON DELETE CASCADE NOT NULL,
  user_id TEXT NOT NULL, -- Guest ID as text
  round_number INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('CITIZEN', 'TRAITOR')),
  secret_word TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id, round_number)
);

-- RLS Policies for round_secrets
ALTER TABLE round_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view secrets" -- Client-side filtering by user_id
  ON round_secrets FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert secrets"
  ON round_secrets FOR INSERT
  WITH CHECK (true);

-- ========================================
-- TABLE 4: GAME_HINTS (Hint Submissions)
-- ========================================
CREATE TABLE IF NOT EXISTS game_hints (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms ON DELETE CASCADE NOT NULL,
  user_id TEXT NOT NULL, -- Guest ID as text
  round_number INTEGER NOT NULL,
  hint_text TEXT NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for game_hints
ALTER TABLE game_hints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hints"
  ON game_hints FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit hints"
  ON game_hints FOR INSERT
  WITH CHECK (true);

-- ========================================
-- TABLE 5: GAME_VOTES (Voting Records)
-- ========================================
CREATE TABLE IF NOT EXISTS game_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES game_rooms ON DELETE CASCADE NOT NULL,
  round_number INTEGER NOT NULL,
  voter_id TEXT NOT NULL, -- Guest ID as text
  target_id TEXT NOT NULL, -- Guest ID as text
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, round_number, voter_id)
);

-- RLS Policies for game_votes
ALTER TABLE game_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
  ON game_votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can submit votes"
  ON game_votes FOR INSERT
  WITH CHECK (true);

-- ========================================
-- TABLE 6: WORD_PAIRS (Word Database)
-- ========================================
CREATE TABLE IF NOT EXISTS word_pairs (
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
  -- GENERAL PACK
  ('Ocean', 'Sea', 'HARD', 'GENERAL'),
  ('Piano', 'Keyboard', 'MEDIUM', 'GENERAL'),
  ('Cat', 'Dog', 'EASY', 'GENERAL'),
  ('Sun', 'Moon', 'EASY', 'GENERAL'),
  ('Coffee', 'Tea', 'MEDIUM', 'GENERAL'),
  ('Apple', 'Orange', 'EASY', 'GENERAL'),
  ('Mountain', 'Hill', 'HARD', 'GENERAL'),
  ('River', 'Stream', 'HARD', 'GENERAL'),
  ('Doctor', 'Nurse', 'MEDIUM', 'GENERAL'),
  ('Book', 'Magazine', 'MEDIUM', 'GENERAL'),
  ('Summer', 'Winter', 'EASY', 'GENERAL'),
  ('Rain', 'Snow', 'EASY', 'GENERAL'),
  ('Airplane', 'Helicopter', 'MEDIUM', 'GENERAL'),
  ('Forest', 'Jungle', 'HARD', 'GENERAL'),
  ('Island', 'Peninsula', 'HARD', 'GENERAL'),
  
  -- MOVIES PACK
  ('Actor', 'Director', 'MEDIUM', 'MOVIES'),
  ('Cinema', 'Theater', 'HARD', 'MOVIES'),
  ('Sequel', 'Prequel', 'HARD', 'MOVIES'),
  ('Hero', 'Villain', 'EASY', 'MOVIES'),
  ('Comedy', 'Drama', 'MEDIUM', 'MOVIES'),
  ('Action', 'Adventure', 'MEDIUM', 'MOVIES'),
  ('Thriller', 'Horror', 'MEDIUM', 'MOVIES'),
  ('Documentary', 'Biography', 'HARD', 'MOVIES'),
  ('Animation', 'Cartoon', 'HARD', 'MOVIES'),
  ('Oscar', 'Emmy', 'MEDIUM', 'MOVIES'),
  
  -- TECH PACK
  ('Laptop', 'Desktop', 'EASY', 'TECH'),
  ('Cloud', 'Server', 'MEDIUM', 'TECH'),
  ('Frontend', 'Backend', 'MEDIUM', 'TECH'),
  ('Bug', 'Feature', 'HARD', 'TECH'),
  ('Database', 'Spreadsheet', 'MEDIUM', 'TECH'),
  ('Website', 'Application', 'MEDIUM', 'TECH'),
  ('Keyboard', 'Mouse', 'EASY', 'TECH'),
  ('Monitor', 'Screen', 'HARD', 'TECH'),
  ('Upload', 'Download', 'EASY', 'TECH'),
  ('Hardware', 'Software', 'EASY', 'TECH'),
  
  -- TRAVEL PACK
  ('Hotel', 'Motel', 'MEDIUM', 'TRAVEL'),
  ('Airport', 'Station', 'MEDIUM', 'TRAVEL'),
  ('Passport', 'Visa', 'MEDIUM', 'TRAVEL'),
  ('Beach', 'Coast', 'HARD', 'TRAVEL'),
  ('City', 'Town', 'MEDIUM', 'TRAVEL'),
  ('Museum', 'Gallery', 'MEDIUM', 'TRAVEL'),
  ('Tourist', 'Traveler', 'HARD', 'TRAVEL'),
  ('Cruise', 'Ferry', 'MEDIUM', 'TRAVEL'),
  ('Camping', 'Hiking', 'MEDIUM', 'TRAVEL'),
  ('Vacation', 'Holiday', 'HARD', 'TRAVEL'),
  
  -- FOOD PACK
  ('Pizza', 'Pasta', 'EASY', 'FOOD'),
  ('Burger', 'Sandwich', 'MEDIUM', 'FOOD'),
  ('Chicken', 'Turkey', 'MEDIUM', 'FOOD'),
  ('Salad', 'Soup', 'EASY', 'FOOD'),
  ('Breakfast', 'Brunch', 'MEDIUM', 'FOOD'),
  ('Dessert', 'Sweet', 'MEDIUM', 'FOOD'),
  ('Restaurant', 'Cafe', 'MEDIUM', 'FOOD'),
  ('Chef', 'Cook', 'HARD', 'FOOD'),
  ('Recipe', 'Menu', 'MEDIUM', 'FOOD'),
  ('Spicy', 'Hot', 'HARD', 'FOOD')
ON CONFLICT DO NOTHING;

-- ========================================
-- INDEXES: Performance Optimization
-- ========================================
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_round_secrets_room_id ON round_secrets(room_id);
CREATE INDEX IF NOT EXISTS idx_game_hints_room_id ON game_hints(room_id);
CREATE INDEX IF NOT EXISTS idx_game_votes_room_id ON game_votes(room_id);
CREATE INDEX IF NOT EXISTS idx_game_rooms_status ON game_rooms(status);
CREATE INDEX IF NOT EXISTS idx_game_rooms_room_code ON game_rooms(room_code);

-- ========================================
-- REALTIME: Enable for live updates
-- ========================================
ALTER PUBLICATION supabase_realtime ADD TABLE game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE game_hints;
ALTER PUBLICATION supabase_realtime ADD TABLE game_votes;

-- Note: round_secrets is NOT added to realtime for security

-- Setup complete! 🎉
-- No authentication required - fully anonymous!