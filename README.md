# WordTraitor 🎭

> **One word apart. One traitor among you.**

A real-time multiplayer social deduction word game where players receive almost identical words—except one player (the traitor) gets a slightly different word. Through clever hints and group voting, catch the WordTraitor before time runs out!

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

## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev
```

## 🗄️ Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL setup script from `supabase/setup.sql`
3. Copy your project URL and anon key to `.env`

### Database Schema

- `profiles` - User accounts and profiles
- `game_rooms` - Game lobbies/circles
- `room_participants` - Player tracking (public info)
- `round_secrets` - Role and word assignments (RLS protected)
- `game_hints` - Player hint submissions
- `game_votes` - Voting records

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

## 🚢 Development Roadmap

### Phase 1: MVP (Months 1-3)
- [x] Project setup
- [ ] User authentication
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

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md first.

## 📞 Contact

For questions or feedback, open an issue or reach out to the team.

---

**Built with ❤️ for social deduction game lovers**