# 🔧 IMMEDIATE FIXES NEEDED

## Current Status: ⚠️ 2 Issues to Resolve

---

## Issue #1: Missing Supabase Anon Key

**Error:**

```
Error: @supabase/ssr: createServerClient requires configuring getAll and setAll cookie methods
POST /api/create-demo-user 500
```

**Why:** Your `.env.local` has `your_supabase_anon_key_here` placeholder instead of the real key.

**Fix:**

### Step 1: Get Your Anon Key

1. Open: https://supabase.com/dashboard/project/mvynkudqddhmexfpejvh/settings/api
2. Find the **"anon public"** key section
3. Click "Copy" button (key starts with `eyJhbGc...`)

### Step 2: Update .env.local

Open `.env.local` and replace this line:

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

With your actual key:

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
```

---

## Issue #2: Database Schema Not Run

**Why:** The 5 required tables don't exist in your Supabase database yet.

**Fix:**

### Step 1: Open Supabase SQL Editor

https://supabase.com/dashboard/project/mvynkudqddhmexfpejvh/editor

### Step 2: Run Schema

1. Click "+ New Query"
2. Open `supabase/schema.sql` in your editor
3. Copy the entire file (177 lines)
4. Paste into Supabase SQL Editor
5. Click "RUN" button

**Expected Result:**

```
Success. No rows returned
```

### Step 3: Verify Tables

Run this query to verify:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

**Should show:**

- users
- presentations
- prompts_history
- exports
- transfer_links

---

## Issue #3: Restart Server

After fixing both issues above:

```bash
# Stop current server (Ctrl+C in terminal)
npm run dev
```

**Expected Success Output:**

```
✓ Ready in 2.7s
Local: http://localhost:3000
✓ Compiled /dashboard in 1064ms
GET /dashboard 200 in 1035ms
POST /api/create-demo-user 200 in 45ms  ← Should be 200, not 500!
```

---

## ✅ How to Test Everything Works

### Test 1: Landing Page

1. Open http://localhost:3000
2. Should see "AI Church Slide Builder" hero
3. No console errors

### Test 2: Dashboard

1. Click "Start Free in the Editor"
2. Should redirect to http://localhost:3000/dashboard
3. Should see:
   - Slides list on left
   - Canvas in center (with "Loading canvas..." briefly)
   - Inspector panel on right
4. Check terminal: `POST /api/create-demo-user 200` ← Should be 200!

### Test 3: AI Generation

1. Click "Generate Slides with AI" button
2. Enter: "Create 3 slides about hope, faith, and love"
3. Click "Generate"
4. Should see:
   - Loading spinner
   - 3 new slides appear in left sidebar
   - Canvas shows first slide

**Success = All 3 tests pass!**

---

## 🎯 Quick Command Summary

```bash
# 1. Get your anon key from Supabase dashboard
# 2. Update .env.local with real anon key
# 3. Run schema in Supabase SQL Editor

# 4. Restart server
npm run dev

# 5. Test
# Open http://localhost:3000
# Click "Start Free in the Editor"
# Generate slides with AI
```

---

## 🆘 If Still Not Working

### Check Environment Variables

```bash
cat .env.local
```

Should show:

- ✅ `NEXT_PUBLIC_SUPABASE_URL=https://mvynkudqddhmexfpejvh.supabase.co`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...` (real key, not placeholder)
- ✅ `SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...` (you have this)
- ✅ `OPENROUTER_API_KEY=sk-or-v1-...` (you have this)

### Check Database Tables

In Supabase SQL Editor:

```sql
SELECT COUNT(*) FROM users;
```

If error: "relation users does not exist" → Run schema again

### Check Terminal Output

Look for:

- ✅ `GET /dashboard 200` (not 500)
- ✅ `POST /api/create-demo-user 200` (not 500)
- ❌ No "Error:" messages

---

## 📝 Files Modified to Fix Issues

1. **lib/supabase/service-role.ts** - ✅ Fixed cookie configuration
2. **.env.local** - ⚠️ YOU need to add anon key
3. **Supabase database** - ⚠️ YOU need to run schema.sql

---

**Once both issues fixed → Server should run perfectly! 🎉**
