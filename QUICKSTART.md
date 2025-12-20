# WordTraitor Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works!)
- Git installed

---

## Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/ayushtiwari18/wordtraitor.git
cd wordtraitor

# Install dependencies
npm install
```

---

## Step 2: Set Up Supabase

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and name your project (e.g., "wordtraitor-dev")
4. Set a secure database password
5. Choose region closest to you
6. Wait for project to be created (~2 minutes)

### Run Database Setup
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase/setup.sql`
3. Paste into SQL Editor
4. Click "Run" to execute
5. Verify tables created in **Database** > **Tables**

### Run Functions Setup
1. Still in **SQL Editor**, create new query
2. Copy contents of `supabase/functions.sql`
3. Paste and click "Run"
4. Verify functions in **Database** > **Functions**

### Get API Credentials
1. Go to **Settings** > **API**
2. Copy **Project URL** (looks like: `https://xxxxx.supabase.co`)
3. Copy **anon/public key** (long string starting with `eyJ...`)

---

## Step 3: Configure Environment

```bash
# Create .env file from template
cp .env.example .env

# Edit .env and add your Supabase credentials
# VITE_SUPABASE_URL=your_project_url_here
# VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Example `.env` file:**
```env
VITE_SUPABASE_URL=https://abcdefghij.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 4: Start Development Server

```bash
npm run dev
```

**You should see:**
```
  VITE v5.0.8  ready in 423 ms

  ➤  Local:   http://localhost:3000/
  ➤  Network: use --host to expose
```

Open http://localhost:3000 in your browser! 🎉

---

## Step 5: Test the App

### Create Your First Account
1. Click **Sign Up**
2. Enter username, email, and password
3. Click **Create Account**
4. You'll be redirected to the home page

### Create a Game Room
1. Click **Create Circle**
2. Choose game mode (Silent Circle recommended for online)
3. Select difficulty (Medium is good to start)
4. Choose word pack (General)
5. Click **Create Circle**
6. You'll see a 6-character room code (e.g., "ABC123")

### Test with Second User
1. Open a new **incognito/private window**
2. Go to http://localhost:3000
3. Sign up with different email
4. Click **Join Circle**
5. Enter the room code from first user
6. Both users should see each other in the lobby!

---

## 🐞 Troubleshooting

### "Missing Supabase environment variables"
- Check that `.env` file exists
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Restart dev server after changing `.env`

### "Failed to create room"
- Verify Supabase setup.sql ran successfully
- Check Supabase dashboard for errors
- Look at browser console for detailed error

### "Authentication failed"
- Verify Supabase project is active
- Check API key is correct
- Ensure RLS policies are enabled

### Real-time not working
- Go to Supabase **Database** > **Replication**
- Ensure tables have replication enabled
- Check browser console for WebSocket errors

---

## 📖 What's Next?

Now that your dev environment is running, you can:

1. **Explore the codebase**
   - `src/app/pages/` - Page components
   - `src/components/` - Reusable UI components
   - `src/store/` - State management
   - `src/lib/supabase.js` - Database helpers

2. **Complete the game pages**
   - Build Lobby page with player list
   - Implement Game page with phases
   - Create Results page

3. **Read the docs**
   - [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md) - Detailed progress
   - [README.md](./README.md) - Full documentation

---

## 🔧 Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests (once implemented)
npm run test
```

---

## 📚 Learning Resources

- **React**: https://react.dev/learn
- **Supabase**: https://supabase.com/docs/guides/getting-started
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Zustand**: https://docs.pmnd.rs/zustand/getting-started/introduction
- **Framer Motion**: https://www.framer.com/motion/introduction/

---

## ❓ Need Help?

If you run into issues:

1. Check [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md) for known issues
2. Review Supabase logs in dashboard
3. Check browser console for errors
4. Open an issue on GitHub

---

**Happy coding! 🎉**