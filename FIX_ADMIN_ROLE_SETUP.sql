-- ============================================================================
-- FIX: How to Set Admin Role (Bypass Trigger)
-- ============================================================================
-- This script temporarily disables the role change trigger,
-- updates the user role to Admin, then re-enables the trigger.
-- ============================================================================

-- Step 1: Temporarily disable the trigger
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON users;

-- Step 2: Update the user role to Admin
-- Replace 'admin@healthconnect.com' with your actual email
UPDATE users 
SET role = 'Admin' 
WHERE email = 'admin@healthconnect.com';

-- Step 3: Re-enable the trigger
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- Step 4: Verify the change
SELECT email, full_name, role 
FROM users 
WHERE email = 'admin@healthconnect.com';

-- ============================================================================
-- ALTERNATIVE: If you want to set multiple users as Admin
-- ============================================================================

-- Disable trigger
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON users;

-- Update multiple users
UPDATE users 
SET role = 'Admin' 
WHERE email IN ('admin@healthconnect.com', 'another@email.com');

-- Re-enable trigger
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- ============================================================================
-- ALTERNATIVE 2: Create Admin User Directly (No Trigger Issue)
-- ============================================================================
-- This method creates a user with Admin role from the start

-- First, create the auth user in Supabase Dashboard:
-- 1. Go to Authentication → Users → Add User
-- 2. Email: admin@healthconnect.com
-- 3. Password: (set a password)
-- 4. Auto Confirm: ✅
-- 5. Click "Create User"
-- 6. Copy the user ID (UUID)

-- Then run this (replace USER_ID_HERE with the actual UUID):
INSERT INTO users (id, email, full_name, role)
VALUES (
  'USER_ID_HERE',  -- Replace with UUID from auth.users
  'admin@healthconnect.com',
  'Admin User',
  'Admin'
)
ON CONFLICT (id) DO UPDATE SET role = 'Admin';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check all admin users
SELECT id, email, full_name, role, created_at
FROM users
WHERE role = 'Admin'
ORDER BY created_at DESC;

