# 🔧 Troubleshooting Login Issues - "Access Denied"

## Common Issue: "Access Denied" or Redirect Loop

If you're experiencing:
- "Access denied" error when trying to sign in
- Page reloads and goes back to home page
- Can't access admin/doctor dashboards

---

## 🔍 Diagnosis Steps

### Step 1: Check if User Profile Exists

Run this SQL in Supabase SQL Editor:

```sql
-- Check if your user profile exists
SELECT id, email, full_name, role 
FROM users 
WHERE email = 'your-email@example.com';
```

**Expected Result:** Should return 1 row with your user data

**If no rows returned:** Your profile doesn't exist - see Fix #1 below

---

### Step 2: Check if User Exists in Auth

Run this SQL:

```sql
-- Check auth.users table
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'your-email@example.com';
```

**Expected Result:** Should return 1 row

**If no rows returned:** User doesn't exist in auth - you need to sign up first

---

### Step 3: Check RLS Policies

The issue might be Row Level Security (RLS) blocking access. Check:

1. Go to Supabase Dashboard → Authentication → Policies
2. Select `users` table
3. Verify these policies exist:
   - ✅ "Users can view own profile" (SELECT)
   - ✅ "Users can update own profile" (UPDATE)
   - ✅ "Admins can view all users" (SELECT)
   - ✅ "Admins can update any user" (UPDATE)

---

## 🛠️ Fixes

### Fix #1: User Profile Missing

**Symptom:** Login succeeds but profile doesn't exist in `users` table

**Solution:** Create the profile manually

```sql
-- Get your auth user ID first
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then create profile (replace USER_ID_HERE with actual UUID)
INSERT INTO users (id, email, full_name, role)
VALUES (
  'USER_ID_HERE',  -- Replace with UUID from above
  'your-email@example.com',
  'Your Name',
  'Patient'  -- or 'Admin' or 'Doctor'
)
ON CONFLICT (id) DO NOTHING;
```

---

### Fix #2: Trigger Not Working

**Symptom:** Profile should be created automatically on signup but isn't

**Solution:** Re-run the trigger setup

```sql
-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public' 
  AND trigger_name = 'on_auth_user_created';

-- If it doesn't exist, recreate it
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'Patient'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### Fix #3: RLS Policy Blocking Access

**Symptom:** Can't read own profile due to RLS

**Solution:** Verify and fix RLS policies

```sql
-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- If "Users can view own profile" is missing, create it:
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- If "Users can update own profile" is missing:
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

---

### Fix #4: Role Not Set Correctly

**Symptom:** Profile exists but role is NULL or wrong

**Solution:** Update the role

```sql
-- Temporarily disable trigger
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON users;

-- Update role
UPDATE users 
SET role = 'Admin'  -- or 'Doctor' or 'Patient'
WHERE email = 'your-email@example.com';

-- Re-enable trigger
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();
```

---

## 🧪 Testing After Fix

1. **Clear browser cache and cookies**
2. **Logout completely** (if logged in)
3. **Login again** with your credentials
4. **Check browser console** for any errors (F12 → Console)
5. **Check Network tab** for failed API calls

---

## 📋 Complete Diagnostic Query

Run this to check everything at once:

```sql
-- Complete diagnostic
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  au.created_at as auth_created,
  u.id as user_id,
  u.email as user_email,
  u.full_name,
  u.role,
  CASE 
    WHEN u.id IS NULL THEN '❌ Profile Missing'
    WHEN u.role IS NULL THEN '⚠️ Role Not Set'
    ELSE '✅ OK'
  END as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email = 'your-email@example.com';
```

---

## 🚨 Emergency Fix: Recreate Everything

If nothing works, recreate the user:

```sql
-- 1. Delete from users table (if exists)
DELETE FROM users WHERE email = 'your-email@example.com';

-- 2. Delete from auth.users (if exists)
-- Note: This must be done in Supabase Dashboard → Authentication → Users
-- Or use service role key

-- 3. Sign up again through the app
-- The trigger should create the profile automatically

-- 4. If trigger doesn't work, manually create:
INSERT INTO users (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'User'),
  'Patient'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (id) DO UPDATE SET role = 'Patient';
```

---

## 📞 Still Not Working?

Check these:

1. **Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL` is set correctly
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly

2. **Browser Console:**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

3. **Supabase Dashboard:**
   - Check Authentication → Users (user exists?)
   - Check Table Editor → users (profile exists?)
   - Check Database → Policies (RLS policies exist?)

---

**Last Updated:** Current session

