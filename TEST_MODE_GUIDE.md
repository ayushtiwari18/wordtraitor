# 🤖 Test Mode Guide

## 🎯 Purpose

Test Mode lets you play **solo with 4 AI bots** to:
- ✅ Test the complete 5-phase game flow
- ✅ Debug without needing other players
- ✅ See how voting/hints work in real-time
- ✅ Understand game mechanics
- ✅ Verify your setup is correct

---

## 🚀 How to Use Test Mode

### **Step 1: Start Test Mode**

1. Open your app at [http://localhost:5173](http://localhost:5173)
2. Click the **green "Test Mode"** button
3. Wait 2 seconds for bot initialization
4. You'll see the lobby with **YOU + 4 AI Bots**

### **Step 2: Start Game**

1. In the Lobby, click **"Start Game"**
2. Game begins immediately (no waiting for players)
3. You'll proceed through all 5 phases

---

## 🎮 Game Flow (Test Mode)

### **Phase 1: WHISPER (30s)**
- 👁️ See your secret word
- 📚 Either "Ocean" (Citizen) or "Sea" (Traitor)
- 🤖 Bots don't do anything (just learning phase)

### **Phase 2: HINT DROP (60s)**
- ✍️ **YOU:** Type and submit your hint
- 🤖 **BOTS:** Auto-submit hints after 2-5 seconds
- 👀 Watch hints appear in real-time
- ⏱️ Phase auto-advances after 60s

**Bot Behavior:**
- **Bot Alice**: Normal citizen hints
- **Bot Bob**: Normal citizen hints
- **Bot Charlie**: Suspicious/vague hints
- **Bot Diana**: Clever hints (if traitor)

### **Phase 3: DEBATE (120s)**
- 🗣️ Review all submitted hints
- 🔍 Look for suspicious patterns
- 🤖 Bots don't chat (future feature)
- ⏱️ 2-minute discussion time

### **Phase 4: VERDICT (45s)**
- 🗳️ **YOU:** Vote for who you think is the traitor
- 🤖 **BOTS:** Auto-vote after 3-7 seconds
- 📊 Watch vote count update
- ⏱️ Phase auto-advances after 45s

**Bot Voting Logic:**
- Traitor bot: Votes randomly
- Citizen bots: Try to find suspicious hints
- Look for very short hints or word "unusual"

### **Phase 5: REVEAL (15s)**
- 💥 See who was eliminated
- 📊 Vote breakdown displayed
- ⚖️ Check if game should end

**Win Conditions:**
- 🏆 **Citizens win** if traitor eliminated
- 🕵️ **Traitor wins** if ≤2 players remain
- 🔄 **Continue** if neither condition met

### **Phase 6: RESULTS**
- 🎉 Winner announcement
- 👥 Final player standings
- 🕵️ Traitor reveal
- 🔁 Play again or go home

---

## 👍 What to Test

### **✅ Basic Flow**
- [ ] Test mode starts successfully
- [ ] 5 players appear in lobby (you + 4 bots)
- [ ] Game starts when you click button
- [ ] All 5 phases run in sequence
- [ ] Timer counts down correctly
- [ ] Phase auto-advances

### **✅ Hint System**
- [ ] You can submit a hint
- [ ] Bots submit hints automatically
- [ ] Hints appear in real-time
- [ ] Can't submit twice
- [ ] All hints show in DEBATE phase

### **✅ Voting System**
- [ ] You can vote for any player
- [ ] Bots vote automatically
- [ ] Votes show in REVEAL phase
- [ ] Vote counts are accurate
- [ ] Most voted player is eliminated

### **✅ Win Conditions**
- [ ] Game ends when traitor eliminated
- [ ] Game ends when ≤2 players alive
- [ ] Correct winner announced
- [ ] Traitor identity revealed

### **✅ UI/UX**
- [ ] Phase names display correctly
- [ ] Timer is visible and accurate
- [ ] Player list updates (alive/dead)
- [ ] Animations smooth
- [ ] No console errors

---

## 🔍 Debugging with Test Mode

### **Check Browser Console (F12)**

You'll see helpful logs:
```
🤖 Test mode initialized with 4 AI bots
🎮 Test game started!
🕵️ Traitor: Bot Charlie
👤 Your role: CITIZEN (Ocean)
🤖 Bot Alice submitted hint: "Water"
🤖 Bot Bob submitted hint: "Blue"
🤖 Bot Charlie voted for Bot Diana
```

### **Common Issues**

**Bots don't submit hints:**
- Check browser console for errors
- Make sure phase is HINT_DROP
- Wait 2-5 seconds for delays

**Votes don't appear:**
- Check browser console
- Make sure phase is VERDICT
- Wait 3-7 seconds

**Phase doesn't advance:**
- Check timer in UI
- Look for errors in console
- Verify phaseTimer is counting down

**Results don't show:**
- Check if win condition was met
- Verify gameResults state updated
- Check browser console

---

## 🧠 Bot Personalities

### **Bot Alice** (Normal)
- Gives reasonable hints
- Votes logically
- Tries to find traitor

### **Bot Bob** (Normal)
- Similar to Alice
- Good team player
- Follows the crowd

### **Bot Charlie** (Suspicious)
- Sometimes gives odd hints
- Might vote randomly
- Easy to spot as traitor

### **Bot Diana** (Clever)
- Smart hints that blend in
- Strategic voting
- Hard to catch if traitor

---

## 📊 Expected Behavior

### **Typical Game:**

1. **Start** → Lobby with 5 players
2. **WHISPER** → You see "Ocean" or "Sea"
3. **HINT_DROP** → Bots submit: "Water", "Blue", "Deep", "Waves"
4. **DEBATE** → Review all hints
5. **VERDICT** → Vote for suspicious player
6. **REVEAL** → "Bot Charlie eliminated"
7. **Check Win** → Either:
   - "Citizens Win!" (traitor eliminated)
   - Continue to Round 2
8. **RESULTS** → Winner announcement

---

## ⚠️ Limitations

- ❌ No database persistence (local only)
- ❌ Bots don't actually chat in DEBATE
- ❌ Simple AI logic (not advanced ML)
- ❌ Can't save/resume test games
- ❌ No real-time sync (single player)

---

## 🔄 After Testing

Once you've verified everything works in Test Mode:

1. ✅ Create a real room with friends
2. ✅ Join from multiple devices
3. ✅ Test real multiplayer
4. ✅ Verify real-time sync

---

## 📝 Example Test Session

```
1. Click "Test Mode" on Home page
2. Lobby loads with 5 players
3. Click "Start Game"
4. WHISPER: See "You are a CITIZEN. Your word is: Ocean"
5. HINT_DROP: Type "Salty" and submit
   - Bot Alice: "Water"
   - Bot Bob: "Blue" 
   - Bot Charlie: "Thing" (suspicious!)
   - Bot Diana: "Deep"
6. DEBATE: Review hints, Charlie's is odd
7. VERDICT: Vote for Bot Charlie
   - Other bots also vote for Charlie
8. REVEAL: "Bot Charlie has been eliminated!"
   - Charlie was the TRAITOR!
9. RESULTS: "Citizens Win!"
```

---

## 🎯 Tips for Testing

1. **Run through multiple times** to see different roles
2. **Check console logs** for debugging
3. **Test edge cases** (tie votes, last player, etc.)
4. **Verify animations** are smooth
5. **Check mobile responsive** design
6. **Test with different word packs** (if implemented)

---

## 🐛 Report Issues

If you find bugs in Test Mode:

1. Open browser console (F12)
2. Copy error messages
3. Note what phase it happened
4. Take screenshot
5. Report on GitHub Issues

---

**Happy Testing! 🤖** This mode is perfect for validating your complete game flow before going multiplayer! 🎮