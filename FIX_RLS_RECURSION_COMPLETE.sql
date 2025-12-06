-- ============================================================================
-- FIX: Infinite Recursion in RLS Policies - COMPLETE SCRIPT
-- ============================================================================
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================================

-- Step 1: Create helper function to check if user is admin (bypasses RLS)
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

-- Step 2: Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;

-- Step 3: Recreate policies using the helper function (NO RECURSION!)
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    auth.uid() = id OR public.is_admin(auth.uid())
  );

CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  USING (
    auth.uid() = id OR public.is_admin(auth.uid())
  )
  WITH CHECK (
    auth.uid() = id OR public.is_admin(auth.uid())
  );

-- Step 4: Verify it worked
SELECT 
  policyname, 
  cmd,
  CASE 
    WHEN qual LIKE '%is_admin%' THEN '✅ Using function (no recursion)'
    ELSE '⚠️ Check policy'
  END as status
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

