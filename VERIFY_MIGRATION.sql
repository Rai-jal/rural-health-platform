-- ============================================================================
-- VERIFICATION QUERIES
-- Run these in Supabase SQL Editor to verify your migration
-- ============================================================================
 
-- 1. Check all tables exist
SELECT 'TABLES' as category, table_name as item, 'Table' as type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check users table structure
SELECT 
  'USERS TABLE COLUMNS' as category,
  column_name as item,
  data_type || 
    CASE 
      WHEN is_nullable = 'NO' THEN ' NOT NULL'
      ELSE ''
    END ||
    CASE 
      WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default
      ELSE ''
    END as type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Check all functions
SELECT 'FUNCTIONS' as category, routine_name as item, routine_type as type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 4. Check all triggers
SELECT 
  'TRIGGERS' as category,
  trigger_name as item,
  event_manipulation || ' ' || event_object_table as type
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 5. Check all RLS policies
SELECT 
  'RLS POLICIES' as category,
  tablename || '.' || policyname as item,
  cmd as type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Check all indexes
SELECT 
  'INDEXES' as category,
  indexname as item,
  tablename || '(' || indexdef || ')' as type
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 7. Check foreign key relationships
SELECT 
  'FOREIGN KEYS' as category,
  tc.table_name || '.' || kcu.column_name as item,
  '→ ' || ccu.table_name || '.' || ccu.column_name as type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 8. Check if users table is linked to auth.users
SELECT 
  'AUTH LINK' as category,
  'users.id' as item,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = 'users'
        AND kcu.column_name = 'id'
        AND tc.constraint_type = 'FOREIGN KEY'
    ) THEN '✅ Linked to auth.users'
    ELSE '❌ NOT linked to auth.users'
  END as type;

-- 9. Count records in each table (if seed data was run)
SELECT 
  'DATA COUNT' as category,
  table_name as item,
  (
    SELECT COUNT(*) 
    FROM information_schema.tables t2
    WHERE t2.table_name = t1.table_name
  )::text || ' rows' as type
FROM information_schema.tables t1
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Better count query:
SELECT 
  'DATA COUNT' as category,
  'healthcare_providers' as item,
  COUNT(*)::text || ' providers' as type
FROM healthcare_providers
UNION ALL
SELECT 
  'DATA COUNT',
  'health_content',
  COUNT(*)::text || ' content items'
FROM health_content
UNION ALL
SELECT 
  'DATA COUNT',
  'community_groups',
  COUNT(*)::text || ' groups'
FROM community_groups
UNION ALL
SELECT 
  'DATA COUNT',
  'users',
  COUNT(*)::text || ' users'
FROM users
UNION ALL
SELECT 
  'DATA COUNT',
  'events',
  COUNT(*)::text || ' events'
FROM events;

-- 10. Check role constraint on users table
SELECT 
  'CONSTRAINTS' as category,
  constraint_name as item,
  constraint_type as type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY constraint_type;

