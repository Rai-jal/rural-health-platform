# 🔧 How to Change User Roles

## Problem

When trying to change a user's role in Supabase SQL Editor, you get this error:

```
ERROR: P0001: Only admins can change user roles
CONTEXT: PL/pgSQL function prevent_role_change() line 10 at RAISE
```

This happens because the `prevent_role_change()` trigger prevents non-admins from changing roles. When running SQL directly in Supabase SQL Editor, there's no authenticated user context, so the trigger blocks the update.

---

## ✅ Solution: Temporarily Disable Trigger

### For Setting Doctor Role:

**Use the script:** `FIX_DOCTOR_ROLE_SETUP.sql`

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/mkrrzggetqnsxnenkvht/sql/new

2. **Copy and paste this script:**

```sql
-- Step 1: Temporarily disable the trigger
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON users;

-- Step 2: Update role to Doctor (replace with your email)
UPDATE users 
SET role = 'Doctor' 
WHERE email = 'rjalloh076@central.edu.sl';

-- Step 3: Re-enable the trigger
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- Step 4: Verify
SELECT email, full_name, role 
FROM users 
WHERE email = 'rjalloh076@central.edu.sl';
```

3. **Replace the email** with the actual user's email
4. **Click "Run"**
5. **Verify** the role was changed correctly

---

### For Setting Admin Role:

**Use the script:** `FIX_ADMIN_ROLE_SETUP.sql`

Same process, but change `'Doctor'` to `'Admin'`:

```sql
-- Step 1: Temporarily disable the trigger
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON users;

-- Step 2: Update role to Admin
UPDATE users 
SET role = 'Admin' 
WHERE email = 'admin@healthconnect.com';

-- Step 3: Re-enable the trigger
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();
```

---

### For Setting Patient Role:

Same process, change to `'Patient'`:

```sql
-- Step 1: Temporarily disable the trigger
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON users;

-- Step 2: Update role to Patient
UPDATE users 
SET role = 'Patient' 
WHERE email = 'patient@example.com';

-- Step 3: Re-enable the trigger
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();
```

---

## 🔍 If User Profile Doesn't Exist

If the user exists in `auth.users` but not in `public.users`, create the profile first:

```sql
-- Step 1: Temporarily disable the trigger
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON users;

-- Step 2: Create user profile with role
INSERT INTO users (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'User'),
  'Doctor'  -- or 'Admin' or 'Patient'
FROM auth.users
WHERE email = 'rjalloh076@central.edu.sl'
ON CONFLICT (id) DO UPDATE SET 
  role = 'Doctor',
  full_name = COALESCE(EXCLUDED.full_name, users.full_name);

-- Step 3: Re-enable the trigger
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();
```

---

## 🎯 Quick Reference

| Role | Script File | Email to Replace |
|------|-------------|------------------|
| Admin | `FIX_ADMIN_ROLE_SETUP.sql` | `admin@healthconnect.com` |
| Doctor | `FIX_DOCTOR_ROLE_SETUP.sql` | `rjalloh076@central.edu.sl` |
| Patient | Use template above | `patient@example.com` |

---

## ⚠️ Important Notes

1. **Always re-enable the trigger** after making changes
2. **Replace the email** with the actual user's email
3. **Verify the change** by running the SELECT query
4. **The trigger is important** - it prevents users from changing their own roles in the app

---

## 🔐 After Changing Role

1. **Logout** from the application
2. **Clear browser cookies** (optional but recommended)
3. **Login again** with the same credentials
4. **You should be redirected** to the appropriate dashboard:
   - Admin → `/admin`
   - Doctor → `/doctor`
   - Patient → `/dashboard`

---

**Last Updated:** Current session

