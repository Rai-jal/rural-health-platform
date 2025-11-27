# Migration Notes
## Updating Existing Code to Use New Auth System

This document helps you migrate existing code to use the new authentication system.

---

## ⚠️ Breaking Changes

### 1. Supabase Client Import

**Old:**
```tsx
import { supabase } from '@/lib/supabase'
```

**New (Client-side):**
```tsx
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

**New (Server-side):**
```tsx
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
```

### 2. User Type

**Old:**
```tsx
import { User } from '@/lib/supabase'
```

**New:**
```tsx
import { UserProfile } from '@/lib/types/auth'
```

The `UserProfile` type includes:
- `id` (UUID from auth.users)
- `email` (required)
- `role` (Patient | Doctor | Admin)
- All other fields from the old User type

### 3. Database Schema Changes

The `users` table now:
- Links to `auth.users` via foreign key
- Has `email` field (required)
- Has `role` field (default: 'Patient')
- `phone_number` is now optional

**Action Required:** Run `scripts/03-auth-setup.sql` migration

---

## 📝 Step-by-Step Migration

### Step 1: Update Database

Run the migration script:
```sql
-- In Supabase SQL Editor
-- Run scripts/03-auth-setup.sql
```

### Step 2: Update Imports

Find and replace in your codebase:

1. **Client Components:**
   ```tsx
   // Find
   import { supabase } from '@/lib/supabase'
   
   // Replace with
   import { createClient } from '@/lib/supabase/client'
   const supabase = createClient()
   ```

2. **Server Components/API Routes:**
   ```tsx
   // Find
   import { supabase } from '@/lib/supabase'
   
   // Replace with
   import { createClient } from '@/lib/supabase/server'
   const supabase = await createClient()
   ```

### Step 3: Update User Queries

**Old:**
```tsx
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('phone_number', phoneNumber)
  .single()
```

**New:**
```tsx
// Get current authenticated user
import { getUser } from '@/lib/auth/get-user'
const { user } = await getUser()

// Or query by email (if you need to)
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .single()
```

### Step 4: Add Authentication Checks

**For Pages:**
```tsx
// Add at the top of page components
import { requireAuth } from '@/lib/auth/require-auth'

export default async function MyPage() {
  const user = await requireAuth() // Redirects if not logged in
  // ... rest of your code
}
```

**For API Routes:**
```tsx
import { authGuard } from '@/lib/auth/api-guard'

export async function GET() {
  const { user, profile, error } = await authGuard()
  if (error) return error
  // ... rest of your code
}
```

### Step 5: Update Client Components

**Old:**
```tsx
'use client'
// No auth state management
```

**New:**
```tsx
'use client'
import { useAuth } from '@/hooks/use-auth'

export default function MyComponent() {
  const { user, isLoading, isLoggedIn } = useAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (!isLoggedIn) return <div>Please log in</div>
  
  // ... rest of your code
}
```

---

## 🔄 Specific File Updates

### `lib/database.ts`

This file needs significant updates:

1. **Update imports:**
   ```tsx
   // Remove
   import { supabase, isSupabaseConfigured } from "./supabase"
   
   // Add
   import { createClient } from '@/lib/supabase/server'
   ```

2. **Update functions to use server client:**
   ```tsx
   export async function getHealthcareProviders() {
     const supabase = await createClient()
     // ... rest of function
   }
   ```

3. **Update user creation:**
   - Users are now created automatically via trigger
   - Use `getUser()` to get current user
   - Update existing users to link with auth.users

### Existing Pages

Pages that need updates:
- `app/page.tsx` - Add auth check if needed
- `app/consultation/page.tsx` - Use `requireAuth()` or `useAuth()`
- `app/education/page.tsx` - Use `requireAuth()` or `useAuth()`
- `app/payments/page.tsx` - Use `requireAuth()` or `useAuth()`
- `app/community/page.tsx` - Use `requireAuth()` or `useAuth()`

---

## ✅ Migration Checklist

- [ ] Run database migration (`scripts/03-auth-setup.sql`)
- [ ] Update all Supabase client imports
- [ ] Update user type imports
- [ ] Add authentication checks to protected pages
- [ ] Add authentication checks to API routes
- [ ] Update `lib/database.ts` to use new client
- [ ] Test login/signup flow
- [ ] Test protected routes
- [ ] Test role-based access
- [ ] Update existing user data (if any) to link with auth.users

---

## 🆘 Need Help?

If you encounter issues during migration:

1. Check the `AUTH_SETUP_GUIDE.md` for usage examples
2. Review the new files in `lib/supabase/` and `lib/auth/`
3. Check Supabase logs for database errors
4. Verify environment variables are set correctly

---

## 📌 Notes

- The old `lib/supabase.ts` file is kept for backward compatibility but is deprecated
- All new code should use the new client utilities
- The old file will be removed in a future version
- Environment validation now ensures Supabase is always configured

