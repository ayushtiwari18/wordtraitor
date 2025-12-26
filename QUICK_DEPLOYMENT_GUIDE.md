# ⚡ Quick Deployment Guide - WordTraitor Phase Sync Update

**Estimated Time**: 15 minutes  
**Difficulty**: Easy  
**Last Updated**: December 26, 2025

---

## 🚀 Quick Deploy (3 Steps)

### Step 1: Database (5 min)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → Your Project
2. Go to **SQL Editor**
3. Copy & paste this file: `supabase/migrations/20251226_phase_flow_update.sql`
4. Click **Run**
5. Copy & paste this file: `supabase/migrations/20251226_spectator_and_cleanup.sql`
6. Click **Run**

**Verify**:
```sql
SELECT 'Migration successful!' WHERE EXISTS (
  SELECT 1 FROM pg_constraint 
  WHERE conname = 'game_rooms_current_phase_check'
  AND pg_get_constraintdef(oid) LIKE '%DEBATE_VOTING%'
);
```
Should return: "Migration successful!"

---

### Step 2: Deploy Frontend (5 min)

**If using Vercel**:
```bash
git push origin main
# Vercel auto-deploys
```

**If using Netlify**:
```bash
git push origin main
# Netlify auto-deploys
```

**Manual deploy**:
```bash
npm run build
# Upload dist/ folder to your hosting
```

---

### Step 3: Test (5 min)

1. **Open your app**: https://your-domain.com
2. **Create room** → Click "Create Room"
3. **Start game** → Wait for WHISPER phase (10s)
4. **Check phase** → Should advance to HINT_DROP automatically
5. **Submit hint** → Should advance to DEBATE_VOTING
6. **Vote** → Should advance to REVEAL
7. **Verify**: No "stuck in phase" bugs!

✅ If all phases advance correctly, **deployment successful**!

---

## 🚨 Rollback (If Needed)

### Database Rollback
```sql
-- Revert phase constraint
ALTER TABLE game_rooms DROP CONSTRAINT game_rooms_current_phase_check;
ALTER TABLE game_rooms
ADD CONSTRAINT game_rooms_current_phase_check 
CHECK (current_phase IN ('WHISPER', 'HINT_DROP', 'DEBATE', 'VERDICT', 'REVEAL'));

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_cleanup_empty_rooms ON room_participants;
DROP TRIGGER IF EXISTS trigger_cleanup_round_data ON game_rooms;
```

### Frontend Rollback
```bash
git revert HEAD~6
git push origin main --force
```

---

## 👀 What Changed?

### User-Visible Changes
1. ✅ **Combined voting phase** - Debate + voting in one screen (faster)
2. ✅ **No timer in voting** - Vote progress indicator instead
3. ✅ **Host control** - Host can force-end voting
4. ✅ **Spectator chat blocked** - Eliminated players can't interfere
5. ✅ **Smoother phase transitions** - No more "stuck" bugs

### Behind-the-Scenes
1. Database phase names updated
2. Auto-cleanup for empty rooms
3. Auto-cleanup for round data
4. Frontend-backend perfect sync

---

## 📞 Support

**Issues?** Check:
1. [IMPLEMENTATION_SUMMARY_DEC26.md](./IMPLEMENTATION_SUMMARY_DEC26.md) - Full details
2. [BACKEND_IMPLEMENTATION_COMPLETE.md](./BACKEND_IMPLEMENTATION_COMPLETE.md) - Backend guide
3. [FRONTEND_BACKEND_PHASE_SYNC.md](./FRONTEND_BACKEND_PHASE_SYNC.md) - Frontend guide

**Still stuck?** 
- Check Supabase logs: Dashboard → Logs
- Check browser console: F12 → Console
- Verify migrations ran: Run verification SQL above

---

## ✅ Post-Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] Frontend deployed to production
- [ ] Test: Create room works
- [ ] Test: Start game works
- [ ] Test: Phases advance correctly (WHISPER → HINT_DROP → DEBATE_VOTING → REVEAL)
- [ ] Test: Voting completes when all vote
- [ ] Test: Host can force-end voting
- [ ] Test: Game ends at POST_ROUND
- [ ] Test: Spectators cannot chat
- [ ] Test: Empty rooms auto-delete
- [ ] Monitor: No error logs for 24 hours

---

**🎉 That's it! You're deployed!**

*Total time: ~15 minutes*
