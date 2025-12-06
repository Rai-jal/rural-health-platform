-- ============================================================================
-- FIX: Foreign Key Constraints - Complete Fix
-- ============================================================================
-- This script properly fixes the foreign key constraints to use ON DELETE SET NULL
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- Step 1: Drop existing constraints (if they exist with different names)
-- ============================================================================

-- Drop community_groups constraint (try all possible constraint names)
DO $$ 
BEGIN
    -- Try to drop constraint if it exists
    ALTER TABLE community_groups DROP CONSTRAINT IF EXISTS community_groups_moderator_id_fkey;
    ALTER TABLE community_groups DROP CONSTRAINT IF EXISTS community_groups_moderator_id_fkey1;
    ALTER TABLE community_groups DROP CONSTRAINT IF EXISTS community_groups_moderator_id_fkey2;
    
    -- Also try dropping by finding the actual constraint name
    EXECUTE (
        SELECT 'ALTER TABLE community_groups DROP CONSTRAINT IF EXISTS ' || constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'community_groups'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%moderator%'
        LIMIT 1
    );
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Drop events constraint (try all possible constraint names)
DO $$ 
BEGIN
    -- Try to drop constraint if it exists
    ALTER TABLE events DROP CONSTRAINT IF EXISTS events_organizer_id_fkey;
    ALTER TABLE events DROP CONSTRAINT IF EXISTS events_organizer_id_fkey1;
    ALTER TABLE events DROP CONSTRAINT IF EXISTS events_organizer_id_fkey2;
    
    -- Also try dropping by finding the actual constraint name
    EXECUTE (
        SELECT 'ALTER TABLE events DROP CONSTRAINT IF EXISTS ' || constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'events'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%organizer%'
        LIMIT 1
    );
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- Step 2: Find and drop ALL constraints that reference healthcare_providers
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT 
            tc.table_name,
            tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE ccu.table_name = 'healthcare_providers'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name IN ('community_groups', 'events')
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || 
                ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
        RAISE NOTICE 'Dropped constraint % from table %', r.constraint_name, r.table_name;
    END LOOP;
END $$;

-- ============================================================================
-- Step 3: Recreate constraints with ON DELETE SET NULL
-- ============================================================================

-- Recreate community_groups.moderator_id constraint
ALTER TABLE community_groups
ADD CONSTRAINT community_groups_moderator_id_fkey 
FOREIGN KEY (moderator_id) 
REFERENCES healthcare_providers(id) 
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Recreate events.organizer_id constraint
ALTER TABLE events
ADD CONSTRAINT events_organizer_id_fkey 
FOREIGN KEY (organizer_id) 
REFERENCES healthcare_providers(id) 
ON DELETE SET NULL
ON UPDATE CASCADE;

-- ============================================================================
-- Step 4: Verify the constraints were updated correctly
-- ============================================================================

SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    rc.delete_rule,
    rc.update_rule,
    CASE 
        WHEN rc.delete_rule = 'SET NULL' THEN '✅ Safe to delete'
        WHEN rc.delete_rule = 'CASCADE' THEN '⚠️ Will cascade delete'
        WHEN rc.delete_rule = 'RESTRICT' THEN '❌ Blocks deletion'
        WHEN rc.delete_rule = 'NO ACTION' THEN '❌ Blocks deletion'
        ELSE '❓ Unknown'
    END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE ccu.table_name = 'healthcare_providers'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('community_groups', 'events')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- Expected Result:
-- ============================================================================
-- | table_name       | column_name  | foreign_table_name    | delete_rule | update_rule | status            |
-- | ---------------- | ------------ | --------------------- | ----------- | ----------- | ----------------- |
-- | community_groups | moderator_id | healthcare_providers | SET NULL    | CASCADE     | ✅ Safe to delete |
-- | events           | organizer_id | healthcare_providers | SET NULL    | CASCADE     | ✅ Safe to delete |
-- ============================================================================

