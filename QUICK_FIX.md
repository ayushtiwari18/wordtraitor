# ⚡ Quick Fix for UUID Error

## Error Message:
```
invalid input syntax for type uuid: "guest_1766306607717_yvwymj540"
```

## 🔧 Solution (5 minutes):

### **Step 1: Go to Supabase SQL Editor**
1. Open your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### **Step 2: Copy & Run This SQL**

Paste this entire block and click **RUN**:

```sql
-- Quick Fix: Convert UUID columns to TEXT for anonymous users

-- Drop foreign key constraints
ALTER TABLE game_rooms DROP CONSTRAINT IF EXISTS game_rooms_host_id_fkey;
ALTER TABLE room_participants DROP CONSTRAINT IF EXISTS room_participants_user_id_fkey;
ALTER TABLE round_secrets DROP CONSTRAINT IF EXISTS round_secrets_user_id_fkey;
ALTER TABLE game_hints DROP CONSTRAINT IF EXISTS game_hints_user_id_fkey;
ALTER TABLE game_votes DROP CONSTRAINT IF EXISTS game_votes_voter_id_fkey;
ALTER TABLE game_votes DROP CONSTRAINT IF EXISTS game_votes_target_id_fkey;

-- Change UUID to TEXT
ALTER TABLE game_rooms ALTER COLUMN host_id TYPE TEXT;
ALTER TABLE room_participants ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE round_secrets ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE game_hints ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE game_votes ALTER COLUMN voter_id TYPE TEXT;
ALTER TABLE game_votes ALTER COLUMN target_id TYPE TEXT;

-- Update RLS policies
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON game_rooms;
CREATE POLICY "Anyone can create rooms" ON game_rooms FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can join rooms" ON room_participants;
CREATE POLICY "Anyone can join rooms" ON room_participants FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can submit their own hints" ON game_hints;
CREATE POLICY "Anyone can submit hints" ON game_hints FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can submit their own vote" ON game_votes;
CREATE POLICY "Anyone can vote" ON game_votes FOR INSERT WITH CHECK (true);
```

### **Step 3: Verify**
You should see:
```
Success. No rows returned
```

### **Step 4: Refresh Your App**
- Go back to your application
- Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- Try creating a room again

## ✅ Fixed!

Your app should now work with anonymous guest users.

---

## 💡 What This Does:

- Changes `user_id` columns from `UUID` to `TEXT`
- Removes foreign key constraints to `auth.users` table
- Updates security policies for anonymous access
- Allows guest IDs like `guest_1766306607717_yvwymj540`

---

## 📞 Still Not Working?

1. **Check browser console** (F12) for errors
2. **Verify environment variables** in `.env` file
3. **Enable Realtime** in Supabase Dashboard → Database → Replication
4. **See full setup guide**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

**That's it!** You should now be able to create and join rooms. 🎮