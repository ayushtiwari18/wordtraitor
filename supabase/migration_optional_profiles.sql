-- Migration: Make profiles optional for anonymous users

-- Drop the foreign key from profiles to auth.users if it exists
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Change profiles.id to TEXT to match our guest system
ALTER TABLE profiles 
ALTER COLUMN id TYPE TEXT;

-- Update RLS policies for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles viewable"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Anyone can insert profile"
  ON profiles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Anyone can update profile"
  ON profiles FOR UPDATE
  USING (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Migration complete!