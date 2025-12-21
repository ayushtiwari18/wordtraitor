-- Migration to support anonymous users in WordTraitor
-- Run this in your Supabase SQL Editor

-- Add username column to room_participants (for anonymous users)
ALTER TABLE room_participants ADD COLUMN IF NOT EXISTS username TEXT;

-- Make user_id nullable for anonymous users (but keep the reference)
ALTER TABLE room_participants ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint to ensure either user_id or username exists
ALTER TABLE room_participants ADD CONSTRAINT check_user_identification 
  CHECK ((user_id IS NOT NULL) OR (username IS NOT NULL));

-- Update unique constraint to include username
ALTER TABLE room_participants DROP CONSTRAINT IF EXISTS room_participants_room_id_user_id_key;
ALTER TABLE room_participants ADD CONSTRAINT room_participants_unique 
  UNIQUE (room_id, user_id, username);

-- Update game_rooms to support anonymous host
ALTER TABLE game_rooms ALTER COLUMN host_id DROP NOT NULL;
ALTER TABLE game_rooms ADD COLUMN IF NOT EXISTS host_username TEXT;

-- Update round_secrets to support anonymous users
ALTER TABLE round_secrets ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE round_secrets ADD COLUMN IF NOT EXISTS username TEXT;

-- Update game_hints to support anonymous users  
ALTER TABLE game_hints ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE game_hints ADD COLUMN IF NOT EXISTS username TEXT;

-- Update game_votes to support anonymous users
ALTER TABLE game_votes ALTER COLUMN voter_id DROP NOT NULL;
ALTER TABLE game_votes ALTER COLUMN target_id DROP NOT NULL;
ALTER TABLE game_votes ADD COLUMN IF NOT EXISTS voter_username TEXT;
ALTER TABLE game_votes ADD COLUMN IF NOT EXISTS target_username TEXT;

-- Update RLS policies for anonymous access
DROP POLICY IF EXISTS "Users can join rooms" ON room_participants;
CREATE POLICY "Anyone can join rooms"
  ON room_participants FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own participation" ON room_participants;
CREATE POLICY "Anyone can update their participation"
  ON room_participants FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create rooms" ON game_rooms;
CREATE POLICY "Anyone can create rooms"
  ON game_rooms FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Host can update their room" ON game_rooms;
CREATE POLICY "Host or anyone can update rooms"
  ON game_rooms FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can only see their own secrets" ON round_secrets;
CREATE POLICY "Users can see their own secrets (anonymous or auth)"
  ON round_secrets FOR SELECT
  USING (true); -- Handled at application level

DROP POLICY IF EXISTS "Users can submit their own hints" ON game_hints;
CREATE POLICY "Anyone can submit hints"
  ON game_hints FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can submit their own vote" ON game_votes;
CREATE POLICY "Anyone can submit votes"
  ON game_votes FOR INSERT
  WITH CHECK (true);

-- Add more word pairs for better game variety
INSERT INTO word_pairs (main_word, traitor_word, difficulty, word_pack) VALUES
  -- GENERAL pack additions
  ('Bicycle', 'Motorcycle', 'MEDIUM', 'GENERAL'),
  ('Summer', 'Winter', 'EASY', 'GENERAL'),
  ('Cake', 'Pie', 'EASY', 'GENERAL'),
  ('Dog', 'Puppy', 'MEDIUM', 'GENERAL'),
  ('Forest', 'Jungle', 'HARD', 'GENERAL'),
  ('Rain', 'Snow', 'EASY', 'GENERAL'),
  ('Car', 'Truck', 'EASY', 'GENERAL'),
  ('Phone', 'Tablet', 'MEDIUM', 'GENERAL'),
  ('Pizza', 'Burger', 'EASY', 'GENERAL'),
  ('Beach', 'Ocean', 'MEDIUM', 'GENERAL'),
  
  -- MOVIES pack additions
  ('Popcorn', 'Candy', 'EASY', 'MOVIES'),
  ('Horror', 'Comedy', 'MEDIUM', 'MOVIES'),
  ('Superhero', 'Villain', 'MEDIUM', 'MOVIES'),
  ('Ticket', 'Subscription', 'HARD', 'MOVIES'),
  ('Blockbuster', 'Indie', 'HARD', 'MOVIES'),
  
  -- TECH pack additions
  ('Mouse', 'Keyboard', 'EASY', 'TECH'),
  ('WiFi', 'Ethernet', 'MEDIUM', 'TECH'),
  ('Download', 'Upload', 'MEDIUM', 'TECH'),
  ('Hardware', 'Software', 'MEDIUM', 'TECH'),
  ('Algorithm', 'Function', 'HARD', 'TECH'),
  
  -- FOOD pack (new)
  ('Sushi', 'Ramen', 'MEDIUM', 'FOOD'),
  ('Breakfast', 'Dinner', 'EASY', 'FOOD'),
  ('Sweet', 'Salty', 'EASY', 'FOOD'),
  ('Steak', 'Chicken', 'EASY', 'FOOD'),
  ('Fork', 'Spoon', 'EASY', 'FOOD'),
  ('Restaurant', 'Cafe', 'MEDIUM', 'FOOD'),
  ('Chef', 'Cook', 'HARD', 'FOOD'),
  
  -- SPORTS pack (new)
  ('Soccer', 'Football', 'MEDIUM', 'SPORTS'),
  ('Basketball', 'Baseball', 'EASY', 'SPORTS'),
  ('Olympic', 'Championship', 'HARD', 'SPORTS'),
  ('Stadium', 'Arena', 'MEDIUM', 'SPORTS'),
  ('Athlete', 'Player', 'MEDIUM', 'SPORTS'),
  ('Coach', 'Manager', 'HARD', 'SPORTS'),
  
  -- ANIMALS pack (new)
  ('Lion', 'Tiger', 'EASY', 'ANIMALS'),
  ('Elephant', 'Rhino', 'MEDIUM', 'ANIMALS'),
  ('Eagle', 'Hawk', 'HARD', 'ANIMALS'),
  ('Dolphin', 'Whale', 'MEDIUM', 'ANIMALS'),
  ('Snake', 'Lizard', 'MEDIUM', 'ANIMALS'),
  ('Butterfly', 'Moth', 'HARD', 'ANIMALS')
ON CONFLICT DO NOTHING;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_room_participants_username ON room_participants(username);

-- Migration complete!
SELECT 'Anonymous users migration completed successfully!' AS status;
