# 🕵️ WordTraitor - Real-Time Multiplayer Word Game

A social deduction word game built with React, Supabase, and real-time multiplayer support. Find the traitor before it's too late!

## ⚡ Quick Start

### **1. Clone & Install**
```bash
git clone https://github.com/ayushtiwari18/wordtraitor.git
cd wordtraitor
npm install
npm install canvas-confetti lucide-react
```

### **2. Database Setup (CRITICAL)**

⚠️ **MUST DO THIS FIRST or you'll get UUID errors!**

1. Go to [Supabase Dashboard](https://supabase.com) → SQL Editor
2. Run these files **IN ORDER**:
   - [`supabase/setup.sql`](./supabase/setup.sql) - Initial schema
   - [`supabase/FIX_UUID_COMPLETE.sql`](./supabase/FIX_UUID_COMPLETE.sql) - **UUID fix (REQUIRED)**
   - [`supabase/migration_add_username.sql`](./supabase/migration_add_username.sql) - Add word packs

3. Enable **Realtime** in Database → Replication for:
   - `game_rooms`
   - `room_participants` 
   - `game_hints`
   - `game_votes`

### **3. Environment Setup**

Create `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### **4. Run**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## 🎮 How to Play

### **Setup**
- 3-8 players required
- One player creates a room, others join with 6-digit code
- Choose word pack (GENERAL, MOVIES, TECH, FOOD, NATURE, SPORTS)

### **Game Flow**

1. **👂 WHISPER (30s)** - See your secret word
   - Citizens get the same word
   - Traitor gets a different but related word

2. **💬 HINT DROP (60s)** - Submit a one-word hint
   - Be specific but not obvious
   - Traitor must blend in

3. **🗣️ DEBATE (120s)** - Discuss the hints
   - Look for suspicious hints
   - Question other players

4. **⚖️ VERDICT (45s)** - Vote for the traitor
   - Most votes = eliminated
   - Dead players can't vote

5. **💀 REVEAL (15s)** - See who was eliminated
   - Check win conditions
   - Continue or end game

### **Win Conditions**
- **Citizens win:** Eliminate the traitor
- **Traitor wins:** Survive until ≤2 players remain

---

## 🔧 Troubleshooting

### **❌ Error: "invalid input syntax for type uuid"**

**Fix:** Run [`supabase/FIX_UUID_COMPLETE.sql`](./supabase/FIX_UUID_COMPLETE.sql)

**See:** [QUICK_FIX.md](./QUICK_FIX.md) for detailed steps

### **❌ Error: "relation does not exist"**

**Fix:** Run [`supabase/setup.sql`](./supabase/setup.sql) first

### **❌ Real-time not working**

1. Enable Realtime in Supabase Dashboard
2. Check browser console for websocket errors
3. Verify Supabase credentials in `.env`

### **❌ Players not syncing**

1. Hard refresh (Ctrl+F5)
2. Check internet connection  
3. Verify all SQL migrations ran successfully

**Full Guide:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

## 📊 Tech Stack

- **Frontend:** React 18 + Vite
- **State:** Zustand
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Backend:** Supabase (PostgreSQL + Realtime)
- **Database:** PostgreSQL with Row Level Security

---

## 🎯 Features

✅ **Real-time multiplayer** - Instant sync across all devices  
✅ **Anonymous play** - No login required  
✅ **5 game phases** - Complete social deduction flow  
✅ **6 word packs** - 70+ word pairs  
✅ **Mobile responsive** - Play on any device  
✅ **Animations** - Smooth transitions with Framer Motion  
✅ **Vote system** - Democratic traitor elimination  
✅ **Win detection** - Automatic game end conditions  

---

## 📝 Game Architecture

```
Home Page
   ↓
   └─ Create Room → Lobby (Host)
   └─ Join Room → Lobby (Guest)
          ↓
      Game Phases
          ↓
   1. WHISPER (30s)
   2. HINT_DROP (60s)  
   3. DEBATE (120s)
   4. VERDICT (45s)
   5. REVEAL (15s)
          ↓
   Check Win Conditions
          ↓
     Results Page
```

---

## 📦 Word Packs

| Pack | Pairs | Example |
|------|-------|----------|
| **GENERAL** | 17 | Ocean/Sea, Piano/Guitar |
| **MOVIES** | 8 | Actor/Director, Comedy/Drama |
| **TECH** | 10 | Python/JavaScript, Cloud/Server |
| **FOOD** | 10 | Pizza/Burger, Coffee/Tea |
| **NATURE** | 10 | Tiger/Lion, Mountain/Hill |
| **SPORTS** | 10 | Tennis/Badminton, Boxing/Wrestling |

---

## 📁 Project Structure

```
src/
├── app/
│   └── pages/
│       ├── Home.jsx         # Room create/join
│       ├── Lobby.jsx        # Player waiting room
│       ├── Game.jsx         # Main game orchestrator
│       └── Results.jsx      # Winner announcement
├── components/
│   └── game/
│       ├── WhisperPhase.jsx
│       ├── HintDropPhase.jsx
│       ├── DebatePhase.jsx
│       ├── VerdictPhase.jsx
│       └── RevealPhase.jsx
├── lib/
│   └── supabase.js      # DB helpers + realtime
└── store/
    └── gameStore.js     # Zustand state management

supabase/
├── setup.sql                      # Initial schema
├── FIX_UUID_COMPLETE.sql          # UUID fix (REQUIRED)
├── migration_add_username.sql     # Word packs
└── migration_optional_profiles.sql
```

---

## 🔐 Security

- Anonymous guest system with localStorage IDs
- Row Level Security (RLS) enabled
- Secret words filtered client-side
- Real-time subscriptions scoped by room
- No authentication required

---

## 🚀 Deployment

### **Vercel / Netlify**
1. Connect GitHub repo
2. Add environment variables
3. Deploy

### **Environment Variables**
```
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📝 License

MIT License - see [LICENSE](LICENSE)

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/ayushtiwari18/wordtraitor/issues)
- **Docs:** [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Quick Fix:** [QUICK_FIX.md](./QUICK_FIX.md)

---

## ⭐ Features Coming Soon

- [ ] Sound effects
- [ ] Achievements system
- [ ] Anonymous leaderboard
- [ ] Custom word packs
- [ ] Voice chat integration
- [ ] Mobile app (React Native)

---

**Built with ❤️ by [Ayush Tiwari](https://github.com/ayushtiwari18)**

**Happy Gaming! 🎮 May the best detective win! 🕵️**