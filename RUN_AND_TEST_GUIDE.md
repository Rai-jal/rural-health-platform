                                                                                                                                                                                                                                                        # 🚀 Run and Test Your Platform - Complete Guide

This guide shows you how to run the platform and test all user interfaces.

---

## Step 1: Start the Development Server

```bash
cd health-connect
npm run dev
```

**Wait for:** "Ready on http://localhost:3000"

---

## Step 2: Access the Application

Open your browser and go to:
**http://localhost:3000**

---

## Step 3: Test Authentication Flow

### A. Test Signup (Create New Account)

1. **Click "Sign In"** in the navbar (or go to `/auth/login`)
2. **Click "Sign up"** link at bottom
3. **Or go directly to:** http://localhost:3000/auth/signup

4. **Fill in the form:**

   - Full Name: `Test User`
   - Email: `test@example.com` (use a real email)
   - Phone Number: `+23276123456` (optional)
   - Password: `password123` (min 6 characters)
   - Confirm Password: `password123`

5. **Click "Sign Up"**
6. **Check Supabase:**
   - Go to Table Editor → `users` table
   - You should see your new user
   - `role` should be `Patient`
   - `email` should match

### B. Test Login

1. **Go to:** http://localhost:3000/auth/login
2. **Enter credentials:**
   - Email: `test@example.com`
   - Password: `password123`
3. **Click "Sign In"**
4. **Should redirect to:** `/dashboard` (Patient dashboard)

---

## Step 4: Test Different User Roles

### Create Test Users with Different Roles

You need to manually change roles in Supabase for testing:

#### Option 1: Via Supabase Dashboard

1. **Go to Table Editor:**

   - https://supabase.com/dashboard/project/mkrrzggetqnsxnenkvht/editor
   - Click `users` table

2. **Find your user** and click to edit

3. **Change `role` field:**

   - For Admin: Change to `Admin`
   - For Doctor: Change to `Doctor`
   - For Patient: Keep as `Patient`

4. **Save changes**

5. **Logout and login again** to see new role

#### Option 2: Via SQL (Faster)

Run in Supabase SQL Editor:

```sql
-- Make yourself an Admin (replace email with your email)
UPDATE users
SET role = 'Admin'
WHERE email = 'test@example.com';

-- Or make yourself a Doctor
UPDATE users
SET role = 'Doctor'
WHERE email = 'test@example.com';

-- Or back to Patient
UPDATE users
SET role = 'Patient'
WHERE email = 'test@example.com';
```

---

## Step 5: What Each Role Sees

### 👤 PATIENT Role (Default)

**Dashboard:** `/dashboard`

- Welcome message with name
- Quick stats (consultations, content viewed, etc.)
- Quick action cards:
  - Book Consultation
  - Health Education
  - Payments
  - Community
- Recent consultations
- Health tips

**Accessible Pages:**

- ✅ `/` - Home page
- ✅ `/dashboard` - Patient dashboard
- ✅ `/consultation` - Book consultations
- ✅ `/education` - Health education content
- ✅ `/payments` - Payment options
- ✅ `/community` - Community groups

**Not Accessible:**

- ❌ `/admin` - Redirects to `/unauthorized`
- ❌ `/doctor` - Redirects to `/unauthorized`

**Navbar Shows:**

- Dashboard link
- Consultations link
- Education link
- Community link
- User name with "Patient" badge
- Sign Out button

---

### 👨‍⚕️ DOCTOR Role

**Dashboard:** `/doctor` (auto-redirects from `/dashboard`)

- Doctor-specific dashboard
- Stats: Today's consultations, Pending, Total patients, Rating
- Features:
  - Manage Consultations
  - My Patients
  - My Profile
- Upcoming consultations list

**Accessible Pages:**

- ✅ `/` - Home page
- ✅ `/doctor` - Doctor dashboard
- ✅ `/consultation` - Can view consultations
- ✅ `/education` - Health education
- ✅ `/community` - Community features

**Not Accessible:**

- ❌ `/admin` - Redirects to `/unauthorized`

**Navbar Shows:**

- Dashboard link
- "My Dashboard" link (Doctor dashboard)
- User name with "Healthcare Provider" badge
- Sign Out button

---

### 🛡️ ADMIN Role

**Dashboard:** `/admin` (auto-redirects from `/dashboard`)

- Admin dashboard
- Stats: Total users, Total consultations, Total revenue, Healthcare providers
- Admin features:
  - User Management
  - Analytics & Reports
  - System Settings
- Quick actions panel

**Accessible Pages:**

- ✅ `/` - Home page
- ✅ `/admin` - Admin dashboard
- ✅ `/doctor` - Can access doctor features
- ✅ `/consultation` - All consultations
- ✅ `/education` - All content
- ✅ `/community` - All community features
- ✅ **ALL PAGES** - Full access

**Navbar Shows:**

- Dashboard link
- "Admin Panel" link
- User name with "Administrator" badge
- Sign Out button

---

## Step 6: Test Navigation

### Test Navbar:

1. **When Logged Out:**

   - Shows "Sign In" button
   - No navigation menu

2. **When Logged In as Patient:**

   - Shows Dashboard, Consultations, Education, Community links
   - Shows user name and "Patient" badge
   - Shows Sign Out button

3. **When Logged In as Doctor:**

   - Shows Dashboard, "My Dashboard" (doctor) link
   - Shows user name and "Healthcare Provider" badge
   - Shows Sign Out button

