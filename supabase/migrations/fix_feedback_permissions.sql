-- Quick Fix Script for Feedback Table Permissions
-- Run this in Supabase SQL Editor if you're getting 401 errors

-- Step 1: Drop existing table and recreate with correct permissions
DROP TABLE IF EXISTS public.feedback CASCADE;

-- Step 2: Create feedback table
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_text TEXT NOT NULL,
    email TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT feedback_text_length CHECK (char_length(feedback_text) >= 10 AND char_length(feedback_text) <= 5000),
    CONSTRAINT email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Step 3: Create index
CREATE INDEX feedback_created_at_idx ON public.feedback(created_at DESC);

-- Step 4: Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Step 5: Create permissive policy for INSERT (allows anonymous users)
CREATE POLICY "allow_anonymous_insert" 
ON public.feedback 
FOR INSERT 
WITH CHECK (true);

-- Step 6: Create policy for SELECT (authenticated only)
CREATE POLICY "authenticated_select" 
ON public.feedback 
FOR SELECT 
TO authenticated
USING (true);

-- Step 7: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT INSERT ON public.feedback TO anon, authenticated;
GRANT SELECT ON public.feedback TO authenticated;

-- Step 8: Add helpful comments
COMMENT ON TABLE public.feedback IS 'User feedback and bug reports - allows anonymous submissions';

-- Verification queries (run these after to confirm setup)
-- SELECT * FROM pg_policies WHERE tablename = 'feedback';
-- SELECT grantee, privilege_type FROM information_schema.table_privileges WHERE table_name = 'feedback';