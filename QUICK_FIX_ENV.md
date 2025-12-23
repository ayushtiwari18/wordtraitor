# Quick Fix: Missing Supabase Credentials Error

## 🔴 The Error

```
Error: Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
```

---

## ✅ **Solution (3 Steps)**

### **Step 1: Pull Latest Code**

```bash
git pull origin main
```

This includes the fix that loads environment variables from **both `.env` and `.env.local`**.

---

### **Step 2: Install Dependencies**

```bash
npm install
```

This ensures `dotenv` package is installed (already in package.json).

---

### **Step 3: Verify .env File**

✅ **Good news:** The code now supports **BOTH** `.env` and `.env.local`!

**Priority order:**
1. `.env` (checked first)
2. `.env.local` (fallback)

Make sure your `.env` file exists in the **root directory** (same level as `package.json`):

```bash
# Check if file exists
ls -la .env

# If it doesn't exist, create it:
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://ytytsdilcwxlzdstxhgo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eXRzZGlsY3d4bHpkc3R4aGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMDIwMzQsImV4cCI6MjA4MTg3ODAzNH0.8xea-J8_vCdUB2lMBdayAtY44A3ztbZxL_bbzvf5rGg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eXRzZGlsY3d4bHpkc3R4aGdvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjMwMjAzNCwiZXhwIjoyMDgxODc4MDM0fQ.qGKOrYCHOvH9jQkC_VDLaRmwuOv7y9VK0O9IbCjppnA
EOF
```

---

### **Step 4: Test Cypress**

```bash
npx cypress open
```

You should see:
```
✅ Loaded environment from .env
✅ Supabase credentials loaded successfully
```

Should now open without errors! ✅

---

## 🐛 **Still Not Working?**

### **Issue: File in wrong location**

**Check current directory:**
```bash
pwd
# Should output: /home/ayush5410/Desktop/Ai WordTrator/frontend
```

**Your file structure should be:**
```
frontend/
├── .env                    ⭐ HERE! (or .env.local)
├── package.json
├── cypress.config.js
├── cypress/
│   ├── support/
│   │   └── tasks.js
│   └── e2e/
└── src/
```

---

### **Issue: Wrong environment variable names**

❌ **Wrong:**
```bash
SUPABASE_URL=...           # Missing VITE_ prefix
SERVICE_ROLE_KEY=...       # Wrong name
```

✅ **Correct:**
```bash
VITE_SUPABASE_URL=...      # With VITE_ prefix
SUPABASE_SERVICE_ROLE_KEY=...  # Exact name
```

---

### **Issue: File has wrong permissions**

```bash
chmod 644 .env
```

---

### **Issue: Need to restart terminal**

Sometimes environment changes need a fresh terminal:

```bash
# Close terminal
# Open new terminal
cd /home/ayush5410/Desktop/Ai\ WordTrator/frontend
npx cypress open
```

---

## 📝 **Verify Environment Variables**

Run this command to check if variables are loaded:

```bash
node -e "require('dotenv').config({path:'.env'}); console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅' : '❌'); console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')"
```

**Expected output:**
```
VITE_SUPABASE_URL: ✅
SUPABASE_SERVICE_ROLE_KEY: ✅
```

---

## ⚡ **Complete Fresh Start**

If nothing works, do a complete reset:

```bash
# 1. Clean everything
rm -rf node_modules
rm -rf .cache
rm package-lock.json

# 2. Pull latest code
git pull origin main

# 3. Recreate .env (not .env.local!)
cat > .env << 'EOF'
VITE_SUPABASE_URL=https://ytytsdilcwxlzdstxhgo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eXRzZGlsY3d4bHpkc3R4aGdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMDIwMzQsImV4cCI6MjA4MTg3ODAzNH0.8xea-J8_vCdUB2lMBdayAtY44A3ztbZxL_bbzvf5rGg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eXRzZGlsY3d4bHpkc3R4aGdvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjMwMjAzNCwiZXhwIjoyMDgxODc4MDM0fQ.qGKOrYCHOvH9jQkC_VDLaRmwuOv7y9VK0O9IbCjppnA
EOF

# 4. Fresh install
npm install

# 5. Test
npx cypress open
```

---

## 💡 **.env vs .env.local**

### **Which should you use?**

Both work! The code checks for:
1. ✅ `.env` (checked first)
2. ✅ `.env.local` (fallback)

### **Recommendations:**

**Use `.env` if:**
- You're working on this project alone
- You want simple naming
- You already have a `.env` file

**Use `.env.local` if:**
- Multiple developers on the project
- You want local overrides
- Following common conventions

**Either works perfectly!** Just pick one and stick with it.

---

## 🔒 **Security Note**

⚠️ **IMPORTANT:** Both `.env` and `.env.local` are in `.gitignore`

Never commit either file to git! They contain sensitive credentials.

```bash
# Check that your env file is ignored:
git status

# Should NOT show .env or .env.local as untracked
```

---

## 📞 **Get Help**

If still stuck, check:

1. 📚 [README_TESTING.md](./README_TESTING.md)
2. 🔧 [SCALED_TESTING.md](./SCALED_TESTING.md)
3. 🐛 [CYPRESS_FIXES.md](./CYPRESS_FIXES.md)

---

**Last Updated:** December 23, 2025  
**Status:** ✅ Supports both .env and .env.local