4. **When Logged In as Admin:**
   - Shows Dashboard, "Admin Panel" link
   - Shows user name and "Administrator" badge
   - Shows Sign Out button

### Test Route Protection:

1. **Try accessing `/admin` as Patient:**

   - Should redirect to `/unauthorized`
   - Shows "Access Denied" message

2. **Try accessing `/doctor` as Patient:**

   - Should redirect to `/unauthorized`

3. **Try accessing protected pages when logged out:**
   - Should redirect to `/auth/login`
   - After login, redirects back to original page

---

## Step 7: Test Features by Role

### As PATIENT:

1. **Book Consultation:**

   - Go to `/consultation`
   - Select consultation type (Video/Voice/SMS)
   - Select healthcare provider
   - Fill in details
   - Book consultation

2. **View Health Education:**

   - Go to `/education`
   - Browse health content
   - Filter by category
   - Search content

3. **View Community:**

   - Go to `/community`
   - See support groups
   - View events
   - See discussions

4. **View Payments:**
   - Go to `/payments`
   - See payment options
   - View payment methods

### As DOCTOR:

1. **View Doctor Dashboard:**

   - See consultation stats
   - View patient list
   - Manage profile

2. **View Consultations:**
   - See consultations assigned to you
   - Update consultation status
   - Add notes

### As ADMIN:

1. **View Admin Dashboard:**

   - See platform-wide stats
   - Access user management
   - View analytics

2. **Manage Users:**
   - View all users
   - Change user roles
   - Activate/deactivate users

---

## Step 8: Test Authentication States

### Test Sign Out:

1. **Click "Sign Out"** in navbar
2. **Should redirect to:** `/auth/login`
3. **Navbar should show:** "Sign In" button only

### Test Session Persistence:

1. **Login**
2. **Refresh page** (F5)
3. **Should stay logged in**
4. **Close browser and reopen**
5. **Should still be logged in** (if cookies persist)

### Test Protected Routes:

1. **Logout**
2. **Try to access:** `/dashboard`
3. **Should redirect to:** `/auth/login?redirect=/dashboard`
4. **After login, should redirect back to:** `/dashboard`

---

## Step 9: Visual Checklist

### ✅ What You Should See:

**Home Page (`/`):**

- [ ] Navbar with logo
- [ ] Hero section
- [ ] Platform access methods
- [ ] Key features
- [ ] Footer

**Login Page (`/auth/login`):**

- [ ] Email and password fields
- [ ] "Sign In" button
- [ ] "Sign up" link
- [ ] Form validation

**Signup Page (`/auth/signup`):**

- [ ] Full name, email, phone, password fields
- [ ] "Sign Up" button
- [ ] "Sign in" link
- [ ] Form validation

**Patient Dashboard (`/dashboard`):**

- [ ] Welcome message with name
- [ ] Quick stats cards
- [ ] Quick action cards (4 cards)
- [ ] Recent consultations section
- [ ] Health tips section
- [ ] Navbar with patient badge

**Doctor Dashboard (`/doctor`):**

- [ ] Doctor-specific welcome
- [ ] Consultation stats
- [ ] Doctor features (3 cards)
- [ ] Upcoming consultations
- [ ] Navbar with healthcare provider badge

**Admin Dashboard (`/admin`):**

- [ ] Admin welcome
- [ ] Platform-wide stats
- [ ] Admin features (3 cards)
- [ ] Quick actions
- [ ] Navbar with administrator badge

**Navbar:**

- [ ] Shows correct links based on role
- [ ] Shows user name
- [ ] Shows role badge
- [ ] Sign Out button works

---

## Step 10: Common Issues & Fixes

### Issue: "Unauthorized" when accessing pages

**Fix:** Make sure you're logged in and have the correct role

### Issue: Can't see role-specific dashboard

**Fix:**

1. Check your role in Supabase `users` table
2. Logout and login again
3. Clear browser cache

### Issue: Navbar not showing

**Fix:**

1. Check browser console for errors
2. Make sure `components/navbar.tsx` exists
3. Restart dev server

### Issue: Redirect loops

**Fix:**

1. Clear browser cookies
2. Check middleware is working
3. Verify environment variables

---

## 🎯 Quick Test Scenarios

### Scenario 1: New User Journey

1. Visit homepage
2. Click "Sign In"
3. Click "Sign up"
4. Create account
5. Auto-redirect to dashboard
6. See Patient dashboard
7. Try booking consultation

### Scenario 2: Role Switching

1. Login as Patient
2. See Patient dashboard
3. Change role to Doctor in Supabase
4. Logout and login again
5. Auto-redirect to Doctor dashboard
6. See Doctor features

### Scenario 3: Admin Access

1. Change role to Admin in Supabase
2. Logout and login
3. Auto-redirect to Admin dashboard
4. See all platform stats
5. Try accessing `/doctor` - should work
6. Try accessing `/admin` - should work

---

## ✅ Success Indicators

You'll know everything works when:

- ✅ Can signup and login
- ✅ See correct dashboard based on role
- ✅ Navbar shows correct links
- ✅ Protected routes work
- ✅ Role-based access works
- ✅ Sign out works
- ✅ No console errors
- ✅ Pages load correctly

---

## 📸 Screenshots to Verify

Take screenshots of:

1. Login page
2. Signup page
3. Patient dashboard
4. Doctor dashboard
5. Admin dashboard
6. Navbar (for each role)
7. Unauthorized page

---

**Now start your server and test everything!** 🚀

```bash
npm run dev
```

Then visit: **http://localhost:3000**
