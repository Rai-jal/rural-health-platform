import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types/auth'

interface AuthGuardOptions {
  requiredRole?: UserRole
  allowUnauthenticated?: boolean
}

export async function authGuard(options: AuthGuardOptions = {}) {
  const { requiredRole, allowUnauthenticated = false } = options

  try {
    const supabase = await createClient()
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      if (allowUnauthenticated) {
        return { user: null, profile: null, error: null }
      }
      return {
        user: null,
        profile: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profileError || !profile) {
      return {
        user: null,
        profile: null,
        error: NextResponse.json({ error: 'User profile not found' }, { status: 404 }),
      }
    }

    // Check role if required
    if (requiredRole && profile.role !== requiredRole) {
      return {
        user: authUser,
        profile: profile as any,
        error: NextResponse.json(
          { error: 'Forbidden: Insufficient permissions' },
          { status: 403 }
        ),
      }
    }

    return {
      user: authUser,
      profile: profile as any,
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      profile: null,
      error: NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      ),
    }
  }
}

