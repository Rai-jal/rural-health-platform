-- ============================================================================
-- ADD user_id COLUMN TO healthcare_providers TABLE
-- ============================================================================
-- This migration adds a user_id column to link doctors to their provider profiles
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Add user_id column to healthcare_providers table
ALTER TABLE healthcare_providers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Step 2: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON healthcare_providers(user_id);

-- Step 3: Add unique constraint (one provider profile per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_user_id_unique ON healthcare_providers(user_id) 
WHERE user_id IS NOT NULL;

-- Step 4: Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'healthcare_providers' 
AND column_name = 'user_id';

-- ============================================================================
-- OPTIONAL: Link existing providers to users by matching email
-- ============================================================================
-- If you have existing providers and want to link them to users:
-- (Uncomment and modify as needed)

/*
UPDATE healthcare_providers hp
SET user_id = u.id
FROM users u
WHERE hp.full_name = u.full_name
AND hp.user_id IS NULL
AND u.role = 'Doctor';
*/

