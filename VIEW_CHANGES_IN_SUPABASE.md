# 📊 How to View Changes in Supabase Dashboard

This guide shows you how to see all the changes made by the SQL migration in your Supabase dashboard.

---

## 🔍 Step 1: View All Tables

### Method 1: Table Editor (Easiest)

1. **Go to Table Editor:**

   - https://supabase.com/dashboard/project/mkrrzggetqnsxnenkvht/editor
   - Click **"Table Editor"** in the left sidebar

2. **You should see these tables:**

   - ✅ `users` (with `role`, `email`, `full_name` columns)
   - ✅ `healthcare_providers`
   - ✅ `consultations`
   - ✅ `payments`
   - ✅ `health_content`
   - ✅ `community_groups`
   - ✅ `group_members`
   - ✅ `discussions`
   - ✅ `discussion_replies`
   - ✅ `events`
   - ✅ `event_attendees`

3. **Click on `users` table** to see:
   - Column names
   - Data types
   - Constraints
   - Sample data (if any)

### Method 2: Database Schema

1. **Go to Database:**

   - https://supabase.com/dashboard/project/mkrrzggetqnsxnenkvht/database
   - Click **"Tables"** tab

2. **See visual schema:**
   - All tables with relationships
   - Foreign keys shown as lines
   - Click any table to see details

---

## 🔐 Step 2: View Authentication Setup

### Check Users Table Structure:

1. **In Table Editor, click `users` table**
2. **Click "View Structure" or look at columns:**
   - `id` (UUID, Primary Key, References auth.users)
   - `email` (VARCHAR, Unique, Not Null)
   - `phone_number` (VARCHAR, Unique, Nullable)
   - `full_name` (VARCHAR, Not Null)
   - `age` (INTEGER, Nullable)
   - `preferred_language` (VARCHAR, Default: 'English')
   - `location` (VARCHAR, Nullable)
   - `role` (VARCHAR, Default: 'Patient', Check constraint)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

### Check Row Level Security (RLS):

1. **Go to Authentication:**

   - https://supabase.com/dashboard/project/mkrrzggetqnsxnenkvht/auth/policies
   - Click **"Policies"** tab

2. **Select `users` table from dropdown**

3. **You should see 4 policies:**
   - ✅ "Users can view own profile" (SELECT)
   - ✅ "Users can update own profile" (UPDATE)
   - ✅ "Admins can view all users" (SELECT)
   - ✅ "Admins can update any user" (UPDATE)

---

## ⚙️ Step 3: View Functions & Triggers

### Check Trigger Function:

1. **Go to Database:**

   - https://supabase.com/dashboard/project/mkrrzggetqnsxnenkvht/database
   - Click **"Functions"** tab

2. **You should see:**
   - ✅ `handle_new_user()` - Creates user profile on signup
   - ✅ `prevent_role_change()` - Prevents non-admins from changing roles

### Check Triggers:

1. **In Database, click "Triggers" tab**

2. **You should see:**

   - ✅ `on_auth_user_created` - Fires when user signs up
   - ✅ `prevent_role_change_trigger` - Fires before user update

3. **Click on a trigger to see:**
   - Which table it's on
   - When it fires (BEFORE/AFTER)
   - Which function it calls

---

## 📋 Step 4: View Indexes

1. **Go to Database → Tables**
2. **Click on any table (e.g., `users`)**
3. **Click "Indexes" tab**
4. **You should see:**
   - `idx_users_role` on `users(role)`
   - `idx_users_email` on `users(email)`
   - `idx_users_phone` on `users(phone_number)`
   - And indexes on other tables

---

## 🔗 Step 5: View Foreign Key Relationships

1. **Go to Database → Tables**
2. **Click on `consultations` table**
3. **Click "Relationships" tab**
4. **You should see:**

   - `consultations.user_id` → `users.id`
   - `consultations.provider_id` → `healthcare_providers.id`

5. **Check other tables:**
   - `payments` → references `consultations` and `users`
   - `group_members` → references `community_groups` and `users`
   - etc.

