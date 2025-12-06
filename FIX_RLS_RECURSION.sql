-- ============================================================================
-- FIX: Infinite Recursion in RLS Policies
-- ============================================================================
-- Problem: RLS policies on 'users' table query 'users' table, causing recursion
-- Solution: Use a helper function with SECURITY DEFINER to bypass RLS
-- ============================================================================

-- Step 1: Create a helper function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id AND role = 'Admin'
  );
END;
$$;

-- Step 2: Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;

-- Step 3: Recreate policies using the helper function (no recursion!)
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    auth.uid() = id OR  -- Users can view own profile
    public.is_admin(auth.uid())  -- Admins can view all (uses function, no recursion)
  );

CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  USING (
    auth.uid() = id OR  -- Users can update own profile
    public.is_admin(auth.uid())  -- Admins can update any (uses function, no recursion)
  )
  WITH CHECK (
    auth.uid() = id OR  -- Users can update own profile
    public.is_admin(auth.uid())  -- Admins can update any (uses function, no recursion)
  );

-- Step 4: Verify the fix
-- This should work without recursion:
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Test that the function works:
SELECT public.is_admin('92cbf80c-97a3-4470-aac0-f359b98accd1'::UUID);
-- Should return: true (if you're admin) or false (if not)
