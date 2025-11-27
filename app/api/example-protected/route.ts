import { NextResponse } from 'next/server'
import { authGuard } from '@/lib/auth/api-guard'
import type { UserRole } from '@/lib/types/auth'

// Example: Protected route that requires authentication
export async function GET() {
  const { user, profile, error } = await authGuard()

  if (error) {
    return error
  }

  if (!user || !profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    message: 'This is a protected route',
    user: {
      id: profile.id,
      email: profile.email,
      role: profile.role,
    },
  })
}

// Example: Admin-only route
export async function POST() {
  const { user, profile, error } = await authGuard({ requiredRole: 'Admin' })

  if (error) {
    return error
  }

  if (!user || !profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    message: 'This is an admin-only route',
    admin: {
      id: profile.id,
      email: profile.email,
    },
  })
}

