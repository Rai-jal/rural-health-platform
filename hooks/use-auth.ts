'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/lib/types/auth'
import { useRouter } from 'next/navigation'

interface UseAuthReturn {
  user: UserProfile | null
  isLoading: boolean
  isLoggedIn: boolean
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const fetchUser = async () => {
    try {
      setIsLoading(true)

      // Get auth user
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        setUser(null)
        setIsLoading(false)
        return
      }

      // Fetch user profile
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (error || !profile) {
        setUser(null)
        setIsLoading(false)
        return
      }

      setUser(profile as UserProfile)
    } catch (error) {
      console.error('Error fetching user:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        router.push('/auth/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/auth/login')
    router.refresh()
  }

  return {
    user,
    isLoading,
    isLoggedIn: !!user,
    signOut,
    refresh: fetchUser,
  }
}

