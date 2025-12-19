# Fix RLS Recursion Error

## Problem
When trying to login, you get: "infinite recursion detected in policy for relation 'users'"

This happens because RLS policies on the `users` table are checking user roles by querying the `users` table itself, creating a circular dependency.

## Solution

### Step 1: Run the SQL Migration

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `fix-rls-recursion.sql`
4. Run the SQL script

### Step 2: Verify the Fix

After running the SQL, test login:
1. Try logging in with a user account
2. The recursion error should be resolved

## How the Fix Works

The fix uses two strategies to prevent recursion:

1. **Direct `auth.uid()` checks**: For users viewing/updating their own profile, we use `auth.uid()` directly without querying the users table.

2. **SECURITY DEFINER function**: For admin checks, we use a helper function with `SECURITY DEFINER` that bypasses RLS, preventing recursion.

## Alternative Solution (If the above doesn't work)

If you still experience issues, you can temporarily disable RLS on the users table and handle authorization at the application level:

```sql
-- TEMPORARY: Disable RLS (NOT RECOMMENDED FOR PRODUCTION)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Then ensure all API routes use authGuard which checks authorization
```

**Note**: This is less secure and should only be used as a last resort. The proper fix is the SQL migration above.

## Troubleshooting

### If you still get recursion errors:

1. Check if there are other policies on related tables that might be causing issues
2. Verify the `is_admin` function was created successfully
3. Check Supabase logs for more detailed error messages

### If login works but other operations fail:

1. Verify all policies were created correctly
2. Check that RLS is enabled: `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`
3. Test with different user roles (Patient, Doctor, Admin)

## Testing Checklist

- [ ] Can login as Patient
- [ ] Can login as Doctor  
- [ ] Can login as Admin
- [ ] Patient can view own profile
- [ ] Patient can update own profile
- [ ] Admin can view all users
- [ ] Admin can update all users
- [ ] No recursion errors in Supabase logs

