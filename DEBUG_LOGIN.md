# 🔍 Debug Login Issue - Step by Step

Since your profile exists and role is correct, let's debug the actual login flow.

## Step 1: Check Browser Console

1. **Open Browser DevTools:**
   - Press `F12` or `Right-click → Inspect`
   - Go to **Console** tab

2. **Try to login again**

3. **Look for these messages:**
   - `"User profile loaded:"` - Should show your user data
   - `"Admin Dashboard - Auth State:"` - Should show your role as "Admin"
   - Any **red error messages** - These will tell us what's wrong

4. **Copy any error messages** you see

---

## Step 2: Check Network Tab

1. **Go to Network tab** in DevTools
2. **Try to login**
3. **Look for:**
   - `/api/admin/stats` - Check if this request succeeds or fails
   - Any requests with **red status codes** (401, 403, 500)

4. **Click on failed requests** to see the error message

---

## Step 3: Test RLS Policies

Run this SQL to test if RLS is blocking your access:

```sql
-- Test if you can read your own profile (as the authenticated user)
-- This simulates what the app does
SELECT id, email, full_name, role 
FROM users 
WHERE id = '92cbf80c-97a3-4470-aac0-f359b98accd1';
```

**Expected:** Should return 1 row

**If it fails:** RLS policy is blocking - see Fix below

---

## Step 4: Check RLS Policies

Verify the RLS policy exists and is correct:

```sql
-- Check RLS policies
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
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY policyname;
```

**Should see:**
- ✅ "Users can view own profile" (SELECT)
- ✅ "Users can update own profile" (UPDATE)
- ✅ "Admins can view all users" (SELECT)
- ✅ "Admins can update any user" (UPDATE)

---

## Step 5: Test API Route Directly

Test if the API route works:

1. **Login to your app**
2. **Open Browser Console**
3. **Run this JavaScript:**

```javascript
fetch('/api/admin/stats')
  .then(res => res.json())
  .then(data => console.log('API Response:', data))
  .catch(err => console.error('API Error:', err));
```

**Expected:** Should return stats data

**If it fails:** Check the error message

---

## Common Fixes

### Fix #1: RLS Policy Missing or Incorrect

If RLS is blocking, recreate the policy:

```sql
-- Drop and recreate the policy
DROP POLICY IF EXISTS "Users can view own profile" ON users;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);
```

### Fix #2: Session Not Being Set

Clear cookies and try again:

1. **Open DevTools → Application tab**
2. **Go to Cookies → http://localhost:3000**
3. **Delete all cookies**
4. **Close browser completely**
5. **Reopen and login again**

### Fix #3: Check Environment Variables

Make sure these are set in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mkrrzggetqnsxnenkvht.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## What to Share

If still not working, share:

1. **Console errors** (from Step 1)
2. **Network request errors** (from Step 2)
3. **Result of RLS test** (from Step 3)
4. **API route test result** (from Step 5)

This will help identify the exact issue!

