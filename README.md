# WordTraitor 🎭

> **One word apart. One traitor among you.**

A real-time multiplayer social deduction word game where players receive almost identical words—except one player (the traitor) gets a slightly different word. Through clever hints and group voting, catch the WordTraitor before time runs out!

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

1. **The Whisper**: Everyone receives a secret word (e.g., "Ocean")—except the traitor gets "Sea"
2. **The Hint Drop**: Each player gives a one-line hint about their word
3. **The Debate**: Discuss and identify who sounds suspicious (2 minutes)
4. **The Verdict**: Vote to eliminate the suspected traitor
5. **The Reveal**: Did you catch them?

**Win Conditions**:
- **Word Keepers**: Catch the traitor by voting them out
- **WordTraitor**: Survive until only 2 players remain

## 🚀 Tech Stack

- **Frontend**: React 18 + Vite
- **State Management**: Zustand
- **Backend**: Supabase (Auth, Database, Real-time)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Testing**: Cypress

## 📦 Quick Start

### Prerequisites
- **Node.js 20 LTS** (or Node 18 with special setup - see [INSTALL_NODE18.md](./INSTALL_NODE18.md))
- npm or yarn
- A Supabase account (free tier works!)

### Installation

```bash
# Clone the repository
git clone https://github.com/ayushtiwari18/wordtraitor.git
cd wordtraitor

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

**For detailed setup instructions, see [QUICKSTART.md](./QUICKSTART.md)**

## 🗄️ Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL setup script from `supabase/setup.sql`
3. Run the functions script from `supabase/functions.sql`
4. Copy your project URL and anon key to `.env`

### Database Schema

- `profiles` - User accounts and profiles
- `game_rooms` - Game lobbies/circles
- `room_participants` - Player tracking (public info)
- `round_secrets` - Role and word assignments (RLS protected)
- `game_hints` - Player hint submissions
- `game_votes` - Voting records
- `word_pairs` - Word database with 17+ seed pairs

## 🎨 Design Tokens

- **Background**: `#0D0D0D` (dark)
- **Accent 1**: `#00FFFF` (neon cyan)
- **Accent 2**: `#8A2BE2` (purple)
- **Typography**: Poppins (headings), Open Sans (body)

## 🎯 Features

- ✅ Real-time multiplayer (WebSocket)
- ✅ Multiple game modes (Silent, Real, Flash, After Dark)
- ✅ Secure role assignment with Row Level Security
- ✅ Animated gradient backgrounds
- ✅ Responsive mobile-first design
- ✅ Achievements and progression
- ✅ Customizable word packs

## 📁 Project Structure

```
src/
├── app/              # Route components and pages
├── components/       # Reusable UI components
├── features/         # Feature-specific components
├── hooks/            # Custom React hooks
├── lib/              # Utilities and configs
├── store/            # Zustand state management
├── styles/           # Global styles
└── main.jsx          # App entry point
```

## 🧪 Testing

```bash
# Open Cypress test runner
npm run test

# Run tests in CI mode
npm run test:ci
```

## 🛠️ Troubleshooting

### Node.js Version Issues
If you see warnings about "Unsupported engine" or "EBADENGINE":
- **Solution 1 (Recommended)**: Upgrade to Node 20 LTS
- **Solution 2**: Follow [INSTALL_NODE18.md](./INSTALL_NODE18.md) for Node 18 compatibility fix

### Installation Hangs or Freezes
```bash
# Clear cache and try again
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Supabase Connection Issues
- Verify your `.env` file has correct credentials
- Check Supabase project is active and not paused
- Ensure RLS policies are enabled (run `supabase/setup.sql`)

## 🚢 Development Roadmap

### Phase 1: MVP (Months 1-3)
- [x] Project setup
- [x] Database schema with RLS
- [x] Authentication system
- [ ] Core game loop (5 phases)
- [ ] Silent Circle mode
- [ ] Basic word packs
- [ ] Leaderboard

### Phase 2: Alpha (Months 4-5)
- [ ] Real Circle mode
- [ ] Flash Round mode
- [ ] Cosmetics store
- [ ] Achievements
- [ ] Analytics dashboard

### Phase 3: Beta (Months 6-7)
- [ ] After Dark mode
- [ ] Battle Pass system
- [ ] Payment integration
- [ ] Power-ups
- [ ] Beta testing

### Phase 4: Launch (Month 8+)
- [ ] Public launch
- [ ] Marketing campaigns
- [ ] Community tournaments
- [ ] Seasonal content

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup guide
- **[DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md)** - Detailed progress tracker
- **[INSTALL_NODE18.md](./INSTALL_NODE18.md)** - Node 18 compatibility guide

## 🔐 Security

- Row Level Security (RLS) on all tables
- Server-side game logic functions
- Protected routes with auth guards
- Secure Supabase client configuration
- Players can only see their own secret word

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 📞 Contact

For questions or feedback, open an issue or reach out to the team.

---

**Built with ❤️ for social deduction game lovers**

**Repository**: [github.com/ayushtiwari18/wordtraitor](https://github.com/ayushtiwari18/wordtraitor)