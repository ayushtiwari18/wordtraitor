# 🎵 WordTraitor Music System Setup Guide

## Overview

WordTraitor now features a dynamic music system that changes based on game phases! This guide will help you set up and customize the background music.

---

## 🎯 Features

✅ **Phase-Based Music** - Different tracks for Lobby, Gameplay, and Results
✅ **User Controls** - Enable/disable, volume slider, quick mute
✅ **Persistent Settings** - Preferences saved to localStorage
✅ **Autoplay Handling** - Respects browser autoplay policies
✅ **Smooth Transitions** - Seamless track switching between phases
✅ **Lightweight** - ~3MB total (compressed MP3s)

---

## 📁 Required Music Files

Place three MP3 files in the `/public/music/` directory:

### 1. **lobby.mp3** - Waiting Room Music
- **When:** Players in lobby, waiting for game to start
- **Mood:** Calm, relaxed, casual
- **Duration:** 2-3 minutes (loops)
- **Style:** Lo-fi, ambient, chill beats
- **Example Search:** "chill background music", "lofi waiting room"

### 2. **gameplay.mp3** - Active Game Music
- **When:** All gameplay phases (Whisper, Hint Drop, Debate, Voting)
- **Mood:** Tense, mysterious, focused
- **Duration:** 3-5 minutes (loops)
- **Style:** Suspense, thriller, investigation
- **Example Search:** "mystery suspense music", "thriller investigation"

### 3. **results.mp3** - Reveal/Ending Music
- **When:** Results screen, revealing traitors
- **Mood:** Dramatic, climactic
- **Duration:** 30-60 seconds (no loop)
- **Style:** Victory/defeat themes, dramatic reveal
- **Example Search:** "dramatic reveal music", "victory theme"

---

## 🎶 Where to Find Free Music

### Recommended Royalty-Free Sources:

#### 1. **Incompetech (Kevin MacLeod)** ⭐ RECOMMENDED
- 🔗 https://incompetech.com/music/
- 📜 License: CC BY 4.0 (free with attribution)
- 🎯 Perfect for: All three tracks
- 📌 Search: "Sneaky Snitch" (lobby), "Investigations" (gameplay)

#### 2. **Purple Planet**
- 🔗 https://www.purple-planet.com/
- 📜 Free for commercial use
- 🎯 Perfect for: Gameplay music
- 📌 Browse their "Mystery" and "Suspense" categories

#### 3. **Bensound**
- 🔗 https://www.bensound.com/
- 📜 Free with attribution
- 🎯 Perfect for: Lobby and results
- 📌 Try: "Dreams", "Acoustic Breeze" (lobby)

#### 4. **FreePD (Public Domain)**
- 🔗 https://freepd.com/
- 📜 100% free, no attribution needed
- 🎯 Perfect for: All tracks

#### 5. **YouTube Audio Library**
- 🔗 https://studio.youtube.com/ (requires Google account)
- 📜 Various licenses (check each track)
- 🎯 Perfect for: All tracks
- 📌 Filter by mood: "Calm", "Suspenseful", "Dramatic"

---

## ⚙️ File Specifications

### Technical Requirements:
```
Format: MP3
Bitrate: 128-192 kbps (recommended for web)
Sample Rate: 44.1 kHz
Channels: Stereo
```

### File Sizes (Target):
- Lobby: 500KB - 1.5MB
- Gameplay: 1MB - 2MB  
- Results: 200KB - 500KB
- **Total: ~3MB**

### Why These Specs?
- **128-192 kbps:** Good quality without huge file sizes
- **MP3 Format:** Universal browser support
- **Compressed:** Fast loading, minimal bandwidth

---

## 🛠️ Setup Instructions

### Step 1: Create Music Directory
```bash
mkdir -p public/music
```

### Step 2: Download Your Music
1. Visit one of the recommended sources above
2. Download 3 tracks matching the moods described
3. Rename them to: `lobby.mp3`, `gameplay.mp3`, `results.mp3`

### Step 3: Place Files
```
wordtraitor/
└── public/
    └── music/
        ├── lobby.mp3      ← Put here
        ├── gameplay.mp3   ← Put here
        └── results.mp3    ← Put here
```

### Step 4: Test
1. Start your development server: `npm run dev`
2. Open the app in browser
3. Click anywhere (to unlock autoplay)
4. Look for the music button (bottom-left corner)
5. Click it to enable music
6. Navigate through different pages to test

