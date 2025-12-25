-- DIAGNOSTIC SCRIPT: Find out why RLS is still blocking

-- Step 1: Check current RLS status
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'feedback';

-- Step 2: Check all policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'feedback';

-- Step 3: Check table grants
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name = 'feedback'
ORDER BY grantee, privilege_type;

-- Step 4: Check if there are any restrictive policies
SELECT 
    policyname,
    permissive
FROM pg_policies 
WHERE tablename = 'feedback' 
  AND permissive = 'RESTRICTIVE';

-- ============================================
-- TEMPORARY FIX: Disable RLS for testing
-- (Uncomment the next line to disable RLS)
-- ============================================
-- ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;

-- ============================================
-- NUCLEAR OPTION: Recreate table without RLS
-- (Only use if above doesn't work)
-- ============================================
/*
DROP TABLE IF EXISTS public.feedback CASCADE;

CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_text TEXT NOT NULL,
    email TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT feedback_text_length CHECK (char_length(feedback_text) >= 10 AND char_length(feedback_text) <= 5000),
    CONSTRAINT email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$')
);

CREATE INDEX feedback_created_at_idx ON public.feedback(created_at DESC);

-- NO RLS - Allow all access for now
ALTER TABLE public.feedback DISABLE ROW LEVEL SECURITY;

GRANT ALL ON public.feedback TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

COMMENT ON TABLE public.feedback IS 'User feedback - RLS disabled for testing';
*/