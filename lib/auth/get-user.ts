import { createClient } from '@/lib/supabase/server'
import type { UserProfile } from '@/lib/types/auth'

export async function getUser(): Promise<{
  user: UserProfile | null
  error: Error | null
}> {
  try {
    const supabase = await createClient()
    
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return { user: null, error: authError ? new Error(authError.message) : null }
    }

    // Fetch user profile from users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (profileError || !profile) {
      return {
        user: null,
        error: profileError ? new Error(profileError.message) : new Error('User profile not found'),
      }
    }

    return { user: profile as UserProfile, error: null }
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error : new Error('Failed to get user'),
    }
  }
}

