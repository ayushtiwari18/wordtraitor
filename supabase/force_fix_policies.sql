-- ============================================
-- FORCE FIX POLICIES - RUN THIS NOW!
-- Drops and recreates with USING (true)
-- ============================================

-- 1. COMPLETELY DROP ALL POLICIES
DROP POLICY IF EXISTS "participants_all_delete" ON room_participants CASCADE;
DROP POLICY IF EXISTS "participants_all_insert" ON room_participants CASCADE;
DROP POLICY IF EXISTS "participants_all_select" ON room_participants CASCADE;
DROP POLICY IF EXISTS "participants_all_update" ON room_participants CASCADE;

DROP POLICY IF EXISTS "secrets_all_insert" ON round_secrets CASCADE;
DROP POLICY IF EXISTS "secrets_all_select" ON round_secrets CASCADE;

DROP POLICY IF EXISTS "Anyone can delete participation" ON room_participants CASCADE;
DROP POLICY IF EXISTS "Anyone can join rooms" ON room_participants CASCADE;
DROP POLICY IF EXISTS "Anyone can update participation" ON room_participants CASCADE;
DROP POLICY IF EXISTS "Anyone can view participants" ON room_participants CASCADE;

DROP POLICY IF EXISTS "Anyone can insert secrets" ON round_secrets CASCADE;
DROP POLICY IF EXISTS "Anyone can view secrets" ON round_secrets CASCADE;

-- 2. RECREATE WITH EXPLICIT TRUE CONDITIONS
CREATE POLICY "participants_all_select"
ON room_participants
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

CREATE POLICY "participants_all_insert"
ON room_participants
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "participants_all_update"
ON room_participants
AS PERMISSIVE
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "participants_all_delete"
ON room_participants
AS PERMISSIVE
FOR DELETE
TO public
USING (true);

-- 3. ROUND SECRETS
CREATE POLICY "secrets_all_select"
ON round_secrets
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

CREATE POLICY "secrets_all_insert"
ON round_secrets
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (true);

-- 4. VERIFY POLICIES
SELECT schemaname, tablename, policyname, permissive, cmd, qual
FROM pg_policies
WHERE tablename IN ('room_participants', 'round_secrets')
ORDER BY tablename, policyname;