-- Migration: Add username to room_participants for anonymous users
-- Run this in your Supabase SQL Editor

-- Add username column to room_participants
ALTER TABLE room_participants 
ADD COLUMN IF NOT EXISTS username TEXT;

-- Add more word pairs
INSERT INTO word_pairs (main_word, traitor_word, difficulty, word_pack) VALUES
  -- GENERAL pack additions
  ('Winter', 'Summer', 'EASY', 'GENERAL'),
  ('Airplane', 'Helicopter', 'MEDIUM', 'GENERAL'),
  ('Basketball', 'Football', 'EASY', 'GENERAL'),
  ('Diamond', 'Ruby', 'MEDIUM', 'GENERAL'),
  ('Breakfast', 'Dinner', 'EASY', 'GENERAL'),
  ('Thunder', 'Lightning', 'HARD', 'GENERAL'),
  ('Castle', 'Palace', 'MEDIUM', 'GENERAL'),
  ('Whale', 'Dolphin', 'MEDIUM', 'GENERAL'),
  ('Garden', 'Forest', 'EASY', 'GENERAL'),
  ('Rainbow', 'Sunset', 'MEDIUM', 'GENERAL'),
  
  -- MOVIES pack
  ('Comedy', 'Drama', 'EASY', 'MOVIES'),
  ('Villain', 'Hero', 'EASY', 'MOVIES'),
  ('Script', 'Screenplay', 'HARD', 'MOVIES'),
  ('Hollywood', 'Bollywood', 'MEDIUM', 'MOVIES'),
  ('Trailer', 'Teaser', 'HARD', 'MOVIES'),
  ('Oscar', 'Emmy', 'MEDIUM', 'MOVIES'),
  ('Superhero', 'Supervillain', 'EASY', 'MOVIES'),
  ('Documentary', 'Biography', 'MEDIUM', 'MOVIES'),
  
  -- TECH pack
  ('Python', 'JavaScript', 'MEDIUM', 'TECH'),
  ('Database', 'Spreadsheet', 'MEDIUM', 'TECH'),
  ('Android', 'iPhone', 'EASY', 'TECH'),
  ('Internet', 'Intranet', 'HARD', 'TECH'),
  ('Keyboard', 'Mouse', 'EASY', 'TECH'),
  ('Software', 'Hardware', 'EASY', 'TECH'),
  ('Upload', 'Download', 'EASY', 'TECH'),
  ('Website', 'App', 'MEDIUM', 'TECH'),
  ('Virus', 'Malware', 'HARD', 'TECH'),
  ('WiFi', 'Bluetooth', 'MEDIUM', 'TECH'),
  
  -- FOOD pack
  ('Pizza', 'Burger', 'EASY', 'FOOD'),
  ('Chocolate', 'Vanilla', 'EASY', 'FOOD'),
  ('Steak', 'Ribs', 'MEDIUM', 'FOOD'),
  ('Sushi', 'Ramen', 'MEDIUM', 'FOOD'),
  ('Bread', 'Toast', 'HARD', 'FOOD'),
  ('Cake', 'Pie', 'EASY', 'FOOD'),
  ('Salad', 'Soup', 'EASY', 'FOOD'),
  ('Chicken', 'Turkey', 'MEDIUM', 'FOOD'),
  ('Ice Cream', 'Gelato', 'HARD', 'FOOD'),
  ('Pasta', 'Noodles', 'MEDIUM', 'FOOD'),
  
  -- NATURE pack
  ('Desert', 'Tundra', 'MEDIUM', 'NATURE'),
  ('Volcano', 'Earthquake', 'MEDIUM', 'NATURE'),
  ('Lake', 'Pond', 'HARD', 'NATURE'),
  ('Tiger', 'Lion', 'EASY', 'NATURE'),
  ('Butterfly', 'Moth', 'HARD', 'NATURE'),
  ('Rose', 'Tulip', 'MEDIUM', 'NATURE'),
  ('Eagle', 'Hawk', 'HARD', 'NATURE'),
  ('Beach', 'Shore', 'HARD', 'NATURE'),
  ('Jungle', 'Rainforest', 'HARD', 'NATURE'),
  ('Cactus', 'Succulent', 'MEDIUM', 'NATURE'),
  
  -- SPORTS pack
  ('Tennis', 'Badminton', 'MEDIUM', 'SPORTS'),
  ('Swimming', 'Diving', 'MEDIUM', 'SPORTS'),
  ('Marathon', 'Sprint', 'MEDIUM', 'SPORTS'),
  ('Boxing', 'Wrestling', 'EASY', 'SPORTS'),
  ('Soccer', 'Hockey', 'EASY', 'SPORTS'),
  ('Volleyball', 'Handball', 'MEDIUM', 'SPORTS'),
  ('Golf', 'Cricket', 'EASY', 'SPORTS'),
  ('Skateboard', 'Roller Skates', 'MEDIUM', 'SPORTS'),
  ('Cycling', 'Running', 'EASY', 'SPORTS'),
  ('Baseball', 'Softball', 'HARD', 'SPORTS');

-- Update RLS policy for room_participants to allow username
DROP POLICY IF EXISTS "Users can join rooms" ON room_participants;
CREATE POLICY "Users can join rooms"
  ON room_participants FOR INSERT
  WITH CHECK (true); -- Allow anonymous inserts with username

-- Migration complete!
-- Remember to run this SQL in your Supabase SQL Editor