# WordTraitor Anonymous Flow

## 🎯 Overview

WordTraitor now uses a **completely anonymous, no-authentication** system. Players only need to enter a username to start playing - no email, no password, no signup required!

## 🚀 User Flow

### 1. Landing Page (Home)
- User visits the app
- No login/signup screen
- Direct access to home page with Create/Join options

### 2. First-Time User
- When user clicks "Create Circle" or "Join Circle" for the first time
- Modal appears asking for username (3-20 characters)
- Username is stored in browser localStorage
- Random guest ID is generated and stored
- Avatar is auto-generated using Dicebear API based on username

### 3. Returning User
- Username and guest ID are loaded from localStorage
- User can play immediately without re-entering username
- Username displayed in header
- Can change username anytime in Settings

### 4. Create Room
- User enters username (if not set)
- Chooses game settings:
  - Game Mode (Silent/Real/Flash/After Dark)
  - Difficulty (Easy/Medium/Hard)
  - Word Pack (General/Movies/Tech/etc.)
- 6-character room code is generated
- Room settings stored in localStorage
- User is redirected to Lobby

### 5. Join Room
- User enters username (if not set)
- Enters 6-character room code
- Validated and redirected to Lobby

### 6. Lobby
- Display room code with copy button
- Show game settings
- Player list with avatars
- Host can start game when 4+ players
- Non-hosts see "Waiting for host" message
- Leave room button returns to home

### 7. Game (In Progress)
- 5 phases: Whisper → Hint Drop → Debate → Verdict → Reveal
- Real-time gameplay
- Secret word assignment
- Voting system

### 8. Results
- Winner announcement
- Player statistics
- Play Again or Back to Home

## 🗄️ Data Storage

### localStorage (Browser)
```javascript
{
  "wordtraitor-guest": {
    "guestId": "guest_1234567890_abc123",
    "username": "Player123",
    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=Player123"
  },
  "pendingRoom": {
    "code": "ABC123",
    "settings": {
      "gameMode": "SILENT",
      "difficulty": "MEDIUM",
      "wordPack": "GENERAL"
    },
    "host": "Player123"
  }
}
```

### Supabase (Optional - Future Implementation)
When you integrate Supabase, the anonymous system will work seamlessly:
- `guestId` becomes the user identifier
- No authentication required
- Room data syncs in real-time
- All players are "anonymous" but have unique IDs

## 🎨 Guest Store (Zustand)

**Location**: `src/store/guestStore.js`

**State**:
```javascript
{
  guestId: string | null,        // Unique guest identifier
  username: string | null,       // Player's chosen username
  avatar: string | null          // Avatar URL from Dicebear
}
```

**Actions**:
- `initializeGuest()` - Create or load existing guest
- `setUsername(username)` - Set username and generate avatar
- `getGuest()` - Get current guest info
- `clearGuest()` - Clear guest (for changing username)

## 🔄 Migration from Auth System

### Removed Components
- ❌ `Auth.jsx` page
- ❌ `ProtectedRoute.jsx` component
- ❌ Supabase authentication
- ❌ Email/password login
- ❌ Session management

### Updated Components
- ✅ `App.jsx` - All routes now public
- ✅ `Home.jsx` - Username modal on first visit
- ✅ `Lobby.jsx` - Works with guest system
- ✅ `AppHeader.jsx` - Shows username instead of auth menu
- ✅ `Settings.jsx` - Change username option

### New Store
- ✅ `guestStore.js` - Manages anonymous users

### Preserved
- ✅ `gameStore.js` - Game state management
- ✅ `uiStore.js` - UI preferences
- ✅ All UI components
- ✅ All game logic

## 🔐 Privacy & Data

### What's Stored
- **Username**: Only in browser localStorage
- **Guest ID**: Random generated ID in localStorage
- **Preferences**: Sound/particle settings in localStorage
- **Room Data**: Temporary, cleared when leaving room

