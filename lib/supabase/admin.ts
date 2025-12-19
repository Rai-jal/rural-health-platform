/**
 * Supabase Admin Client
 * 
 * This client uses the service role key to perform admin operations
 * like creating users, bypassing RLS, etc.
 * 
 * ⚠️ SECURITY: Only use this server-side, never expose the service role key!
 */

import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

let adminClient: ReturnType<typeof createClient> | null = null

export function getAdminClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. ' +
      'Please add it to your .env.local file.'
    )
  }

  if (!adminClient) {
    adminClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  }

  return adminClient
}

