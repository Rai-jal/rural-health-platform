-- ============================================================================
-- FIX: All Foreign Key Constraints for healthcare_providers
-- ============================================================================
-- This script fixes ALL foreign key constraints that reference healthcare_providers
-- to allow proper deletion/updates
-- ============================================================================

-- ============================================================================
-- 1. Fix community_groups.moderator_id constraint
-- ============================================================================
ALTER TABLE community_groups 
DROP CONSTRAINT IF EXISTS community_groups_moderator_id_fkey;

ALTER TABLE community_groups
ADD CONSTRAINT community_groups_moderator_id_fkey 
FOREIGN KEY (moderator_id) 
REFERENCES healthcare_providers(id) 
ON DELETE SET NULL;

-- ============================================================================
-- 2. Fix events.organizer_id constraint (if it exists)
-- ============================================================================
ALTER TABLE events 
DROP CONSTRAINT IF EXISTS events_organizer_id_fkey;

ALTER TABLE events
ADD CONSTRAINT events_organizer_id_fkey 
FOREIGN KEY (organizer_id) 
REFERENCES healthcare_providers(id) 
ON DELETE SET NULL;

-- ============================================================================
-- 3. Verify all constraints
-- ============================================================================
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule,
  CASE 
    WHEN rc.delete_rule = 'SET NULL' THEN '✅ Safe to delete'
    WHEN rc.delete_rule = 'CASCADE' THEN '⚠️ Will cascade delete'
    WHEN rc.delete_rule = 'RESTRICT' THEN '❌ Blocks deletion'
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
ORDER BY tc.table_name, kcu.column_name;

-- ============================================================================
-- 4. Check for orphaned references (optional cleanup)
-- ============================================================================
-- Community groups with invalid moderator references
SELECT 
  'community_groups' as table_name,
  COUNT(*) as orphaned_count
FROM community_groups cg
LEFT JOIN healthcare_providers hp ON hp.id = cg.moderator_id
WHERE cg.moderator_id IS NOT NULL AND hp.id IS NULL;

-- Events with invalid organizer references
SELECT 
  'events' as table_name,
  COUNT(*) as orphaned_count
FROM events e
LEFT JOIN healthcare_providers hp ON hp.id = e.organizer_id
WHERE e.organizer_id IS NOT NULL AND hp.id IS NULL;

-- ============================================================================
-- 5. Clean up orphaned references (optional - uncomment if needed)
-- ============================================================================
/*
-- Set moderator_id to NULL for groups with invalid references
UPDATE community_groups
SET moderator_id = NULL
WHERE moderator_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM healthcare_providers 
  WHERE id = community_groups.moderator_id
);

-- Set organizer_id to NULL for events with invalid references
UPDATE events
SET organizer_id = NULL
WHERE organizer_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM healthcare_providers 
  WHERE id = events.organizer_id
);
*/

