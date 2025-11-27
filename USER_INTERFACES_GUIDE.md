# 👥 User Interfaces Guide - What Each Role Sees

This guide shows you exactly what each user role sees and can do in the platform.

---

## 🚀 Quick Start

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   - http://localhost:3000

3. **Test authentication:**
   - Signup at `/auth/signup`
   - Login at `/auth/login`
   - See role-specific dashboard

---

## 👤 PATIENT Interface (Default Role)

### Dashboard: `/dashboard`

**What They See:**
- ✅ Welcome message: "Welcome back, [Name]!"
- ✅ Role badge: "Patient"
- ✅ Quick stats:
  - Upcoming Consultations: 0
  - Health Content Viewed: 0
  - Community Groups: 0
  - Total Payments: Le 0
- ✅ Quick action cards:
  - **Book Consultation** → `/consultation`
  - **Health Education** → `/education`
  - **Payments** → `/payments`
  - **Community** → `/community`
- ✅ Recent Consultations section (empty initially)
- ✅ Health Tips section

**Navbar Shows:**
- HealthConnect logo (links to home)
- **Dashboard** link
- **Consultations** link (with phone icon)
- **Education** link (with book icon)
- **Community** link (with users icon)
- User name with green "Patient" badge
- **Sign Out** button

**Accessible Pages:**
- ✅ `/` - Home page
- ✅ `/dashboard` - Patient dashboard
- ✅ `/consultation` - Book consultations
- ✅ `/education` - Health education content
- ✅ `/payments` - Payment options
- ✅ `/community` - Community groups

**Blocked Pages:**
- ❌ `/admin` → Redirects to `/unauthorized`
- ❌ `/doctor` → Redirects to `/unauthorized`

**Features They Can Use:**
1. **Book Consultations:**
   - Choose consultation type (Video/Voice/SMS)
   - Select healthcare provider
   - Schedule appointment
   - View consultation history

2. **Health Education:**
   - Browse health content
   - Filter by category
   - Search content
   - Download for offline access
   - Listen to audio content

3. **Community:**
   - Join support groups
   - View events
   - Participate in discussions
   - Connect with other patients

4. **Payments:**
   - View payment options
   - Make payments for consultations
   - View payment history
   - Use mobile money

---

## 👨‍⚕️ DOCTOR Interface

### Dashboard: `/doctor` (Auto-redirects from `/dashboard`)

**What They See:**
- ✅ Welcome: "Welcome, Dr. [Name]"
- ✅ Role badge: "Healthcare Provider"
- ✅ Stats:
  - Today's Consultations: 0
  - Pending Consultations: 0
  - Total Patients: 0
  - Your Rating: 0.0
- ✅ Feature cards:
  - **Manage Consultations** - View and manage patient consultations
  - **My Patients** - View patient list and history
  - **My Profile** - Manage professional profile
- ✅ Upcoming Consultations section

**Navbar Shows:**
- HealthConnect logo
- **Dashboard** link
- **My Dashboard** link (doctor-specific, with stethoscope icon)
- User name with blue "Healthcare Provider" badge
- **Sign Out** button

**Accessible Pages:**
- ✅ `/` - Home page
- ✅ `/doctor` - Doctor dashboard
- ✅ `/consultation` - View consultations
- ✅ `/education` - Health education
- ✅ `/community` - Community features

**Blocked Pages:**
- ❌ `/admin` → Redirects to `/unauthorized`

**Features They Can Use:**
1. **Manage Consultations:**
   - View scheduled consultations
   - Accept/decline consultation requests
   - Update consultation status
   - Add consultation notes
   - View consultation history

2. **Patient Management:**
   - View patient profiles
   - See consultation history per patient
   - Access medical records
   - Communicate with patients

3. **Profile Management:**
   - Update specialty
   - Set availability schedule
   - Manage languages spoken
   - View statistics and ratings

4. **View Analytics:**
   - Total consultations
   - Patient count
   - Average rating
   - Consultation trends

---

## 🛡️ ADMIN Interface

### Dashboard: `/admin` (Auto-redirects from `/dashboard`)

**What They See:**
- ✅ Welcome: "Welcome, [Name]"
- ✅ Role badge: "Administrator"
- ✅ Platform-wide stats:
  - Total Users: 0
  - Total Consultations: 0
  - Total Revenue: Le 0
  - Healthcare Providers: 0
- ✅ Admin feature cards:
  - **User Management** - Manage all users and roles
  - **Analytics & Reports** - Platform statistics
  - **System Settings** - Configure platform
- ✅ Quick actions panel

**Navbar Shows:**
- HealthConnect logo
- **Dashboard** link
- **Admin Panel** link (with shield icon)
- User name with red "Administrator" badge
- **Sign Out** button

**Accessible Pages:**
- ✅ `/` - Home page
- ✅ `/admin` - Admin dashboard
- ✅ `/doctor` - Can access doctor features
- ✅ `/consultation` - All consultations
- ✅ `/education` - All content
- ✅ `/community` - All community features
- ✅ **ALL PAGES** - Full access to everything

