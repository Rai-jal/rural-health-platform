# Authentication Setup Guide
## RBAC Implementation Complete ✅

This guide explains the authentication system that has been implemented and how to use it.

---

## 🎯 What Has Been Implemented

### ✅ Phase 1: Authentication Setup
- **Supabase Client Utilities** (`lib/supabase/client.ts` & `lib/supabase/server.ts`)
  - Client-side and server-side Supabase clients with SSR support
  - Secure session management via cookies

- **Auth Pages**
  - `/auth/login` - Login page with email/password
  - `/auth/signup` - Signup page with form validation
  - Both use React Hook Form + Zod validation

- **Role Injection**
  - Database trigger automatically creates user profile on signup
  - Default role: `Patient`
  - Role can be changed by Admins only

### ✅ Phase 2: Role-Based Access Control (RBAC)
- **Auth Hook** (`hooks/use-auth.ts`)
  - Client-side hook for accessing user state
  - Provides: `user`, `isLoading`, `isLoggedIn`, `signOut()`, `refresh()`

- **Middleware** (`middleware.ts`)
  - Protects all routes except public ones
  - Redirects unauthenticated users to login
  - Role-based route protection (`/admin`, `/doctor`)

- **Server-Side Auth Utilities**
  - `lib/auth/get-user.ts` - Get current user in server components
  - `lib/auth/require-auth.ts` - Require authentication (redirects if not logged in)
  - `lib/auth/api-guard.ts` - Protect API routes with role checking

### ✅ Phase 3: Cleanup & Hardening
- **Removed build error ignoring flags** from `next.config.mjs`
- **Error Boundary** (`app/error.tsx`) - Global error handling
- **Environment Validation** (`lib/env.ts`) - Validates env vars at startup
- **Security Headers** - Added to `next.config.mjs`

---

## 📋 Setup Instructions

### Step 1: Run Database Migration

1. Go to your Supabase dashboard → SQL Editor
2. Run `scripts/03-auth-setup.sql`
   - This creates the updated users table with role support
   - Sets up the trigger for automatic profile creation
   - Configures Row Level Security (RLS) policies

### Step 2: Configure Environment Variables

Create `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Test the Implementation

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000/auth/signup`
   - Create a new account
   - You should be redirected to login

3. Login at `http://localhost:3000/auth/login`
   - You should be redirected to home page

4. Check Supabase dashboard:
   - Go to Table Editor → `users` table
   - Verify your profile was created with role `Patient`

---

## 🔐 User Roles

- **Patient** (Default)
  - Can access: `/`, `/consultation`, `/education`, `/payments`, `/community`
  - Cannot access: `/admin`, `/doctor`

- **Doctor**
  - Can access: All Patient routes + `/doctor/*`
  - Cannot access: `/admin`

- **Admin**
  - Can access: All routes including `/admin/*`
  - Can manage users and change roles

---

## 💻 Usage Examples

### Client-Side: Using the Auth Hook

```tsx
'use client'

import { useAuth } from '@/hooks/use-auth'

export default function MyComponent() {
  const { user, isLoading, isLoggedIn, signOut } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!isLoggedIn) return <div>Please log in</div>

  return (
    <div>
      <p>Welcome, {user?.full_name}!</p>
      <p>Your role: {user?.role}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### Server-Side: Getting User in Server Components

```tsx
import { getUser } from '@/lib/auth/get-user'

export default async function MyPage() {
  const { user, error } = await getUser()

  if (error || !user) {
    return <div>Not authenticated</div>
  }

  return <div>Welcome, {user.full_name}!</div>
}
```

### Server-Side: Requiring Authentication

```tsx
import { requireAuth } from '@/lib/auth/require-auth'

export default async function ProtectedPage() {
  // This will redirect to /auth/login if not authenticated
  const user = await requireAuth()

  return <div>Protected content for {user.full_name}</div>
}
```

### Server-Side: Requiring Specific Role

```tsx
import { requireAuth } from '@/lib/auth/require-auth'

export default async function AdminPage() {
  // This will redirect to /auth/login if not authenticated
  // Or to /unauthorized if not an Admin
  const user = await requireAuth('Admin')

  return <div>Admin dashboard</div>
}
```

### API Routes: Protecting Endpoints

```tsx
import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/auth/api-guard'

// Require authentication
export async function GET() {
  const { user, profile, error } = await authGuard()

  if (error) return error
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ data: 'Protected data' })
}

