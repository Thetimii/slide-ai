# 🐛 Troubleshooting Guide

## Common Issues & Solutions

### Issue: Konva "Can't resolve 'canvas'" Error

**Error Message:**

```
Module not found: Can't resolve 'canvas'
./node_modules/konva/lib/index-node.js:4:1
```

**Solution:** ✅ FIXED!

- Updated `next.config.js` to externalize canvas module
- Made EditorCanvas use dynamic imports with `ssr: false`
- Added client-side mounting check

**What happened:**
Konva tries to import Node.js `canvas` module for server-side rendering, but we only need client-side rendering for the editor.

---

### Issue: npm Critical Vulnerability Warning

**Warning Message:**

```
1 critical severity vulnerability
To address all issues, run: npm audit fix --force
```

**Solution:**

```bash
# Check what the vulnerability is
npm audit

# Fix if safe (usually dependency updates)
npm audit fix

# Only use --force if you understand the changes
# npm audit fix --force
```

**Note:** These warnings are often in dev dependencies and don't affect production. Check `npm audit` output to see if it's critical.

---

### Issue: Missing 404 for `/grain.png`

**Error Message:**

```
GET /grain.png 404 in 133ms
```

**Solution:** This is optional decorative noise texture. You can either:

1. **Ignore it** (page works fine without it)
2. **Remove the reference** in `app/page.tsx`:
   ```tsx
   // Remove this line:
   <div className="absolute inset-0 bg-[url('/grain.png')] opacity-20 mix-blend-overlay"></div>
   ```
3. **Add a grain texture**: Download a grain PNG and add to `/public/grain.png`

---

### Issue: Environment Variables Not Working

**Symptoms:**

- "Failed to create demo user"
- "OpenRouter API error"
- Database connection errors

**Solution:**

1. Verify `.env.local` exists (not `.env.example`)
2. Check all keys are set:
   ```bash
   cat .env.local
   ```
3. Restart dev server after changing env vars:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

### Issue: Supabase RLS Errors

**Error Message:**

```
new row violates row-level security policy
```

**Solution:**

1. Verify `schema.sql` was run completely in Supabase SQL Editor
2. Check user is authenticated:
   ```sql
   -- In Supabase SQL Editor
   SELECT auth.uid();
   ```
3. Verify policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'presentations';
   ```

---

### Issue: TypeScript Errors in Editor

**Symptoms:**

- Red squiggly lines in VS Code
- "Cannot find module 'react'" errors

**Solution:**

```bash
# Ensure all types are installed
npm install

# Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"
```

---

### Issue: "Failed to generate slides"

**Common Causes:**

1. **Invalid OpenRouter API Key**

   - Verify key starts with `sk-or-`
   - Check key is valid at openrouter.ai

2. **No Credits**

   - Add credits at openrouter.ai/account
   - $5 = ~3,000 generations

3. **Invalid Input**
   - Notes must be 10-5000 characters
   - Check browser console for errors

**Debug:**

```bash
# Check API route logs in terminal
# Look for "OpenRouter API error" messages
```

---

### Issue: Canvas Not Rendering

**Symptoms:**

- Dashboard loads but canvas is blank
- "Loading canvas..." never disappears

**Solution:**

1. Check browser console for errors
2. Verify react-konva is installed:
   ```bash
   npm list react-konva
   ```
3. Clear browser cache and reload
4. Try different browser

---

### Issue: Demo User Not Created

**Symptoms:**

- Redirected to login
- "Unauthorized" errors

**Solution:**

1. Check `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
2. Verify it's the **service_role** key (not anon key)
3. Check Supabase project is active
4. Look for errors in terminal and browser console

---

### Issue: Slides Not Saving

**Symptoms:**

- Changes revert after refresh
- "Failed to update presentation" errors

**Solution:**

1. Check network tab for failed API calls
2. Verify RLS policies allow updates
3. Check user session is valid:
   ```js
   // In browser console
   const supabase = createClient()
   const { data } = await supabase.auth.getSession()
   console.log(data)
   ```

---

### Issue: Port 3000 Already in Use

**Error Message:**

```
Port 3000 is already in use
```

**Solution:**

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

---

## Quick Diagnostic Commands

```bash
# Check if dependencies are installed
ls node_modules | wc -l
# Should show ~400+ packages

# Verify environment variables
cat .env.local

# Check Next.js version
npx next --version

# Check for outdated packages
npm outdated

# Clear Next.js cache
rm -rf .next

# Reinstall everything
rm -rf node_modules package-lock.json
npm install
```

---

## Still Having Issues?

1. **Check Documentation:**

   - `QUICKSTART.md` for setup
   - `CHEATSHEET.md` for code examples
   - `README.md` for feature overview

2. **Check Logs:**

   - Terminal output (Next.js server)
   - Browser console (F12)
   - Supabase dashboard → Logs

3. **Verify Setup:**

   - [ ] `npm install` completed successfully
   - [ ] `.env.local` has all 4 variables
   - [ ] Supabase `schema.sql` ran without errors
   - [ ] OpenRouter has credits
   - [ ] Port 3000 is available

4. **Common Solutions:**
   - Restart dev server
   - Clear browser cache
   - Restart VS Code
   - Check internet connection
   - Verify API keys are valid

---

## Known Limitations

✅ **These are expected:**

1. TypeScript warnings during `npm install` - cosmetic only
2. Missing `/grain.png` 404 - optional texture
3. Some npm audit warnings - in dev dependencies
4. "Webpack serializing big strings" - normal for Konva

❌ **These indicate real problems:**

1. "Module not found: Can't resolve 'canvas'" - see fix above ✅
2. "Unauthorized" on dashboard - check Supabase keys
3. "OpenRouter API error" - check API key and credits
4. "Failed to create demo user" - check service role key

---

**Most issues can be solved by:**

1. Restarting the dev server
2. Checking `.env.local` is correct
3. Verifying Supabase schema was run
4. Looking at browser/terminal console errors

Good luck! 🚀
