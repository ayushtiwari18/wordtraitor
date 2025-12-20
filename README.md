# WordTraitor 🎭

> **One word apart. One traitor among you.**

A real-time multiplayer social deduction word game where players receive almost identical words—except one player (the traitor) gets a slightly different word. Through clever hints and group voting, catch the WordTraitor before time runs out!

## ✨ **NO LOGIN REQUIRED**

**Just enter a username and play!** No signup, no email, no password. Maximum privacy, instant gameplay. 🚀

Read more: [ANONYMOUS_FLOW.md](./ANONYMOUS_FLOW.md)

## ⚠️ IMPORTANT: Node.js Version

**If you're using Node.js 18**, please read **[INSTALL_NODE18.md](./INSTALL_NODE18.md)** for special installation instructions.

**Recommended:** Use Node.js 20 LTS for the best experience.

```bash
# Check your Node version
node -v

# If v18.x.x, follow INSTALL_NODE18.md
# If v20.x.x or higher, continue below
```

## 🎮 Game Overview

**WordTraitor** combines word-based psychology, bluffing, and group discussion. Think *Among Us* meets word games!

### How to Play

1. **Enter Username**: Choose your username (no signup needed!)
2. **The Whisper**: Everyone receives a secret word (e.g., "Ocean")—except the traitor gets "Sea"
3. **The Hint Drop**: Each player gives a one-line hint about their word
4. **The Debate**: Discuss and identify who sounds suspicious (2 minutes)
5. **The Verdict**: Vote to eliminate the suspected traitor
6. **The Reveal**: Did you catch them?

**Win Conditions**:
- **Word Keepers**: Catch the traitor by voting them out
- **WordTraitor**: Survive until only 2 players remain

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite
- **State Management**: Zustand (guest system + game state)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Storage**: localStorage (no backend needed for MVP)
- **Real-time** (Future): Supabase (optional)

## 📦 Quick Start

### Prerequisites
- **Node.js 20 LTS** (or Node 18 with special setup - see [INSTALL_NODE18.md](./INSTALL_NODE18.md))
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/ayushtiwari18/wordtraitor.git
cd wordtraitor

# Install dependencies
npm install

# Run development server
npm run dev
```

**That's it!** Open http://localhost:3000 and start playing. No database setup needed for local development.

**For detailed setup instructions, see [QUICKSTART.md](./QUICKSTART.md)**

## ✨ Key Features

### 👤 Anonymous Gameplay
- ✅ **No authentication required**
- ✅ Username-only system
- ✅ Maximum privacy (no email, no password)
- ✅ Instant play
- ✅ Data stored only in browser

### 🎮 Game Features
- ✅ Multiple game modes (Silent, Real, Flash, After Dark)
- ✅ Customizable difficulty levels
- ✅ Multiple word packs (General, Movies, Tech, etc.)
- ✅ Room-based multiplayer (4-12 players)
- ✅ 6-character room codes
- ✅ Animated gradient backgrounds
- ✅ Responsive mobile-first design

### 🎨 UI/UX
- ✅ Neon cyan/purple theme
- ✅ Smooth Framer Motion animations
- ✅ Auto-generated avatars
- ✅ Sound & particle toggles
- ✅ Toast notifications

## 📁 Project Structure

```
src/
├── app/
│   ├── App.jsx           # Main router (no auth)
│   └── pages/
│       ├── Home.jsx       # Landing + username modal
│       ├── Lobby.jsx      # Room lobby
│       ├── Game.jsx       # Gameplay (in progress)
│       ├── Results.jsx    # Winner screen
│       └── Settings.jsx   # Preferences
├── components/       # Reusable UI components
├── store/
│   ├── guestStore.js  # Anonymous user management
│   ├── gameStore.js   # Game state
│   └── uiStore.js     # UI preferences
├── lib/              # Utilities and configs
├── styles/           # Global styles
└── main.jsx          # App entry point
```

## 🎨 Design Tokens

- **Background**: `#0D0D0D` (dark)
- **Card**: `#1A1A1A` (dark-card)
- **Accent 1**: `#00FFFF` (neon cyan)
- **Accent 2**: `#8A2BE2` (purple)
- **Typography**: Poppins (headings), Open Sans (body)

## 🔐 Privacy & Data

### What's Stored (localStorage only)
- Username (chosen by user)
- Guest ID (random generated)
- Sound/particle preferences
- Current room data (temporary)

### What's NOT Stored
- ❌ No email addresses
- ❌ No passwords  
- ❌ No personal information
- ❌ No tracking
- ❌ No cookies
- ❌ No server-side accounts

**100% anonymous gameplay!**

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Tech Decisions

**Why localStorage instead of database for MVP?**
- ✅ Faster development
- ✅ No backend complexity
- ✅ True privacy (no data leaves browser)
- ✅ Easy to test locally
- ✅ Can add Supabase later without breaking changes

**Why anonymous instead of authentication?**
- ✅ Lower barrier to entry
- ✅ Faster onboarding
- ✅ Better privacy
- ✅ Simpler codebase
- ✅ Can add optional accounts later

## 🚢 Development Roadmap

### Phase 1: MVP (Current)
- [x] Project setup
- [x] Anonymous guest system
- [x] Home page with username modal
- [x] Lobby page with room codes
- [ ] Core game loop (5 phases)
- [ ] Voting system
- [ ] Results screen
- [ ] Basic word packs

### Phase 2: Multiplayer (Next)
- [ ] Integrate Supabase real-time
- [ ] Live player sync
- [ ] Real-time hint submissions
- [ ] Real-time voting
- [ ] Phase synchronization

### Phase 3: Polish
- [ ] Sound effects
- [ ] Particle effects
- [ ] Achievements
- [ ] Leaderboard (anonymous)
- [ ] Mobile optimization

### Phase 4: Optional Features
- [ ] Optional account system
- [ ] Cross-device sync
- [ ] Friend system
- [ ] Match history
- [ ] Premium word packs

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup guide
- **[ANONYMOUS_FLOW.md](./ANONYMOUS_FLOW.md)** - Anonymous gameplay flow
- **[INSTALL_NODE18.md](./INSTALL_NODE18.md)** - Node 18 compatibility
- **[DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md)** - Detailed progress

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 📞 Contact

For questions or feedback, open an issue or reach out to the team.

---

**Built with ❤️ for social deduction game lovers**

**No signup. No tracking. Just play.** 🎉

**Repository**: [github.com/ayushtiwari18/wordtraitor](https://github.com/ayushtiwari18/wordtraitor)