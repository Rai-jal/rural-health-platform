# 🔐 How to Login as Admin - Complete Guide

## Overview

There are **no default admin credentials**. You need to create an account first, then change your role to "Admin" in Supabase.

---

## Method 1: Create Account + Change Role (Recommended)

### Step 1: Create a New Account

1. **Start your development server:**

   ```bash
   cd health-connect
   npm run dev
   ```

2. **Go to signup page:**

   - Open: http://localhost:3000/auth/signup
   - Or click "Sign In" → "Sign up" link

3. **Fill in the form:**

   - **Full Name:** `Admin User` (or any name)
   - **Email:** `admin@healthconnect.com` (use your real email)
   - **Phone Number:** `+23276123456` (optional)
   - **Password:** `admin123456` (min 6 characters)
   - **Confirm Password:** `admin123456`

4. **Click "Sign Up"**
   - You'll be redirected to login page
   - A user profile is automatically created with role = "Patient"

---

### Step 2: Change Role to Admin in Supabase

#### Option A: Using Supabase Dashboard (Easiest)

1. **Go to Supabase Table Editor:**

   - https://supabase.com/dashboard/project/mkrrzggetqnsxnenkvht/editor
   - Or: Your Project → Table Editor → `users` table

2. **Find your user:**

   - Look for the email you just signed up with
   - Click on the row to edit

3. **Change the `role` field:**

   - Find the `role` column
   - Change from `Patient` to `Admin`
   - Click "Save" or press Enter

4. **Verify:**
   - The `role` column should now show `Admin`

#### Option B: Using SQL Editor (Faster)

⚠️ **Important:** The trigger prevents direct role updates. Use this method:

1. **Go to Supabase SQL Editor:**

   - https://supabase.com/dashboard/project/mkrrzggetqnsxnenkvht/sql/new
   - Or: Your Project → SQL Editor → New Query

2. **Run this SQL (temporarily disables trigger):**

   ```sql
   -- Step 1: Temporarily disable the trigger
   DROP TRIGGER IF EXISTS prevent_role_change_trigger ON users;

   -- Step 2: Update the role (replace with your email)
   UPDATE users
   SET role = 'Admin'
   WHERE email = 'admin@healthconnect.com';

   -- Step 3: Re-enable the trigger
   CREATE TRIGGER prevent_role_change_trigger
     BEFORE UPDATE ON users
     FOR EACH ROW
     EXECUTE FUNCTION public.prevent_role_change();

   -- Step 4: Verify
   SELECT email, full_name, role
   FROM users
   WHERE email = 'admin@healthconnect.com';
   ```

3. **Or use the complete fix script:**
   - See `FIX_ADMIN_ROLE_SETUP.sql` file for the complete solution

---

### Step 3: Login as Admin

1. **Go to login page:**

   - http://localhost:3000/auth/login

2. **Enter your credentials:**

   - **Email:** `admin@healthconnect.com` (your email)
   - **Password:** `admin123456` (your password)

3. **Click "Sign In"**

4. **You should be redirected to:**
   - `/admin` - Admin Dashboard
   - You'll see "Admin Dashboard" with platform statistics

---

## Method 2: Create Admin Directly via SQL (Advanced)

If you want to create an admin user directly without signing up first:

### Step 1: Create Auth User in Supabase

1. **Go to Authentication:**

   - https://supabase.com/dashboard/project/mkrrzggetqnsxnenkvht/auth/users
   - Click "Add User" → "Create new user"

2. **Fill in:**
   - **Email:** `admin@healthconnect.com`
   - **Password:** `admin123456`
   - **Auto Confirm User:** ✅ (check this)
   - Click "Create User"

### Step 2: Create User Profile with Admin Role

1. **Go to SQL Editor:**

   - Run this SQL (replace with the user ID from step 1):

   ```sql
   -- First, get the user ID from auth.users
   SELECT id, email FROM auth.users WHERE email = 'admin@healthconnect.com';

   -- Then insert into users table with Admin role
   -- Replace 'USER_ID_HERE' with the actual UUID from above
   INSERT INTO users (id, email, full_name, role)
   VALUES (
     'USER_ID_HERE',  -- Replace with actual UUID
     'admin@healthconnect.com',
     'Admin User',
     'Admin'
   );
   ```

2. **Or use this combined query:**
   ```sql
   INSERT INTO users (id, email, full_name, role)
   SELECT
     id,
     email,
     'Admin User',
     'Admin'
   FROM auth.users
   WHERE email = 'admin@healthconnect.com'
   ON CONFLICT (id) DO UPDATE SET role = 'Admin';
   ```

### Step 3: Login

- Go to: http://localhost:3000/auth/login
- Email: `admin@healthconnect.com`
- Password: `admin123456`
- Click "Sign In"

---

## Quick Reference: Admin Credentials

After setup, your admin credentials will be:

- **Email:** `admin@healthconnect.com` (or whatever email you used)
- **Password:** `admin123456` (or whatever password you set)
- **Role:** `Admin`

---

## Verify You're Logged in as Admin

Once logged in, you should see:

1. **URL:** `/admin` (not `/dashboard`)
2. **Page Title:** "Admin Dashboard"
3. **Navbar:** Shows "Admin Panel" link
4. **Dashboard Shows:**
   - Total Users
   - Total Consultations
   - Total Revenue
   - Healthcare Providers
   - Additional statistics

---

## Troubleshooting

### Problem: "Unauthorized" or redirected to `/unauthorized`

**Solution:**

- Make sure you changed the role to `Admin` (not `admin` or `ADMIN`)
- Logout and login again after changing role
- Clear browser cache/cookies

### Problem: Still seeing Patient Dashboard

**Solution:**

1. Check your role in Supabase:
   ```sql
   SELECT email, role FROM users WHERE email = 'your-email@example.com';
   ```
2. If it's not `Admin`, update it:
   ```sql
   UPDATE users SET role = 'Admin' WHERE email = 'your-email@example.com';
   ```
3. Logout completely and login again

### Problem: Can't find user in Supabase

**Solution:**

- Make sure you completed the signup process
- Check `auth.users` table in Supabase Authentication section
- Check `users` table in Table Editor

---

## Create Multiple Admin Users

To create additional admin users:

```sql
-- Method 1: Change existing user
UPDATE users SET role = 'Admin' WHERE email = 'another@email.com';

-- Method 2: Create new admin during signup, then run:
UPDATE users SET role = 'Admin' WHERE email = 'newadmin@email.com';
```

---

## Security Note

⚠️ **Important:** In production, make sure to:

- Use strong passwords
- Limit admin access to trusted users only
- Regularly audit admin users
- Consider using environment variables for initial admin setup

---

## Test Admin Features

Once logged in as admin, you can:

1. **View Platform Statistics:**

   - Total users, consultations, revenue
   - User growth metrics
   - Platform analytics

2. **Access Admin Dashboard:**

   - `/admin` - Full admin panel

3. **Manage Users:**

   - View all users
   - Change user roles (when implemented)

4. **View All Data:**
   - All consultations
   - All payments
   - All users

---

**Last Updated:** Current session
**Status:** ✅ Ready to use
