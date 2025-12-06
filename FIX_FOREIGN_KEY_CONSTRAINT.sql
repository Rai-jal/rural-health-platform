-- ============================================================================
-- FIX: Foreign Key Constraint Error on healthcare_providers
-- ============================================================================
-- Problem: Cannot delete/update healthcare_providers because community_groups
--          has moderator_id that references it
-- Solution: Update foreign key constraint to handle deletions properly
-- ============================================================================

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE community_groups 
DROP CONSTRAINT IF EXISTS community_groups_moderator_id_fkey;

-- Step 2: Recreate the constraint with ON DELETE SET NULL
-- This means if a provider is deleted, the moderator_id will be set to NULL
-- instead of preventing the deletion
ALTER TABLE community_groups
ADD CONSTRAINT community_groups_moderator_id_fkey 
FOREIGN KEY (moderator_id) 
REFERENCES healthcare_providers(id) 
ON DELETE SET NULL;

-- Step 3: Verify the constraint was updated
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'community_groups'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'moderator_id';

-- ============================================================================
-- ALTERNATIVE: If you want to CASCADE delete (delete groups when provider deleted)
-- ============================================================================
-- Uncomment this if you want groups to be deleted when their moderator is deleted:

/*
ALTER TABLE community_groups 
DROP CONSTRAINT IF EXISTS community_groups_moderator_id_fkey;

ALTER TABLE community_groups
ADD CONSTRAINT community_groups_moderator_id_fkey 
FOREIGN KEY (moderator_id) 
REFERENCES healthcare_providers(id) 
ON DELETE CASCADE;
*/

-- ============================================================================
-- Check for any orphaned references (optional)
-- ============================================================================
-- This query shows community groups that reference providers that don't exist
SELECT 
  cg.id,
  cg.name,
  cg.moderator_id,
  CASE 
    WHEN hp.id IS NULL THEN '❌ Orphaned reference'
    ELSE '✅ Valid reference'
  END as status
FROM community_groups cg
LEFT JOIN healthcare_providers hp ON hp.id = cg.moderator_id
WHERE cg.moderator_id IS NOT NULL;

