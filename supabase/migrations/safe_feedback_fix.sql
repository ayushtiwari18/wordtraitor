-- SAFE FIX: Drop ALL policies first, then recreate
-- This script is idempotent - can be run multiple times safely

-- Step 1: Drop ALL existing policies on feedback table
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'feedback') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.feedback', r.policyname);
    END LOOP;
END $$;

-- Step 2: Create fresh policy for INSERT (anon + authenticated)
CREATE POLICY "anon_can_insert_feedback" 
ON public.feedback 
AS PERMISSIVE
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Step 3: Create policy for SELECT (authenticated only)
CREATE POLICY "authenticated_can_select_feedback" 
ON public.feedback 
AS PERMISSIVE
FOR SELECT 
TO authenticated
USING (true);

-- Step 4: Ensure all grants are in place
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON public.feedback TO anon;
GRANT ALL ON public.feedback TO authenticated;

-- Step 5: Verify setup
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    roles, 
    cmd,
    CASE 
        WHEN 'anon' = ANY(string_to_array(trim(both '{}' from roles::text), ',')) THEN '✅ Has anon role'
        ELSE '❌ Missing anon role'
    END as status
FROM pg_policies 
WHERE tablename = 'feedback'
ORDER BY cmd;