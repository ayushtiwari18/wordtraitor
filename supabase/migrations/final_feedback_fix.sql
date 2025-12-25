-- FINAL FIX: Use 'anon' role instead of 'public' role
-- The issue: RLS policy was using 'public' but Supabase uses 'anon' for unauthenticated requests

-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "allow_anonymous_insert" ON public.feedback;
DROP POLICY IF EXISTS "authenticated_select" ON public.feedback;

-- Step 2: Create policy specifically for 'anon' role
CREATE POLICY "anon_can_insert_feedback" 
ON public.feedback 
AS PERMISSIVE
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Step 3: Create policy for authenticated users to read
CREATE POLICY "authenticated_can_select_feedback" 
ON public.feedback 
AS PERMISSIVE
FOR SELECT 
TO authenticated
USING (true);

-- Step 4: Ensure grants are in place
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON public.feedback TO anon;
GRANT ALL ON public.feedback TO authenticated;

-- Verify the fix (uncomment to run after)
-- SELECT 
--   schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies 
-- WHERE tablename = 'feedback';