// Require Admin role
export async function POST() {
  const { user, profile, error } = await authGuard({ requiredRole: 'Admin' })

  if (error) return error
  if (!user || !profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ message: 'Admin action completed' })
}
```

### Protecting Entire Route Directories

Create a `layout.tsx` in the directory:

```tsx
// app/admin/layout.tsx
import { requireAuth } from '@/lib/auth/require-auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth('Admin')
  
  // If user doesn't have Admin role, requireAuth will redirect
  // But we can add additional checks here if needed

  return <div>{children}</div>
}
```

---

## 🔄 Changing User Roles

Only Admins can change user roles. You can do this:

1. **Via Supabase Dashboard:**
   - Go to Table Editor → `users`
   - Edit the `role` field directly

2. **Via API Route (to be implemented):**
   ```tsx
   // app/api/admin/users/[id]/role/route.ts
   import { authGuard } from '@/lib/auth/api-guard'
   import { createClient } from '@/lib/supabase/server'
   
   export async function PATCH(
     request: Request,
     { params }: { params: { id: string } }
   ) {
     const { profile, error } = await authGuard({ requiredRole: 'Admin' })
     if (error) return error
     
     const { role } = await request.json()
     const supabase = await createClient()
     
     const { error: updateError } = await supabase
       .from('users')
       .update({ role })
       .eq('id', params.id)
     
     if (updateError) {
       return NextResponse.json({ error: updateError.message }, { status: 500 })
     }
     
     return NextResponse.json({ success: true })
   }
   ```

---

## 🛡️ Security Features

1. **Row Level Security (RLS)**
   - Users can only view/update their own profile
   - Admins can view/update all users
   - Policies are enforced at the database level

2. **Middleware Protection**
   - All routes are protected by default
   - Public routes must be explicitly listed
   - Role-based access control at route level

3. **API Route Guards**
   - Server-side authentication checks
   - Role-based authorization
   - Returns proper HTTP status codes

4. **Environment Validation**
   - Validates required env vars at startup
   - Fails fast with clear error messages

5. **Security Headers**
   - X-Frame-Options
   - X-Content-Type-Options
   - Referrer-Policy
   - DNS Prefetch Control

---

## 🐛 Troubleshooting

### Issue: "Missing or invalid environment variables"
**Solution:** Check your `.env.local` file has all required variables

### Issue: "User profile not found" after signup
**Solution:** 
- Check the database trigger was created (`scripts/03-auth-setup.sql`)
- Verify the trigger function `handle_new_user()` exists
- Check Supabase logs for errors

### Issue: "Unauthorized" when accessing protected routes
**Solution:**
- Make sure you're logged in
- Check your user role in the database
- Verify middleware is running (check console logs)

### Issue: Can't change user role
**Solution:**
- Only Admins can change roles
- Make sure you're logged in as an Admin
- Check RLS policies allow role updates

---

## 📝 Next Steps

1. **Update existing pages** to use the auth system
2. **Create role-specific layouts** for `/admin` and `/doctor` routes
3. **Implement role management API** for Admins
4. **Add password reset functionality**
5. **Add email verification** (if needed)
6. **Implement session refresh** logic

---

## 📚 Files Created/Modified

### New Files:
- `lib/supabase/client.ts` - Client-side Supabase client
- `lib/supabase/server.ts` - Server-side Supabase client
- `lib/env.ts` - Environment validation
- `lib/types/auth.ts` - Auth type definitions
- `lib/auth/get-user.ts` - Get user utility
- `lib/auth/require-auth.ts` - Require auth utility
- `lib/auth/api-guard.ts` - API route guard
- `hooks/use-auth.ts` - Client-side auth hook
- `middleware.ts` - Route protection middleware
- `app/auth/login/page.tsx` - Login page
- `app/auth/signup/page.tsx` - Signup page
- `app/unauthorized/page.tsx` - Unauthorized page
- `app/error.tsx` - Error boundary
- `app/api/auth/user/route.ts` - Get user API
- `app/api/auth/logout/route.ts` - Logout API
- `app/api/example-protected/route.ts` - Example protected route
- `scripts/03-auth-setup.sql` - Database migration

### Modified Files:
- `next.config.mjs` - Removed build error flags, added security headers
- `package.json` - Added dependencies

---

## ✅ Implementation Complete!

Your application now has a robust, secure authentication and authorization system. All critical security vulnerabilities have been addressed.

**Remember to:**
1. Run the database migration (`scripts/03-auth-setup.sql`)
2. Set up your environment variables
3. Test the authentication flow
4. Update existing pages to use the new auth system

Good luck! 🚀

