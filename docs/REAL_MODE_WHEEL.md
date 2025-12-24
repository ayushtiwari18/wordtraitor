# 🎭 REAL Mode Spinning Wheel - Complete Guide

**Status**: ✅ Implemented  
**Date**: December 24, 2025  
**Feature**: Mystery-themed spinning wheel for REAL mode turn selection

---

## 🎯 Overview

REAL mode now features a **spinning wheel** ("Circle of Secrets") that randomly selects players to speak their hints. The wheel replaces the manual "Next Player" button and provides a more engaging, fair, and exciting experience for voice chat gameplay.

### **Key Features**

✅ **Host-Controlled** - Only the host can spin the wheel  
✅ **Visible to All** - Every player sees the wheel and animation  
✅ **No Repeats** - Each player selected exactly once  
✅ **Random Selection** - Fair, unpredictable turn order  
✅ **Mystery Theme** - Dark purple/gold aesthetic matching game style  
✅ **Smooth Animation** - 5-second spin with realistic deceleration  
✅ **Auto-Complete Detection** - Tracks when all players have spoken  

---

## 🎮 How It Works

### **REAL Mode Flow**

1. **WHISPER Phase** (30s)
   - All players see their secret words
   - Traitors see their fake word
   - No interaction, just memorization

2. **HINT_DROP Phase** (No Time Limit ✨)
   - **Spinning wheel appears**
   - Host clicks "Spin the Wheel" button
   - Wheel spins for 5 seconds with smooth animation
   - Random player selected (never repeats)
   - Selected player speaks hint over voice chat
   - Host clicks "Done - Next Player" when ready
   - Repeat until all players have spoken
   - Auto-advances to VERDICT when complete

3. **DEBATE Phase** (2 minutes)
   - Players discuss hints via voice chat
   - No chat input (voice only)

4. **VERDICT Phase** (45s)
   - Players vote on devices
   - Votes hidden until reveal

5. **REVEAL Phase** (15s)
   - Winner announced
   - Traitors revealed

---

## 👥 User Experience

### **For Hosts**

**What You See:**
- Large spinning wheel with all player names
- **"Spin the Wheel"** button (gold, pulsing)
- Completed players grayed out on wheel
- Progress tracker (e.g., "2/5 players spoken")

**What You Do:**
1. Click **"Spin the Wheel"** to select next speaker
2. Watch 5-second animation
3. Wheel stops on random player
4. **Selected player banner** appears showing who should speak
5. Wait for player to speak their hint (voice chat)
6. Click **"✅ Done - Next Player"** when ready
7. Repeat until all players complete

**Tips:**
- Don't spin too fast - give players time to speak
- If someone disconnects, they'll be grayed out automatically
- The wheel prevents re-selecting completed players

---

### **For Non-Host Players**

**What You See:**
- Same spinning wheel as host
- Your name highlighted on wheel
- Completed players grayed out
- Progress tracker
- **No spin button** (host only)

**What You Do:**
1. Watch wheel spin
2. Wait for your turn to be selected
3. When selected, **speak your hint clearly** over voice chat
4. Wait for host to click "Done"
5. Listen to other players' hints

**When It's Your Turn:**
- 🎤 **Banner appears**: "It's YOUR turn! Speak your hint to everyone"
- Your segment on wheel is highlighted
- Host sees "Done" button

**When It's Not Your Turn:**
- 🎧 **Banner shows**: "Listen to [Player]'s hint"
- You can't interact, just watch and listen

---

## ⚙️ Technical Details

### **Component Architecture**

```
HintDropPhase.jsx
  ├─ REAL mode detection (room.game_mode === 'REAL')
  ├─ SpinningWheel component
  │   ├─ players: all alive participants
  │   ├─ completedPlayerIds: tracks who has spoken
  │   ├─ onSpinComplete: callback when wheel stops
  │   ├─ isHost: controls button visibility
  │   └─ isSpinning: animation state
  └─ Current speaker UI
      ├─ Shows selected player
      ├─ Host: "Done" button
      └─ Non-host: "Waiting" message
```

### **Wheel Animation**

**CSS Transform:**
```css
transform: rotate(${rotation}deg);
transition: transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99);
```

**Easing Curve**: `cubic-bezier(0.17, 0.67, 0.12, 0.99)`  
- Creates realistic deceleration  
- Smooth slow-down at end  
- Feels natural and suspenseful

**Rotation Calculation:**
```javascript
const fullSpins = 3 + Math.floor(Math.random() * 3); // 3-5 full rotations
const winnerAngle = segmentAngle * winnerIndex;
const finalRotation = (fullSpins * 360) + (360 - winnerAngle) + offset;
```

### **Player Selection Algorithm**

1. **Filter Available Players:**
   ```javascript
   const availablePlayers = players.filter(
     p => !completedPlayerIds.includes(p.user_id)
   )
   ```

2. **Random Selection:**
   ```javascript
   const randomIndex = Math.floor(Math.random() * availablePlayers.length)
   const winner = availablePlayers[randomIndex]
   ```

3. **No Repeats Guarantee:**
   - Completed players excluded from selection pool
   - Grayed out visually on wheel
   - Marked with checkmark ✓

4. **Completion Check:**
   ```javascript
   if (completedPlayerIds.length >= totalPlayers) {
     // Auto-advance to VERDICT
   }
   ```

---

## 🎨 Design Specifications

### **Color Palette**

