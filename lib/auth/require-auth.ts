import { redirect } from 'next/navigation'
import { getUser } from './get-user'
import type { UserRole } from '@/lib/types/auth'

export async function requireAuth(requiredRole?: UserRole) {
  const { user, error } = await getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  if (requiredRole && user.role !== requiredRole) {
    // User doesn't have required role
    redirect('/unauthorized')
  }

  return user
}

