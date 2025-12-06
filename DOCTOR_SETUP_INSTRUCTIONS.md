# 👨‍⚕️ Doctor Dashboard Setup Instructions

## Problem: "Failed to load patients" Error

If you're seeing "Failed to load patients" when clicking on "My Patients" tab, it's because:

1. The `healthcare_providers` table doesn't have a `user_id` column to link doctors to their provider profiles
2. The doctor doesn't have a provider profile created yet

---

## ✅ Solution: Run Database Migration

### Step 1: Add `user_id` Column to `healthcare_providers` Table

**Run this SQL in Supabase SQL Editor:**

```sql
-- Add user_id column to healthcare_providers table
ALTER TABLE healthcare_providers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON healthcare_providers(user_id);

-- Add unique constraint (one provider profile per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_user_id_unique ON healthcare_providers(user_id) 
WHERE user_id IS NOT NULL;
```

**Or use the complete script:** `ADD_USER_ID_TO_PROVIDERS.sql`

---

### Step 2: Create Provider Profile for Doctor

After adding the `user_id` column, doctors need to create their provider profile. This can be done in two ways:

#### Option A: Through the Doctor Dashboard (Recommended)

1. **Login as Doctor**
2. **Go to Profile Settings** (`/doctor/profile`)
3. **Fill in the form:**
   - Full Name
   - Specialty (e.g., "General Practice", "Pediatrics")
   - Languages (comma-separated, e.g., "English, French, Krio")
   - Experience (years)
   - Location
   - Availability status
4. **Click "Save Changes"**

This will automatically create a provider profile linked to the doctor's user account.

#### Option B: Via SQL (For Testing)

If you want to create a provider profile directly via SQL:

```sql
-- Replace 'doctor@example.com' with the doctor's email
INSERT INTO healthcare_providers (
  user_id,
  full_name,
  specialty,
  languages,
  experience_years,
  location,
  is_available
)
SELECT 
  u.id,
  u.full_name,
  'General Practice',  -- Change as needed
  ARRAY['English'],    -- Change as needed
  5,                   -- Years of experience
  'Freetown',          -- Location
  true                 -- Available
FROM users u
WHERE u.email = 'doctor@example.com'
AND u.role = 'Doctor'
ON CONFLICT (user_id) DO NOTHING;
```

---

## 🔍 Verify Setup

### Check if Provider Profile Exists

```sql
-- Check if doctor has a provider profile
SELECT 
  u.email,
  u.full_name,
  u.role,
  hp.id as provider_id,
  hp.specialty,
  hp.is_available
FROM users u
LEFT JOIN healthcare_providers hp ON hp.user_id = u.id
WHERE u.email = 'doctor@example.com'
AND u.role = 'Doctor';
```

### Expected Result:

If setup is correct, you should see:
- `provider_id` is NOT NULL
- `specialty` has a value
- `is_available` is true/false

If `provider_id` is NULL, the doctor needs to create their profile.

---

## 🎯 How It Works

1. **Doctor logs in** → System checks for provider profile
2. **If no profile exists:**
   - Dashboard shows zeros for all stats
   - "My Patients" shows empty list
   - "Consultations" shows empty list
3. **Doctor creates profile** → Via Profile Settings page
4. **After profile creation:**
   - All features work correctly
   - Can see patients, consultations, stats
   - Can manage consultations

---

## 🐛 Troubleshooting

### Issue: "Doctor profile not found" error

**Solution:** The doctor needs to create their provider profile via `/doctor/profile` page.

### Issue: Still seeing "Failed to load patients"

**Check:**
1. Did you run the SQL migration to add `user_id` column? ✅
2. Does the doctor have a provider profile? (Check via SQL above)
3. Are there any consultations linked to this doctor's provider_id?
4. Check browser console for detailed error messages

### Issue: No data showing even after creating profile

**Possible causes:**
1. No consultations have been created yet
2. Consultations exist but aren't linked to this doctor's provider_id
3. Check if `provider_id` in `consultations` table matches the doctor's provider `id`

---

## 📝 Next Steps After Setup

1. ✅ Run the SQL migration (`ADD_USER_ID_TO_PROVIDERS.sql`)
2. ✅ Login as doctor
3. ✅ Go to `/doctor/profile`
4. ✅ Fill in and save profile information
5. ✅ Go to `/doctor/patients` - should now work!
6. ✅ Create test consultations to see data populate

---

**Last Updated:** Current session