**Features They Can Use:**
1. **User Management:**
   - View all users
   - Change user roles (Patient/Doctor/Admin)
   - Activate/deactivate users
   - View user activity logs
   - Manage user permissions

2. **Analytics & Reports:**
   - User growth metrics
   - Consultation statistics
   - Revenue reports
   - Content performance
   - Platform usage analytics

3. **System Settings:**
   - Manage healthcare providers
   - Configure payment methods
   - System configuration
   - Content moderation
   - Platform settings

4. **Full Platform Access:**
   - Can access any page
   - Can view all data
   - Can modify any content
   - Can manage all users

---

## 🔐 Authentication Pages

### Login Page: `/auth/login`

**What Everyone Sees:**
- HealthConnect logo
- "Welcome Back" heading
- Email input field
- Password input field
- "Sign In" button
- "Don't have an account? Sign up" link
- Error messages (if login fails)

### Signup Page: `/auth/signup`

**What Everyone Sees:**
- HealthConnect logo
- "Create Account" heading
- Full Name input
- Email input
- Phone Number input (optional)
- Password input
- Confirm Password input
- "Sign Up" button
- "Already have an account? Sign in" link
- Success message after signup

---

## 🚫 Unauthorized Page: `/unauthorized`

**What They See:**
- Shield icon with X
- "Access Denied" heading
- "You don't have permission to access this page" message
- Explanation text
- "Go Home" button
- "Sign In" button

**When They See This:**
- Patient trying to access `/admin`
- Patient trying to access `/doctor`
- Doctor trying to access `/admin`
- Any user without required permissions

---

## 📱 Navigation (Navbar)

### When Logged Out:
- HealthConnect logo
- "Sign In" button (right side)

### When Logged In as Patient:
- HealthConnect logo
- Dashboard link
- Consultations link
- Education link
- Community link
- User name + "Patient" badge
- Sign Out button

### When Logged In as Doctor:
- HealthConnect logo
- Dashboard link
- "My Dashboard" link (doctor)
- User name + "Healthcare Provider" badge
- Sign Out button

### When Logged In as Admin:
- HealthConnect logo
- Dashboard link
- "Admin Panel" link
- User name + "Administrator" badge
- Sign Out button

---

## 🎯 How to Test Each Role

### Test as Patient:
1. Signup with new account
2. Default role is "Patient"
3. See Patient dashboard
4. Try accessing `/admin` → Should redirect to `/unauthorized`

### Test as Doctor:
1. Login as existing user
2. In Supabase, change role to "Doctor":
   ```sql
   UPDATE users SET role = 'Doctor' WHERE email = 'your-email@example.com';
   ```
3. Logout and login again
4. Auto-redirect to `/doctor` dashboard
5. See Doctor features

### Test as Admin:
1. In Supabase, change role to "Admin":
   ```sql
   UPDATE users SET role = 'Admin' WHERE email = 'your-email@example.com';
   ```
2. Logout and login again
3. Auto-redirect to `/admin` dashboard
4. See Admin features
5. Can access `/doctor` and `/admin` pages

---

## 📊 Feature Comparison Table

| Feature | Patient | Doctor | Admin |
|---------|---------|--------|-------|
| Book Consultations | ✅ | ❌ | ✅ (View all) |
| View Health Education | ✅ | ✅ | ✅ |
| Join Community | ✅ | ✅ | ✅ |
| Make Payments | ✅ | ❌ | ✅ (View all) |
| Manage Consultations | ❌ | ✅ | ✅ |
| View Patients | ❌ | ✅ | ✅ |
| Manage Users | ❌ | ❌ | ✅ |
| View Analytics | ❌ | ✅ (Own) | ✅ (All) |
| System Settings | ❌ | ❌ | ✅ |
| Change User Roles | ❌ | ❌ | ✅ |

---

## 🎨 Visual Differences

### Patient Dashboard:
- Green theme
- Patient-focused features
- Simple, user-friendly interface
- Focus on booking and learning

### Doctor Dashboard:
- Blue theme
- Professional interface
- Consultation management focus
- Patient care tools

### Admin Dashboard:
- Gray/Red theme
- Administrative interface
- Platform-wide statistics
- Management tools

---

## ✅ Testing Checklist

### Patient:
- [ ] Can see Patient dashboard
- [ ] Can book consultations
- [ ] Can view health education
- [ ] Can access community
- [ ] Cannot access `/admin`
- [ ] Cannot access `/doctor`
- [ ] Navbar shows Patient links

### Doctor:
- [ ] Can see Doctor dashboard
- [ ] Can view consultations
- [ ] Can manage patients
- [ ] Cannot access `/admin`
- [ ] Navbar shows Doctor links

### Admin:
- [ ] Can see Admin dashboard
- [ ] Can access all pages
- [ ] Can view all users
- [ ] Can change user roles
- [ ] Navbar shows Admin links

---

**Now start your server and explore each role!** 🚀

```bash
npm run dev
```

Visit: **http://localhost:3000**