---

## 📊 Step 6: View Sample Data (If You Ran Seed Script)

1. **Go to Table Editor**
2. **Click on `healthcare_providers` table**
3. **You should see 6 sample providers:**

   - Dr. Fatima Kamara
   - Dr. Aminata Sesay
   - Dr. Mariama Bangura
   - Nurse Sarah Kamara
   - Midwife Fatima Sesay
   - Nutritionist Adama Bangura

4. **Click on `health_content` table**
5. **You should see 12 sample health content items**

6. **Click on `community_groups` table**
7. **You should see 4 sample groups**

---

## 🧪 Step 7: Test and See Live Data

### Create a Test User:

1. **Go to your app:**

   - http://localhost:3000/auth/signup

2. **Create an account**

3. **Go back to Supabase:**

   - Table Editor → `users` table
   - Click "Refresh" or reload page

4. **You should see:**
   - Your new user in the table
   - `role` = 'Patient'
   - `email` = your email
   - `full_name` = your name
   - `id` = UUID (matches auth.users)

### Check Auth Users:

1. **Go to Authentication:**

   - https://supabase.com/dashboard/project/mkrrzggetqnsxnenkvht/auth/users
   - Click **"Users"** tab

2. **You should see:**

   - Your test user
   - Email
   - Created timestamp
   - Last sign in

3. **The `id` should match the `id` in `users` table** ✅

---

## 📝 Step 8: View SQL History

1. **Go to SQL Editor:**

   - https://supabase.com/dashboard/project/mkrrzggetqnsxnenkvht/editor
   - Click **"History"** tab (or look for saved queries)

2. **You should see:**
   - The SQL query you ran
   - When it was executed
   - Results

---

## 🔍 Step 9: Verify Everything with SQL Queries

Run these queries in SQL Editor to verify:

### Check All Tables:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Check All Functions:

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

### Check All Triggers:

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

### Check All Policies:

```sql
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check Users Table Structure:

```sql
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;
```

### Check Foreign Keys:

```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
```

---

## 📸 Visual Checklist

### ✅ What You Should See:

**In Table Editor:**

- [ ] 11 tables listed
- [ ] `users` table has `role` column
- [ ] `users` table has `email` column
- [ ] Sample data in `healthcare_providers` (if seed script ran)
- [ ] Sample data in `health_content` (if seed script ran)

**In Database → Functions:**

- [ ] `handle_new_user()` function exists
- [ ] `prevent_role_change()` function exists

**In Database → Triggers:**

- [ ] `on_auth_user_created` trigger exists
- [ ] `prevent_role_change_trigger` trigger exists

**In Authentication → Policies:**

- [ ] 4 policies for `users` table
- [ ] Policies are enabled (green toggle)

**After Creating Test Account:**

- [ ] User appears in `users` table
- [ ] User appears in `auth.users`
- [ ] IDs match between both tables
- [ ] Role is set to 'Patient'

---

## 🎯 Quick Verification Commands

Copy and paste this in SQL Editor to see everything at once:

```sql
-- Show all tables
SELECT 'TABLES' as type, table_name as name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Show all functions
SELECT 'FUNCTIONS' as type, routine_name as name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Show all triggers
SELECT 'TRIGGERS' as type, trigger_name as name
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;

-- Show all policies
SELECT 'POLICIES' as type, tablename || '.' || policyname as name
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🆘 Troubleshooting

### Can't see tables?

- Make sure you ran the SQL script successfully
- Check SQL Editor history for errors
- Try refreshing the page

### Can't see policies?

- Go to Authentication → Policies
- Make sure `users` table is selected in dropdown
- Policies should be visible there

### Can't see triggers?

- Go to Database → Triggers
- They should be listed there
- If not, the trigger creation might have failed

### User not appearing after signup?

- Check Database → Functions → `handle_new_user()` exists
- Check Database → Triggers → `on_auth_user_created` exists
- Check Supabase logs for errors
- Verify RLS policies are set up

---

**Now you can see all the changes in your Supabase dashboard!** 🎉
