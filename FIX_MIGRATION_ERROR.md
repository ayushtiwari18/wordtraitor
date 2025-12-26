# 🛠️ Fix Migration Constraint Error

**Error**: `check constraint "game_rooms_current_phase_check" of relation "game_rooms" is violated by some row`

**Cause**: Your database has existing rooms with phase values that don't match the new constraint.

---

## ⚡ Quick Fix (2 Steps)

### Step 1: Run Diagnostic Query

In Supabase SQL Editor, run:

```sql
-- See what phase values currently exist
SELECT 
  current_phase,
  COUNT(*) as room_count
FROM game_rooms
GROUP BY current_phase
ORDER BY room_count DESC;
```

**What you might see**:
```
current_phase  | room_count
---------------+-----------
NULL           | 5        ← Problem!
PLAYING        | 3        ← Problem!
DEBATE         | 2        ← Old value
LOBBY          | 1        ✓ OK
```

---

### Step 2: Run the FIXED Migration

The FIXED migration handles all existing data automatically!

**In Supabase SQL Editor, run this file**:
```
supabase/migrations/20251226_phase_flow_update_FIXED.sql
```

**What it does**:
1. Updates `DEBATE` → `DEBATE_VOTING`
2. Updates `VERDICT` → `DEBATE_VOTING`
3. Updates `NULL` → `LOBBY`
4. Updates any invalid values → `LOBBY`
5. **THEN** adds the new constraint

**Result**: All existing rooms fixed, migration succeeds! ✅

---

## 🔍 Alternative: Manual Cleanup (If You Prefer)

If you want to clean up data yourself first:

### Option A: Delete Invalid Rooms (Testing Environment)

```sql
-- Delete all rooms with invalid phases
DELETE FROM game_rooms 
WHERE current_phase IS NULL 
   OR current_phase NOT IN ('LOBBY', 'WHISPER', 'HINT_DROP', 'DEBATE', 'VERDICT', 'REVEAL');

-- Verify they're gone
SELECT COUNT(*) FROM game_rooms;
```

Then run the FIXED migration.

---

### Option B: Fix Invalid Rooms (Production Environment)

```sql
-- Fix NULL phases
UPDATE game_rooms 
SET current_phase = 'LOBBY' 
WHERE current_phase IS NULL;

-- Fix old phase names
UPDATE game_rooms 
SET current_phase = 'DEBATE_VOTING' 
WHERE current_phase IN ('DEBATE', 'VERDICT');

-- Fix any other invalid values
UPDATE game_rooms 
SET current_phase = 'LOBBY' 
WHERE current_phase NOT IN ('LOBBY', 'WHISPER', 'HINT_DROP', 'DEBATE_VOTING', 'REVEAL');

-- Verify all rooms now have valid phases
SELECT current_phase, COUNT(*) 
FROM game_rooms 
GROUP BY current_phase;
```

Then run the FIXED migration.

---

## ✅ Verification

After running the FIXED migration, verify it worked:

```sql
-- Check constraint exists
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'game_rooms_current_phase_check';

-- Should show:
-- CHECK (current_phase IN ('LOBBY', 'WHISPER', 'HINT_DROP', 'DEBATE_VOTING', 'REVEAL', 'POST_ROUND'))

-- Check all rooms have valid phases
SELECT 
  current_phase,
  COUNT(*) as room_count
FROM game_rooms
GROUP BY current_phase;

-- Should only show: LOBBY, WHISPER, HINT_DROP, DEBATE_VOTING, REVEAL, POST_ROUND
-- NO other values!
```

---

## 📊 What Changed?

### Old Phase Values
```
'WHISPER', 'HINT_DROP', 'DEBATE', 'VERDICT', 'REVEAL'
```

### New Phase Values
```
'LOBBY', 'WHISPER', 'HINT_DROP', 'DEBATE_VOTING', 'REVEAL', 'POST_ROUND'
```

### Mapping
- `DEBATE` → `DEBATE_VOTING` ✅
- `VERDICT` → `DEBATE_VOTING` ✅
- `NULL` → `LOBBY` ✅
- Any invalid value → `LOBBY` ✅
- Added: `LOBBY`, `POST_ROUND` ✨

---

## 🚀 Next Steps

After migration succeeds:

1. **Run second migration**:
   ```
   supabase/migrations/20251226_spectator_and_cleanup.sql
   ```

2. **Deploy frontend**:
   ```bash
   git pull origin main
   npm run build
   # Deploy to your hosting
   ```

3. **Test**:
   - Create room → Phase = LOBBY
   - Start game → Phases advance correctly
   - No "constraint violation" errors

---

## 🐛 Still Getting Errors?

### Error: "relation does not exist"
**Fix**: Make sure you ran the initial `supabase/setup.sql` first.

### Error: "constraint already exists"
**Fix**: Run this to remove old constraint:
```sql
ALTER TABLE game_rooms DROP CONSTRAINT IF EXISTS game_rooms_current_phase_check;
```
Then run FIXED migration again.

### Error: "cannot drop constraint ... because other objects depend on it"
**Fix**: Use `DROP CONSTRAINT IF EXISTS CASCADE` instead:
```sql
ALTER TABLE game_rooms DROP CONSTRAINT IF EXISTS game_rooms_current_phase_check CASCADE;
```

---

## 📞 Support Files

- **Diagnostic Query**: `supabase/migrations/DIAGNOSE_EXISTING_DATA.sql`
- **Fixed Migration**: `supabase/migrations/20251226_phase_flow_update_FIXED.sql`
- **Full Guide**: `BACKEND_IMPLEMENTATION_COMPLETE.md`

---

**✅ Use the FIXED migration - it handles everything automatically!**
