# 🚀 Quick Start - Run Your Platform Now!

## Step 1: Start the Server

```bash
cd health-connect
npm run dev
```

Wait for: **"Ready on http://localhost:3000"**

---

## Step 2: Open in Browser

Go to: **http://localhost:3000**

---

## Step 3: Test Authentication

### Create Account:

1. Click **"Sign In"** in navbar
2. Click **"Sign up"** link
3. Fill form and create account
4. You'll be redirected to **Patient Dashboard**

### Login:

1. Go to: http://localhost:3000/auth/login
2. Enter your credentials
3. Click "Sign In"
4. See your role-specific dashboard

---

## Step 4: Test Different Roles

### Change Your Role in Supabase:

1. **Go to Supabase Table Editor:**
   - https://supabase.com/dashboard/project/mkrrzggetqnsxnenkvht/editor
   - Click `users` table
   - Find your user
   - Edit `role` field:
     - `Patient` - See patient dashboard
     - `Doctor` - See doctor dashboard
     - `Admin` - See admin dashboard
   - Save
   - **Logout and login again** to see new role

### Or Use SQL:

```sql
-- Make yourself Admin
UPDATE users SET role = 'Admin' WHERE email = 'your-email@example.com';

-- Make yourself Doctor
UPDATE users SET role = 'Doctor' WHERE email = 'your-email@example.com';

-- Back to Patient
UPDATE users SET role = 'Patient' WHERE email = 'your-email@example.com';
```

---

## What Each Role Sees

### 👤 PATIENT (Default)

- **Dashboard:** `/dashboard`
- **Features:**
  - Book consultations
  - View health education
  - Join community groups
  - Make payments
- **Navbar:** Shows Consultations, Education, Community links

### 👨‍⚕️ DOCTOR

- **Dashboard:** `/doctor`
- **Features:**
  - Manage consultations
  - View patients
  - Update profile
  - See consultation stats
- **Navbar:** Shows "My Dashboard" link

### 🛡️ ADMIN

- **Dashboard:** `/admin`
- **Features:**
  - User management
  - Platform analytics
  - System settings
  - Full access to everything
- **Navbar:** Shows "Admin Panel" link

---

## Test Checklist

- [ ] Can signup
- [ ] Can login
- [ ] See Patient dashboard
- [ ] Change role to Doctor - see Doctor dashboard
- [ ] Change role to Admin - see Admin dashboard
- [ ] Navbar shows correct links
- [ ] Protected routes work
- [ ] Sign out works

---

**That's it! Your platform is ready to test!** 🎉

For detailed testing guide, see: `RUN_AND_TEST_GUIDE.md`
