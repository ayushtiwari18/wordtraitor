-- PROPER RLS FIX: Enable RLS securely while allowing anonymous feedback
-- This fixes the root cause instead of disabling security

-- Step 1: Re-enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop all existing policies
DROP POLICY IF EXISTS "anon_can_insert_feedback" ON public.feedback;
DROP POLICY IF EXISTS "authenticated_can_select_feedback" ON public.feedback;
DROP POLICY IF EXISTS "allow_anonymous_insert" ON public.feedback;
DROP POLICY IF EXISTS "authenticated_select" ON public.feedback;

-- Step 3: Create a single permissive INSERT policy for both anon and authenticated
CREATE POLICY "enable_insert_for_anon_users"
ON public.feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Step 4: Create SELECT policy for authenticated users only
CREATE POLICY "enable_read_for_authenticated"
ON public.feedback
FOR SELECT
TO authenticated
USING (true);

-- Step 5: Revoke all existing grants first (clean slate)
REVOKE ALL ON public.feedback FROM anon;
REVOKE ALL ON public.feedback FROM authenticated;
REVOKE ALL ON public.feedback FROM public;

-- Step 6: Grant specific permissions to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON public.feedback TO anon;

-- Step 7: Grant permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.feedback TO authenticated;

-- Step 8: Ensure the anon role can use sequences (for UUID generation)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Step 9: Make sure default privileges are set for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon;

-- Step 10: Verify the configuration
SELECT 
    'RLS Status' as check_type,
    tablename,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status
FROM pg_tables 
WHERE tablename = 'feedback'

UNION ALL

SELECT 
    'Policies' as check_type,
    policyname as tablename,
    roles::text as status
FROM pg_policies 
WHERE tablename = 'feedback'

UNION ALL

SELECT 
    'Grants' as check_type,
    grantee as tablename,
    string_agg(privilege_type, ', ') as status
FROM information_schema.table_privileges 
WHERE table_name = 'feedback'
GROUP BY grantee
ORDER BY check_type, tablename;

-- Step 11: Test insert as anon user (this simulates what your app does)
-- Note: This will only work if you run it with anon credentials
-- Your app should now be able to insert successfully