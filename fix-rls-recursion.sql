-- Fix RLS Recursion Issue for users table
-- This script removes recursive policies and replaces them with non-recursive ones

-- Step 1: Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;

-- Step 2: Create a helper function to check if user is admin
-- This function checks the role from the users table but uses SECURITY DEFINER
-- to bypass RLS, preventing recursion
-- Note: SECURITY DEFINER allows the function to bypass RLS when querying users
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Query users table directly (bypasses RLS due to SECURITY DEFINER)
  SELECT role INTO user_role
  FROM users
  WHERE id = user_id;
  
  -- Return true only if role is Admin
  RETURN COALESCE(user_role = 'Admin', false);
END;
$$;

-- Step 3: Create non-recursive RLS policies

-- Policy 1: Users can view their own profile
-- Uses auth.uid() directly, no recursion
CREATE POLICY "users_select_own"
ON users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Policy 2: Users can update their own profile
-- Uses auth.uid() directly, no recursion
CREATE POLICY "users_update_own"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Policy 3: Admins can view all users
-- Uses the helper function which bypasses RLS, preventing recursion
CREATE POLICY "admins_select_all"
ON users
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Policy 4: Admins can update all users
-- Uses the helper function which bypasses RLS, preventing recursion
CREATE POLICY "admins_update_all"
ON users
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Policy 5: Allow users to insert their own profile during signup
-- Uses auth.uid() directly, no recursion
CREATE POLICY "users_insert_own"
ON users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Step 4: Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Verification queries (run these to test):
-- SELECT * FROM users WHERE id = auth.uid(); -- Should work for own profile
-- SELECT * FROM users; -- Should work for admins only

