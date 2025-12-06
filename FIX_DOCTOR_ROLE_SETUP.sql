-- ============================================================================
-- FIX: Set User Role to Doctor
-- ============================================================================
-- Problem: prevent_role_change_trigger blocks role changes by non-admins
-- Solution: Temporarily disable trigger, update role, re-enable trigger
-- ============================================================================

-- Step 1: Temporarily disable the trigger
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON users;

-- Step 2: Update your role to Doctor (replace with your email)
-- IMPORTANT: Replace 'rjalloh076@central.edu.sl' with the email of the user you want to make a doctor
UPDATE users 
SET role = 'Doctor' 
WHERE email = 'rjalloh076@central.edu.sl';

-- Step 3: Re-enable the trigger
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- Step 4: Verify the role change (optional)
SELECT email, full_name, role 
FROM users 
WHERE email = 'rjalloh076@central.edu.sl';

-- ============================================================================
-- ALTERNATIVE: If user profile doesn't exist, create it first
-- ============================================================================

-- If the user doesn't exist in the users table, use this instead:

/*
-- Step 1: Temporarily disable the trigger
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON users;

-- Step 2: Create or update the user profile
INSERT INTO users (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Doctor User'),
  'Doctor'
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

-- Step 4: Verify
SELECT email, full_name, role 
FROM users 
WHERE email = 'rjalloh076@central.edu.sl';
*/

