# Supabase Setup Guide

## 🚀 Complete Real-Time Game Implementation

This guide will help you set up Supabase for the WordTraitor game with **full real-time multiplayer** support.

---

## Prerequisites

- Node.js 20+ installed
- A Supabase account ([Sign up free](https://supabase.com))
- Git
- A code editor

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in the details:
   - **Project Name**: `wordtraitor` (or any name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier works great for testing
4. Click **"Create New Project"**
5. Wait 1-2 minutes for project setup to complete

---

## Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. You'll see two important values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6...` (very long string)
3. **Keep these safe!** You'll need them in the next step

---

## Step 3: Configure Environment Variables

1. In your project root, create a file called `.env`
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Replace with your actual values from Step 2
4. **IMPORTANT**: Never commit `.env` to Git (it's already in `.gitignore`)

### Example `.env` file:
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMDAwMDAwMCwiZXhwIjoxOTQ1NTc2MDAwfQ.example_signature_here
```

---

## Step 4: Run Database Setup Script

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase/setup.sql` from this repository
4. Paste it into the SQL Editor
5. Click **"Run"** (bottom right)
6. You should see: ✅ **"Success. No rows returned"**

### What This Script Does:
- Creates 6 tables (game_rooms, room_participants, round_secrets, game_hints, game_votes, word_pairs)
- Sets up Row Level Security (RLS) policies for anonymous access
- Seeds 50+ word pairs across 5 categories
- Creates indexes for performance
- Enables real-time subscriptions

---

## Step 5: Verify Database Setup

1. Go to **Table Editor** in Supabase
2. You should see 6 tables:
   - `game_rooms`
   - `room_participants`
   - `round_secrets`
   - `game_hints`
   - `game_votes`
   - `word_pairs`
3. Click on `word_pairs` - you should see 50+ rows of word combinations

---

## Step 6: Enable Realtime

1. Go to **Database** → **Replication**
2. Find these 4 tables and enable replication:
   - ✅ `game_rooms`
   - ✅ `room_participants`
   - ✅ `game_hints`
   - ✅ `game_votes`
3. **DO NOT** enable `round_secrets` (for security)
4. Click **Save** for each table

### Why Realtime?
This allows players to see:
- New players joining the lobby instantly
- Hints appearing in real-time during gameplay
- Votes being cast live
- Game phase transitions synchronized

---

## Step 7: Install Dependencies

```bash
cd wordtraitor
npm install
```

This installs:
- `@supabase/supabase-js` - Supabase client
- All other project dependencies

---

## Step 8: Start Development Server

```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## Step 9: Test the Game

### Single Browser Test:
1. Open http://localhost:5173
2. Enter a username
3. Click "Create Circle"
4. Choose settings and create room
5. You should see the lobby with your username

### Multi-Player Test (Same Computer):
1. Open a **regular** browser window (Chrome)
2. Open an **incognito** window (Chrome Incognito)
3. Open a **different browser** (Firefox)
4. In window 1: Create a room, note the 6-digit code
5. In windows 2 & 3: Join using the code
6. All 3 windows should show the same lobby in real-time!

### Test Real-Time Features:
- Join/leave players → Updates instantly
- Host starts game → All players navigate to game page
- Submit hints → Everyone sees them appear
- Cast votes → Live vote counter updates

---

## 🎮 Game Flow Overview

### 1. **Home Page**
- Enter username (stored in localStorage)
- Create or join room

### 2. **Lobby**
- Wait for 4+ players
- Host can start game
- Real-time player list

### 3. **Game** (5 Phases)

#### Phase 1: WHISPER (30s)
- Players see their secret word
- One player has different word (traitor)

#### Phase 2: HINT DROP (60s)
- Submit one-line hint about word
- Hints appear in real-time for all

#### Phase 3: DEBATE (120s)
- View all hints
- Discuss who's suspicious

#### Phase 4: VERDICT (45s)
- Vote for who you think is the traitor
- Live vote counter

#### Phase 5: REVEAL (15s)
- See vote results
- Player with most votes eliminated
- Check win conditions

### 4. **Results**
- Winner announcement (Citizens or Traitor)
- Traitor reveal
- Final standings
- Play again option

---

## 🔧 Troubleshooting

### "Supabase not configured" Error
**Problem**: Missing or incorrect `.env` file

**Solution**:
1. Check `.env` file exists in project root
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
3. Restart dev server: `Ctrl+C` then `npm run dev`

### "Room not found" Error
**Problem**: Database not set up or tables missing

**Solution**:
1. Go to Supabase SQL Editor
2. Re-run `supabase/setup.sql`
3. Check Table Editor for 6 tables

### Real-Time Not Working
**Problem**: Replication not enabled

**Solution**:
1. Go to Database → Replication
2. Enable for: `game_rooms`, `room_participants`, `game_hints`, `game_votes`
3. Wait 30 seconds for changes to apply

### "Failed to create room" Error
**Problem**: RLS policies not set correctly

**Solution**:
1. Go to Authentication → Policies
2. Check each table has "Anyone can..." policies
3. Re-run `supabase/setup.sql` if missing

### Players Not Syncing
**Problem**: Real-time subscription failed

**Solution**:
1. Open browser console (F12)
2. Look for WebSocket errors
3. Check internet connection
4. Verify Supabase project is active

---

## 📊 Database Schema

### game_rooms
- Stores room information (code, host, status, settings)
- Real-time enabled

### room_participants
- Tracks who's in each room
- Real-time enabled
- `is_alive` field for elimination tracking

### round_secrets
- Protected table (NOT real-time)
- Stores each player's role (CITIZEN/TRAITOR) and secret word
- Only visible to owner

### game_hints
- Players' submitted hints
- Real-time enabled

### game_votes
- Voting records
- Real-time enabled
- One vote per player per round

### word_pairs
- Main word and traitor word combinations
- Categorized by difficulty and pack
- 50+ pre-seeded pairs

---

## 🔐 Security Notes

### Anonymous Users
- No authentication required
- Users identified by `guestId` (localStorage)
- Guest IDs are random UUIDs

### RLS Policies
- **Open access** for all tables (anonymous game)
- `round_secrets` only readable by owner
- No write restrictions (trust-based multiplayer)

### Production Considerations
- Add rate limiting in Supabase dashboard
- Enable CORS for your domain
- Consider adding room passwords for private games
- Implement ban system for toxic players

---

## 🚀 Deployment

### Deploy to Vercel
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### Deploy to Netlify
1. Build command: `npm run build`
2. Publish directory: `dist`
3. Add environment variables in Netlify dashboard

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Realtime Guide](https://supabase.com/docs/guides/realtime)
- [React Documentation](https://react.dev)
- [Zustand State Management](https://github.com/pmndrs/zustand)

---

## ✅ Success Checklist

- [ ] Supabase project created
- [ ] API keys copied to `.env`
- [ ] Database setup script executed
- [ ] 6 tables visible in Table Editor
- [ ] Word pairs seeded (50+ rows)
- [ ] Realtime enabled for 4 tables
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)
- [ ] Can create room and see lobby
- [ ] Can join room from incognito window
- [ ] Real-time updates working
- [ ] Can start game (4+ players)
- [ ] All 5 game phases working
- [ ] Results page shows correctly

---

## 🎉 You're Ready!

If all checklist items are complete, your WordTraitor game is **fully functional** with real-time multiplayer! 

Invite friends, share the room code, and start catching traitors! 🎭

---

**Need Help?** Open an issue on GitHub with:
- Error messages (from browser console)
- Screenshots of Supabase dashboard
- Steps to reproduce the problem