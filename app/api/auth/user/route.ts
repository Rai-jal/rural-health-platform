import { NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'

export async function GET() {
  const { user, error } = await getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ user })
}

