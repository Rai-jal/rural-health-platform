import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/types/auth'
import { captureAuthError } from '@/lib/sentry/api-wrapper'

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
      
      // Capture authentication error
      if (authError) {
        captureAuthError(authError, {
          route: typeof window === 'undefined' ? undefined : window.location.pathname,
          action: 'get_user',
        });
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
      // Track permission denied (not an error, but useful for security monitoring)
      captureAuthError(new Error('Insufficient permissions'), {
        route: typeof window === 'undefined' ? undefined : window.location.pathname,
        userId: authUser.id,
        action: 'role_check',
      });
      
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
    // Capture unexpected auth errors
    captureAuthError(error, {
      route: typeof window === 'undefined' ? undefined : window.location.pathname,
      action: 'auth_guard_exception',
    });
    
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

