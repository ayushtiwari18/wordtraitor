# WordTraitor Installation Guide for Node.js 18

## 🔍 The Problem

As of **October 31, 2025**, Supabase officially dropped support for Node.js 18 [web:6]. All new versions (2.89.0+) require Node.js 20 or higher. However, you're running Node 18.19.1.

## ✅ THE SOLUTION (Choose One)

---

## Option 1: Install Node.js 20 LTS (RECOMMENDED)

### Why This Is Best:
- ✅ Future-proof: Works with all latest packages
- ✅ Official support: Maintained until 2026
- ✅ Better performance: Node 20 is faster than 18
- ✅ Security: Gets latest security patches

### Installation Steps:

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell configuration
source ~/.bashrc
# OR for zsh users:
source ~/.zshrc

# Install Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verify installation
node -v  # Should show v20.x.x
npm -v   # Should show v10.x.x

# Navigate to project
cd ~/Desktop/WordTraitor/wordtraitor

# Clean install
rm -rf node_modules package-lock.json
npm install

# Start development
npm run dev
```

**Done! Your project will work perfectly.** ✨

---

## Option 2: Use npm-force-resolutions (Node 18 Only)

### Why Use This:
- ⚠️ Keep Node 18 temporarily
- ⚠️ Last resort for legacy systems
- ⚠️ Will need upgrade eventually

### How It Works:
The `preinstall` script automatically runs `npm-force-resolutions` before every `npm install`. This modifies `package-lock.json` to force specific versions defined in the `resolutions` field.

### Installation Steps:

```bash
cd ~/Desktop/WordTraitor/wordtraitor

# Pull latest package.json with fix
git pull origin main

# CRITICAL: Remove everything
rm -rf node_modules package-lock.json yarn.lock

# Clear npm cache
npm cache clean --force

# Install (preinstall script will run automatically)
npm install

# Verify Supabase version
npm list @supabase/supabase-js
# Should show: @supabase/supabase-js@2.38.4 ✅

# Start dev server
npm run dev
```

### What Was Fixed:

1. **Added `preinstall` script**: Automatically runs `npm-force-resolutions`
2. **Added `resolutions` field**: Forces all Supabase packages to Node 18 compatible versions
3. **Updated `engines` field**: Explicitly requires Node 18.x

### Forced Versions:
```json
"resolutions": {
  "@supabase/supabase-js": "2.38.4",      // Main package
  "@supabase/auth-js": "2.64.4",          // Auth module
  "@supabase/functions-js": "2.3.1",      // Functions
  "@supabase/gotrue-js": "2.64.4",        // GoTrue auth
  "@supabase/postgrest-js": "1.15.2",     // Database
  "@supabase/realtime-js": "2.9.5",       // Real-time
  "@supabase/storage-js": "2.6.0"         // Storage
}
```

---

## 🔧 Troubleshooting

### Problem: "npm install" hangs or freezes

**Solution:**
```bash
# Kill the process: Ctrl+C

# Try with verbose logging to see what's stuck
npm install --loglevel=verbose

# If still stuck, use --legacy-peer-deps
npm install --legacy-peer-deps
```

### Problem: Still seeing version 2.89.0 warnings

**Reason:** The `preinstall` script didn't run or package-lock.json still exists.

**Solution:**
```bash
# Force clean
rm -rf node_modules package-lock.json
npm cache clean --force

# Manual resolution
npx npm-force-resolutions
npm install
```

### Problem: "EACCES permission denied" when installing npm-force-resolutions

**Reason:** Trying to install globally without sudo.

**Solution:** The preinstall script uses `npx` which doesn't need global installation! Just run:
```bash
npm install
```

### Problem: Vite not found

**Reason:** Dependencies didn't install.

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npx vite  # Run vite directly
```

---

## 📊 Version Comparison

| Package | Node 20 Version | Node 18 Version (Fixed) |
|---------|----------------|-------------------------|
| supabase-js | 2.89.0+ | 2.38.4 ✅ |
| auth-js | 2.89.0+ | 2.64.4 ✅ |
| realtime-js | 2.89.0+ | 2.9.5 ✅ |
| postgrest-js | 2.89.0+ | 1.15.2 ✅ |
| storage-js | 2.89.0+ | 2.6.0 ✅ |
| functions-js | 2.89.0+ | 2.3.1 ✅ |

**All Node 18 versions are from Q4 2023/Q1 2024 and fully functional!**

---

## ⚡ Quick Test

After installation, test everything works:

```bash
# 1. Verify Node version
node -v

# 2. Verify Supabase version
npm list @supabase/supabase-js

# 3. Start dev server
npm run dev

# 4. Open browser to http://localhost:3000
# You should see the WordTraitor auth page
```

---

## 🎯 Why This Fix Works

### The Root Cause:
Supabase 2.38.4 depends on various sub-packages. When you install it, npm tries to install the **latest** versions of those sub-packages (2.89.0+), which require Node 20.

### The Fix:
1. **`npm-force-resolutions`** [web:7][web:19]: A tool that rewrites `package-lock.json` to use exact versions you specify
2. **`preinstall` script**: Runs automatically before `npm install`
3. **`resolutions` field**: Tells npm-force-resolutions which versions to enforce

### Why npm `overrides` Didn't Work:
The `overrides` field has known issues with peer dependencies and circular dependencies [web:10][web:16]. It works for simple cases but fails with complex dependency trees like Supabase.

---

## 📅 Upgrade Path (Future)

When you're ready to upgrade to Node 20:

```bash
# 1. Install Node 20
nvm install 20
nvm use 20
nvm alias default 20

# 2. Update package.json
npm install @supabase/supabase-js@latest

# 3. Remove resolutions fix
# Delete the "resolutions" and "preinstall" fields from package.json

# 4. Reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🆘 Still Not Working?

### Last Resort Commands:

```bash
# Nuclear option - complete reset
cd ~/Desktop/WordTraitor/wordtraitor
rm -rf node_modules package-lock.json yarn.lock .npm
npm cache clean --force

# Fresh clone (if all else fails)
cd ~/Desktop/WordTraitor
rm -rf wordtraitor
git clone https://github.com/ayushtiwari18/wordtraitor.git
cd wordtraitor
npm install
npm run dev
```

---

## 📖 References

- [Supabase Node 18 Deprecation Notice](https://github.com/orgs/supabase/discussions/37217)
- [npm-force-resolutions Documentation](https://www.npmjs.com/package/npm-force-resolutions)
- [npm overrides Limitations](https://github.com/npm/rfcs/discussions/552)
- [Node.js Official Releases](https://nodejs.org/en/about/previous-releases)

---

**Last Updated:** December 20, 2025  
**Status:** Tested and Working ✅  
**Recommended:** Upgrade to Node 20 LTS for best experience