### What's NOT Stored
- ❌ No email addresses
- ❌ No passwords
- ❌ No personal information
- ❌ No tracking cookies
- ❌ No server-side user accounts

### Data Persistence
- Data stored only in user's browser
- Clearing browser data = fresh start
- No cross-device sync (by design)
- Fully anonymous gameplay

## 🎯 Advantages

### For Users
✅ **Instant Play**: No signup friction
✅ **Privacy**: No personal data collected
✅ **Simple**: Just username and play
✅ **Fast**: No authentication delays
✅ **Anonymous**: Play without identity

### For Developers
✅ **Simpler**: No auth complexity
✅ **Faster**: Skip authentication implementation
✅ **Cheaper**: No auth service costs
✅ **Scalable**: Stateless architecture
✅ **Focused**: More time on game features

## 🔮 Future Enhancements (Optional)

### Phase 1: Current (Anonymous)
- ✅ Username-only system
- ✅ localStorage persistence
- ✅ Instant play

### Phase 2: Optional Accounts (Future)
- 🔄 Add "Create Account" as optional feature
- 🔄 Keep anonymous play as default
- 🔄 Sync data across devices if logged in
- 🔄 Leaderboards for registered users

### Phase 3: Social Features (Future)
- 🔄 Friend system (optional)
- 🔄 Match history (if registered)
- 🔄 Achievements tracking
- 🔄 Profile customization

## 🛠️ Implementation Details

### Guest ID Format
```
guest_{timestamp}_{random9chars}
Example: guest_1703097600000_a7b3c9d2e
```

### Room Code Format
```
6 uppercase alphanumeric characters
Excludes confusing characters (0, O, 1, I)
Example: ABC123, XY4K7M
```

### Avatar Generation
```javascript
const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
// Generates unique avatar based on username
// Free, no API key needed
// Deterministic (same username = same avatar)
```

## 📋 Testing Checklist

### New User Flow
- [ ] First visit shows home page (no auth)
- [ ] Click Create/Join shows username modal
- [ ] Enter username (3+ chars) works
- [ ] Username saved to localStorage
- [ ] Avatar generated and displayed
- [ ] Can create/join room after username set

### Returning User Flow
- [ ] Reload page loads username from localStorage
- [ ] No username prompt on second visit
- [ ] Username shown in header
- [ ] Can create/join without re-entering username

### Room Flow
- [ ] Create room generates 6-char code
- [ ] Room settings saved to localStorage
- [ ] Lobby shows correct room info
- [ ] Host can start with 4+ players
- [ ] Leave room clears pendingRoom data

### Settings
- [ ] Change username clears old data
- [ ] Redirects to home to set new username
- [ ] Sound toggle works
- [ ] Particles toggle works
- [ ] Preferences persist in localStorage

## 🐛 Known Limitations

1. **No Cross-Device Sync**: Username only on one device
2. **No Persistence**: Clearing browser data = lost username
3. **No Verification**: Anyone can use any username
4. **No Uniqueness**: Multiple users can have same username
5. **No History**: No game history saved

**Note**: These are features, not bugs! This is by design for maximum simplicity and privacy.

## 💡 Tips

### For Players
- Choose a memorable username (you'll need to re-enter if you clear browser data)
- Username is case-sensitive
- Room codes expire when host leaves
- Share room code via any messaging app

### For Developers
- Keep guest system even if adding auth later
- Use guestId as foreign key in Supabase tables
- Test with multiple browser profiles for multiplayer
- localStorage is scoped per origin (http vs https)

## 📚 Related Files

- `src/store/guestStore.js` - Guest user management
- `src/app/pages/Home.jsx` - Username modal and room creation
- `src/app/pages/Lobby.jsx` - Room lobby with guest system
- `src/app/pages/Settings.jsx` - Change username
- `src/app/App.jsx` - Routing without authentication
- `src/components/AppHeader.jsx` - Display username
- `src/lib/utils.js` - Room code generation

---

**Last Updated**: December 20, 2025  
**Status**: Implemented & Working ✅  
**Auth Required**: None 🎉