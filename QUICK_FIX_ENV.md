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

This includes the fix that loads `.env.local` properly.

---

### **Step 2: Install Dependencies**

```bash
npm install
```

This ensures `dotenv` package is installed (already in package.json).

---

### **Step 3: Verify .env.local**

Make sure your `.env.local` file exists in the **root directory** (same level as `package.json`):

```bash
# Check if file exists
ls -la .env.local

# If it doesn't exist, create it:
cat > .env.local << 'EOF'
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
├── .env.local              ⭐ HERE!
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
chmod 644 .env.local
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
node -e "require('dotenv').config({path:'.env.local'}); console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅' : '❌'); console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')"
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

# 3. Recreate .env.local
cat > .env.local << 'EOF'
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

## 📞 **Get Help**

If still stuck, check:

1. 📚 [README_TESTING.md](./README_TESTING.md)
2. 🔧 [SCALED_TESTING.md](./SCALED_TESTING.md)
3. 🐛 [CYPRESS_FIXES.md](./CYPRESS_FIXES.md)

---

**Last Updated:** December 23, 2025  
**Status:** ✅ Tested and Working
