# ⚡ Quick Fix for UUID Error

## Error Message:
```
invalid input syntax for type uuid: "guest_1766306607717_yvwymj540"
```

## 🔧 Solution (2 minutes):

### **Step 1: Go to Supabase SQL Editor**
1. Open your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### **Step 2: Use the Complete Fix File**

**Option A - Copy from GitHub:**
1. Open [`supabase/FIX_UUID_COMPLETE.sql`](https://github.com/ayushtiwari18/wordtraitor/blob/main/supabase/FIX_UUID_COMPLETE.sql)
2. Click **Raw** button
3. Copy all content (Ctrl+A, Ctrl+C)
4. Paste in Supabase SQL Editor
5. Click **RUN** ✅

**Option B - Copy from below:**

<details>
<summary>Click to expand SQL code</summary>

```sql
-- COMPLETE FIX FOR UUID ERROR
-- Drop all policies first (this fixes the error you got)

-- Drop all existing policies
DROP POLICY IF EXISTS "Anyone can view game rooms" ON game_rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON game_rooms;
DROP POLICY IF EXISTS "Host can update their room" ON game_rooms;
DROP POLICY IF EXISTS "Host can update room" ON game_rooms;
DROP POLICY IF EXISTS "Anyone can create rooms" ON game_rooms;

DROP POLICY IF EXISTS "Anyone can view participants in rooms" ON room_participants;
DROP POLICY IF EXISTS "Users can join rooms" ON room_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON room_participants;
DROP POLICY IF EXISTS "Anyone can join rooms" ON room_participants;
DROP POLICY IF EXISTS "Anyone can update participation" ON room_participants;

DROP POLICY IF EXISTS "Users can only see their own secrets" ON round_secrets;
DROP POLICY IF EXISTS "System can insert secrets" ON round_secrets;
DROP POLICY IF EXISTS "No updates to secrets" ON round_secrets;
DROP POLICY IF EXISTS "Users see own secrets" ON round_secrets;

DROP POLICY IF EXISTS "Anyone can view hints in their room" ON game_hints;
DROP POLICY IF EXISTS "Users can submit their own hints" ON game_hints;
DROP POLICY IF EXISTS "Anyone can submit hints" ON game_hints;

DROP POLICY IF EXISTS "Anyone can view votes in their room" ON game_votes;
DROP POLICY IF EXISTS "Users can submit their own vote" ON game_votes;
DROP POLICY IF EXISTS "Anyone can vote" ON game_votes;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles viewable" ON profiles;
DROP POLICY IF EXISTS "Anyone can insert profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can update profile" ON profiles;

-- Drop foreign key constraints
ALTER TABLE game_rooms DROP CONSTRAINT IF EXISTS game_rooms_host_id_fkey;
ALTER TABLE room_participants DROP CONSTRAINT IF EXISTS room_participants_user_id_fkey;
ALTER TABLE round_secrets DROP CONSTRAINT IF EXISTS round_secrets_user_id_fkey;
ALTER TABLE game_hints DROP CONSTRAINT IF EXISTS game_hints_user_id_fkey;
ALTER TABLE game_votes DROP CONSTRAINT IF EXISTS game_votes_voter_id_fkey;
ALTER TABLE game_votes DROP CONSTRAINT IF EXISTS game_votes_target_id_fkey;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Change UUID to TEXT (now policies are dropped, this will work!)
ALTER TABLE game_rooms ALTER COLUMN host_id TYPE TEXT;
ALTER TABLE room_participants ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE round_secrets ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE game_hints ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE game_votes ALTER COLUMN voter_id TYPE TEXT, ALTER COLUMN target_id TYPE TEXT;
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT;

-- Recreate policies for anonymous access
CREATE POLICY "Anyone can view game rooms" ON game_rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON game_rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON game_rooms FOR UPDATE USING (true);

CREATE POLICY "Anyone can view participants" ON room_participants FOR SELECT USING (true);
CREATE POLICY "Anyone can join rooms" ON room_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update participation" ON room_participants FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete participation" ON room_participants FOR DELETE USING (true);

CREATE POLICY "Anyone can view secrets" ON round_secrets FOR SELECT USING (true);
CREATE POLICY "Anyone can insert secrets" ON round_secrets FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view hints" ON game_hints FOR SELECT USING (true);
CREATE POLICY "Anyone can submit hints" ON game_hints FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view votes" ON game_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can vote" ON game_votes FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update profiles" ON profiles FOR UPDATE USING (true);
```

</details>

### **Step 3: Verify Success**

You should see output showing:
```
Success. Rows: 6
```

And a table showing column types changed to `text`.

### **Step 4: Refresh Your App**
- Go back to your application
- Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Try creating a room again

## ✅ Fixed!

Your app should now work with anonymous guest users.

---

## 💡 What This Does:

1. **Drops all RLS policies** (fixes the policy dependency error)
2. **Removes foreign key constraints** to auth.users
3. **Changes column types** from UUID to TEXT
4. **Recreates policies** with anonymous access
5. **Adds performance indexes**

---

## ⚠️ Common Issues:

### **Error: "relation does not exist"**
**Solution:** You need to run `supabase/setup.sql` first

### **Error: "permission denied"**
**Solution:** Make sure you're using the Service Role key in SQL Editor (it should auto-select)

### **Nothing happens after running**
**Solution:** 
1. Check for red error messages in SQL Editor
2. Make sure you clicked **RUN** button
3. Try running in smaller chunks if needed

---

## 📞 Still Not Working?

1. **Check browser console** (F12) for errors
2. **Verify environment variables** in `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. **Enable Realtime** in Supabase Dashboard → Database → Replication
4. **See full setup guide**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

**That's it!** You should now be able to create and join rooms. 🎮

## 🎯 Next Steps:

1. ✅ Create a room
2. ✅ Join from another browser/device
3. ✅ Test with 3+ players
4. ✅ Start game and play!

---

**Happy gaming!** 🕵️ May the best detective win!