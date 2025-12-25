-- Create feedback table for user feedback storage
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_text TEXT NOT NULL,
    email TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT feedback_text_length CHECK (char_length(feedback_text) >= 10 AND char_length(feedback_text) <= 5000),
    CONSTRAINT email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create index for faster queries by date
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON public.feedback(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert feedback (anonymous submissions allowed)
CREATE POLICY "Anyone can submit feedback" 
ON public.feedback 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Policy: Only admins can read feedback (optional - adjust based on your needs)
-- For now, we'll allow reading for authenticated users only
CREATE POLICY "Authenticated users can read feedback" 
ON public.feedback 
FOR SELECT 
TO authenticated
USING (true);

-- Add comment for documentation
COMMENT ON TABLE public.feedback IS 'Stores user feedback and bug reports from the WordTraitor application';
COMMENT ON COLUMN public.feedback.feedback_text IS 'The feedback message from the user (10-5000 characters)';
COMMENT ON COLUMN public.feedback.email IS 'Optional email address for follow-up';
COMMENT ON COLUMN public.feedback.user_agent IS 'Browser user agent string for debugging context';