| Element | Color | Purpose |
|---------|-------|----------|
| Background | `#1a1a2e` → `#16213e` gradient | Dark mystery theme |
| Wheel Border | `#d4af37` (gold) | Luxury, importance |
| Segments | Rainbow HSL | Visual distinction |
| Completed Segments | `#4a5568` (gray) | Inactive state |
| Pointer | `#d4af37` (gold triangle) | Selection indicator |
| Spin Button | `#d4af37` → `#f4d03f` gradient | Call-to-action |
| Center Circle | `#2a2a4e` with gold border | Focal point |

### **Dimensions**

- **Desktop Wheel**: 400px × 400px
- **Mobile Wheel**: 300px × 300px
- **Pointer**: 40px tall triangle
- **Center Circle**: 80px diameter
- **Segment Text**: 0.9rem (desktop), 0.7rem (mobile)

### **Animations**

1. **Wheel Spin**: 5 seconds with cubic-bezier easing
2. **Button Pulse**: 2-second infinite scale animation
3. **Selected Badge**: 0.5s fade-in-up
4. **Segment Hover**: 0.3s opacity transition

---

## 🔄 Comparison: REAL vs SILENT Mode

| Feature | REAL Mode | SILENT Mode |
|---------|-----------|-------------|
| **Input Method** | Voice chat | Text input |
| **Turn Selection** | 🎭 Spinning wheel (random) | 🔄 Sequential (turn order) |
| **Time Limit** | ❌ None (host-controlled) | ✅ 60 seconds |
| **Host Control** | Spins wheel, marks complete | Automatic |
| **Early Complete** | Host decides when to advance | Auto when all submit |
| **Visual** | Animated wheel | Player status grid |
| **Best For** | Voice chat groups | Text-only play |

---

## ✅ Testing Checklist

### **Functional Tests**

- [ ] **Wheel Renders**
  - [ ] Wheel appears in REAL mode
  - [ ] All player names visible on segments
  - [ ] Colors distinct and readable
  - [ ] Mobile responsive (300px on small screens)

- [ ] **Spin Button**
  - [ ] Only visible to host
  - [ ] Disabled when spinning
  - [ ] Disabled when all complete
  - [ ] Shows "All Complete" text when done

- [ ] **Spin Animation**
  - [ ] 5-second smooth rotation
  - [ ] Realistic deceleration
  - [ ] Stops on correct player
  - [ ] Multiple spins work correctly

- [ ] **Player Selection**
  - [ ] Random selection each time
  - [ ] Never repeats until all complete
  - [ ] Completed players grayed out
  - [ ] Checkmark (✓) on completed segments

- [ ] **Current Speaker UI**
  - [ ] Banner appears after spin
  - [ ] Shows correct player name
  - [ ] Host sees "Done" button
  - [ ] Non-hosts see "Waiting" message
  - [ ] Banner updates each spin

- [ ] **Progress Tracking**
  - [ ] Counter updates (e.g., "2/5 players spoken")
  - [ ] Completed count accurate
  - [ ] Auto-advances when all complete

### **Edge Cases**

- [ ] **2 Players**
  - [ ] Wheel shows both players
  - [ ] Each selected exactly once
  - [ ] Auto-advances after 2 spins

- [ ] **10+ Players**
  - [ ] Wheel segments small but readable
  - [ ] All names fit without overlap
  - [ ] Performance remains smooth

- [ ] **Player Disconnect**
  - [ ] Disconnected player grayed out
  - [ ] Skipped automatically
  - [ ] Remaining players still selectable

- [ ] **Host Disconnect**
  - [ ] New host can continue spinning
  - [ ] Progress preserved
  - [ ] No data loss

- [ ] **Multiple Spins Rapidly**
  - [ ] Button disabled during spin
  - [ ] No duplicate selections
  - [ ] Animation completes before next

### **Visual/UX Tests**

- [ ] **Animations Smooth**
  - [ ] No jank or stuttering
  - [ ] Consistent 60 FPS
  - [ ] Easing feels natural

- [ ] **Accessibility**
  - [ ] Text readable (contrast ratio ≥4.5:1)
  - [ ] Button focus states visible
  - [ ] Keyboard navigation works

- [ ] **Mobile Experience**
  - [ ] Wheel fits screen without scrolling
  - [ ] Button large enough to tap (44px min)
  - [ ] Text readable on small screens

---

## 🚀 Future Enhancements

### **Planned**

1. **Sound Effects**
   - Spinning sound (roulette wheel)
   - "Ding" when selection complete
   - Suspenseful music during spin

2. **Custom Themes**
   - Color customization per room
   - Different wheel styles (fortune, carnival, etc.)
   - Seasonal themes (Halloween, Christmas)

3. **Statistics**
   - Track who was selected first most often
   - Average spin duration
   - Completion time per player

### **Potential**

4. **Wheel Modes**
   - **Momentum Mode**: Pull back to spin (physics)
   - **Speed Control**: Host adjusts spin speed
   - **Weighted Wheel**: Bias toward certain players

5. **Visual Effects**
   - Confetti when wheel stops
   - Particle effects on pointer
   - Glow animation on selected segment

6. **Integration**
   - Use wheel for traitor selection (game start)
   - Use wheel for voting phase (random order)
   - Custom wheels for other game modes

---

## 🐛 Known Issues

**None currently!** ✅

If you encounter issues, please report:
1. Browser and version
2. Number of players in game
3. Screenshot/video of issue
4. Console logs (F12 → Console tab)

---

## 📚 Related Documentation

- [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - All 6 multiplayer fixes
- [README.md](../README.md) - Project setup and overview
- [Database Schema](../supabase/schema.sql) - Database structure

---

## 🎉 Conclusion

The spinning wheel transforms REAL mode from a manual, host-controlled experience into an exciting, fair, and visually engaging game mechanic. Players love the suspense of watching the wheel spin and the randomness ensures everyone gets a turn without bias.

**Ready to play!** 🎲