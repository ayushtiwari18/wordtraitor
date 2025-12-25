# Feedback System Setup

This guide explains how to set up the feedback storage system for WordTraitor.

## 🎯 Overview

The feedback system stores user feedback, bug reports, and feature requests directly in your Supabase database.

## 🗄️ Database Schema

### `feedback` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `feedback_text` | TEXT | The feedback message (10-5000 chars) |
| `email` | TEXT | Optional email for follow-up |
| `user_agent` | TEXT | Browser info for debugging |
| `created_at` | TIMESTAMPTZ | Submission timestamp |

## 🚀 Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **"New query"**
4. Copy and paste the contents of `create_feedback_table.sql`
5. Click **"Run"** to execute the migration

### Option 2: Using Supabase CLI

```bash
# Make sure you're in the project root
cd wordtraitor

# Apply the migration
supabase migration up
```

## ✅ Verify Installation

After running the migration, verify the table was created:

1. Go to **Table Editor** in Supabase dashboard
2. Look for the `feedback` table
3. Check that it has the correct columns

## 🔒 Security (Row Level Security)

The migration automatically sets up RLS policies:

- ✅ **INSERT**: Anyone can submit feedback (anonymous allowed)
- ✅ **SELECT**: Only authenticated users can read feedback
- ❌ **UPDATE/DELETE**: Not allowed (feedback is immutable)

## 📊 Viewing Feedback

### In Supabase Dashboard

1. Go to **Table Editor**
2. Select `feedback` table
3. View all submissions with timestamps

### Programmatically

You can query feedback using the helper function:

```javascript
import { feedbackHelpers } from './lib/supabase'

// Get latest 50 feedback entries
const feedback = await feedbackHelpers.getFeedback(50)
console.log(feedback)
```

## 🎨 Frontend Integration

The feedback button is already integrated and appears on all pages:

- **Location**: Bottom-right corner (floating)
- **Features**: 
  - Animated pulsing ring
  - Smooth modal with validation
  - Character counter (10-5000 chars)
  - Optional email field
  - Loading states
  - Success animation

## 🧪 Testing

1. Start your dev server: `npm run dev`
2. Click the floating feedback button (purple/pink circle)
3. Enter at least 10 characters of feedback
4. Click "Send Feedback"
5. Check your Supabase dashboard to see the entry

## 🛠️ Customization

### Change Text Limits

Edit the constraint in the SQL migration:

```sql
CONSTRAINT feedback_text_length CHECK (
  char_length(feedback_text) >= 10 
  AND char_length(feedback_text) <= 5000
)
```

### Add Fields

You can add additional columns:

```sql
ALTER TABLE public.feedback 
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
```

Then update `FeedbackButton.jsx` to collect the rating.

## 📧 Email Notifications (Optional)

To receive email notifications when feedback is submitted:

1. Go to **Database** → **Webhooks** in Supabase
2. Create a new webhook for the `feedback` table
3. Set trigger to "INSERT"
4. Configure your email service endpoint

## 🐛 Troubleshooting

### "Supabase not configured" Error

Make sure your `.env` file has:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### "Permission denied" Error

The RLS policies should allow anonymous inserts. If not:

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'feedback';

-- Recreate insert policy if needed
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.feedback;
CREATE POLICY "Anyone can submit feedback" 
ON public.feedback 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);
```

### Feedback Not Saving

1. Check browser console for errors
2. Verify Supabase connection in Network tab
3. Check table exists in Supabase dashboard
4. Ensure RLS policies are correctly set

## 📈 Analytics

Query common patterns:

```sql
-- Count feedback by day
SELECT 
  DATE(created_at) as date,
  COUNT(*) as count
FROM feedback
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Find feedback with email contacts
SELECT *
FROM feedback
WHERE email IS NOT NULL
ORDER BY created_at DESC;

-- Search feedback content
SELECT *
FROM feedback
WHERE feedback_text ILIKE '%bug%'
ORDER BY created_at DESC;
```

## 🎉 Done!

Your feedback system is now fully functional and storing data in Supabase! 🚀