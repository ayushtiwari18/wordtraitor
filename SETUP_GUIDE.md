# 🚀 WordTraitor Setup Guide

## ⚠️ IMPORTANT: Run Database Migrations First!

Before running the application, you **MUST** execute these SQL migrations in your Supabase SQL Editor.

---

## 📋 Step-by-Step Setup

### **Step 1: Run Database Migrations**

Go to your Supabase project → SQL Editor → New Query

#### **Migration 1: Initial Setup**
Copy and paste the entire content from:
```
supabase/setup.sql
```
Click **RUN** ✅

#### **Migration 2: Add Username Support**
Copy and paste the entire content from:
```
supabase/migration_add_username.sql
```
Click **RUN** ✅

#### **Migration 3: Fix Anonymous Users (CRITICAL)**
Copy and paste the entire content from:
```
supabase/migration_fix_anonymous.sql
```
Click **RUN** ✅

**This fixes the UUID error you encountered!**

#### **Migration 4: Optional Profiles**
Copy and paste the entire content from:
```
supabase/migration_optional_profiles.sql
```
Click **RUN** ✅

---

### **Step 2: Enable Realtime**

In your Supabase Dashboard:

1. Go to **Database** → **Replication**
2. Enable replication for these tables:
   - ✅ `game_rooms`
   - ✅ `room_participants`
   - ✅ `game_hints`
   - ✅ `game_votes`
3. Click **Save**

---

### **Step 3: Install Dependencies**

```bash
npm install
npm install canvas-confetti lucide-react
```

---

### **Step 4: Environment Variables**

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**
- Go to Supabase Dashboard → Project Settings → API
- Copy **Project URL** → `VITE_SUPABASE_URL`
- Copy **anon/public** key → `VITE_SUPABASE_ANON_KEY`

---

### **Step 5: Run the Application**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🎮 Testing the Game

### **Single Browser Test:**
1. Create a room
2. Open another tab in **Incognito/Private mode**
3. Join with the room code
4. Add a 3rd player (another incognito tab)
5. Start the game from host tab

### **Multi-Device Test:**
1. Create room on Device 1
2. Share room code via QR or text
3. Join from Device 2 and Device 3
4. Test real-time sync

---

## 🔍 Troubleshooting

### **Problem: "invalid input syntax for type uuid"**
✅ **Solution:** Run `migration_fix_anonymous.sql` (Step 1, Migration 3)

### **Problem: "relation does not exist"**
✅ **Solution:** Run `setup.sql` first (Step 1, Migration 1)

### **Problem: Real-time not working**
✅ **Solution:** 
1. Check Supabase Replication is enabled (Step 2)
2. Verify tables are in the publication list
3. Check browser console for websocket errors

### **Problem: Players not syncing**
✅ **Solution:**
1. Hard refresh browser (Ctrl+F5)
2. Check internet connection
3. Verify Supabase project is active

### **Problem: Can't submit hints/votes**
✅ **Solution:**
1. Ensure all migrations are run
2. Check browser console for errors
3. Verify RLS policies are updated

---

## 📊 Database Schema Overview

After running all migrations, your database will have:

### **Tables:**
- `profiles` - Guest user profiles (optional)
- `game_rooms` - Game lobbies
- `room_participants` - Players in rooms
- `round_secrets` - Secret words (protected)
- `game_hints` - Submitted hints
- `game_votes` - Voting records
- `word_pairs` - 70+ word combinations

### **Key Changes for Anonymous Users:**
- All `user_id` fields changed from `UUID` to `TEXT`
- Foreign key constraints to `auth.users` removed
- RLS policies updated for anonymous access
- Guest IDs format: `guest_timestamp_randomstring`

---

## 🎯 Game Flow

1. **Lobby** → Players join (3-8 players)
2. **Whisper** (30s) → See secret word
3. **Hint Drop** (60s) → Submit one-word hint
4. **Debate** (120s) → Review hints
5. **Verdict** (45s) → Vote for traitor
6. **Reveal** (15s) → See elimination
7. **Check Win** → Game ends or new round starts
8. **Results** → Winner announcement

---

## 🔐 Security Notes

- Guest IDs are stored in localStorage
- Secret words are query-filtered client-side
- RLS enabled but simplified for anonymous play
- For production: Consider adding rate limiting

---

## 📦 Word Packs Available

- **GENERAL** (17 pairs) - Everyday words
- **MOVIES** (8 pairs) - Film industry terms
- **TECH** (10 pairs) - Technology words
- **FOOD** (10 pairs) - Culinary terms
- **NATURE** (10 pairs) - Natural world
- **SPORTS** (10 pairs) - Athletic activities

---

## 🐛 Known Issues

1. **First migration might show warnings** - Ignore DROP CONSTRAINT warnings
2. **Confetti might not show** - Install canvas-confetti package
3. **Mobile voting UI** - Ensure viewport is scrollable

---

## 🚀 Deployment Checklist

- [ ] All 4 migrations executed
- [ ] Realtime enabled for 4 tables
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Test with 3+ players
- [ ] Check mobile responsiveness
- [ ] Verify real-time sync
- [ ] Test win conditions

---

## 📞 Need Help?

Check logs in:
1. Browser DevTools Console (F12)
2. Network tab for API errors
3. Supabase Dashboard → Logs

---

**Happy Gaming! 🎮** May the best detective win! 🕵️