---

## 🎮 How It Works

### Phase Mapping:
```javascript
LOBBY phase        → lobby.mp3     (calm waiting music)
WHISPER phase      → gameplay.mp3 (tense gameplay music)
HINT_DROP phase    → gameplay.mp3 (tense gameplay music)
DEBATE phase       → gameplay.mp3 (tense gameplay music)
VERDICT phase      → gameplay.mp3 (tense gameplay music)
REVEAL phase       → results.mp3  (dramatic reveal)
FINISHED phase     → results.mp3  (dramatic reveal)
```

### User Controls:

1. **Floating Music Button** (bottom-left)
   - Click to enable/mute music
   - Visual indicator (purple = playing, gray = muted)
   - Tooltip on hover

2. **Settings Page** (if implemented)
   - Full enable/disable toggle
   - Volume slider (0-100%)
   - Preferences saved automatically

### Storage:
```javascript
// Preferences saved in localStorage:
{
  "enabled": true,
  "volume": 0.6,
  "muted": false
}
```

---

## 👨‍💻 Developer Integration

### Using in Game Components:

```javascript
import { useGameMusic } from '../hooks/useGameMusic'

function GameComponent() {
  const currentPhase = 'DEBATE'
  
  // Automatically handles music for this phase
  useGameMusic(currentPhase, true)
  
  return <div>Your game UI</div>
}
```

### Manual Control:

```javascript
import audioManager from '../lib/AudioManager'

// Enable music
audioManager.enable()

// Disable music
audioManager.disable()

// Set volume (0-1)
audioManager.setVolume(0.8)

// Toggle mute
audioManager.toggleMute()

// Change phase
audioManager.setPhase('DEBATE')

// Get current state
const state = audioManager.getState()
console.log(state.isEnabled, state.volume)
```

---

## ⚠️ Important Notes

### Browser Autoplay Policy
Browsers block autoplay until user interacts with the page. The system handles this by:
1. Waiting for first click/keypress
2. Initializing audio context
3. Then playing music

### File Not Found?
If music files are missing, the system will:
- Log warnings to console
- Continue working (no crashes)
- Show error in browser dev tools
- User sees music button but no sound plays

### Testing Without Music
The app works perfectly fine without music files! It's an optional enhancement.

---

## 📝 Attribution (If Using CC Music)

If you use Creative Commons music (like Incompetech), add attribution:

### In About Page:
```markdown
## Music Credits

- Lobby Music: "[Track Name]" by Kevin MacLeod (incompetech.com)
- Gameplay Music: "[Track Name]" by Kevin MacLeod (incompetech.com)  
- Results Music: "[Track Name]" by Kevin MacLeod (incompetech.com)

Licensed under Creative Commons: By Attribution 4.0 License
http://creativecommons.org/licenses/by/4.0/
```

---

## 🛡️ Troubleshooting

### Music Not Playing?

1. **Check console for errors:**
   ```
   🎵 Failed to load [track name]
   ```
   → File path is wrong or file missing

2. **"User gesture required"**
   → Normal! Click anywhere on the page first

3. **Music button shows but no sound**
   → Check if files are in `/public/music/` directory

4. **Music stops when switching tabs**
   → Browser behavior, expected

### Performance Issues?

1. **Reduce file sizes** - Compress MP3s to 128 kbps
2. **Use shorter loops** - 2-3 minute tracks max
3. **Disable on mobile** - Check screen size and disable for phones

---

## 🎓 Quick Start Playlist

Don't want to search? Here's a tested combo from Incompetech:

1. **Lobby:** "Sneaky Snitch" or "Wallpaper"
2. **Gameplay:** "Investigations" or "Scheming Weasel"
3. **Results:** "Dramatic Intro" or "Clash Defiant"

🔗 Download: https://incompetech.com/music/

---

## 🚀 Future Enhancements

Possible additions:
- 🔊 Sound effects (click, vote, reveal)
- 🎶 Multiple track options per phase
- 🎧 Crossfade transitions between tracks
- 📦 Downloadable music pack
- 🎹 Dynamic volume based on game tension

---

## ❓ Need Help?

- Check browser console for errors
- Verify file paths and names exactly match
- Test with music button click after page load
- Open an issue on GitHub with details

---

**Happy Gaming! 🎮🎵**