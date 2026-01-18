/**
 * @deprecated This file is kept for backward compatibility with existing code.
 * 
 * For new code, use:
 * - Client-side: `import { createClient } from '@/lib/supabase/client'`
 * - Server-side: `import { createClient } from '@/lib/supabase/server'`
 * 
 * This file will be removed in a future version.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"

// Legacy client - use lib/supabase/client.ts or lib/supabase/server.ts instead
export const supabase = createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Flag to check if Supabase is configured
export const isSupabaseConfigured = true // Always true now due to env validation

// Database types (keep existing types)
export interface User {
  id: string
  phone_number: string
  full_name: string
  age?: number
  preferred_language: string
  location?: string
  created_at: string
  updated_at: string
}

export interface HealthcareProvider {
  id: string
  full_name: string
  specialty: string
  languages: string[]
  experience_years: number
  rating: number
  total_consultations: number
  location?: string
  is_available: boolean
  created_at: string
  updated_at: string
}

export interface Consultation {
  id: string
  user_id: string
  provider_id: string | null // Can be null until assigned by admin
  consultation_type: "video" | "voice" | "sms"
  consultation_category?: string // e.g., "maternal_health", "reproductive_health", "general_inquiry"
  status: "draft" | "pending_admin_review" | "assigned" | "confirmed" | "scheduled" | "in_progress" | "completed" | "cancelled"
  scheduled_at: string | null // Can be null until confirmed
  preferred_date?: string // Patient's preferred date
  preferred_time_range?: string // Patient's preferred time range
  duration_minutes: number
  cost_leone: number
  reason_for_consultation?: string
  notes?: string
  consent_acknowledged?: boolean
  created_at: string
  updated_at: string
  healthcare_providers?: HealthcareProvider
  users?: User
}

export interface HealthContent {
  id: string
  title: string
  description?: string
  category: string
  content_type: "article" | "audio" | "video"
  language: string
  content_text?: string
  audio_url?: string
  video_url?: string
  duration_minutes: number
  download_count: number
  rating: number
  is_offline_available: boolean
  topics: string[]
  created_at: string
  updated_at: string
}

export interface CommunityGroup {
  id: string
  name: string
  description?: string
  category: string
  language: string
  location?: string
  moderator_id?: string
  member_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  healthcare_providers?: HealthcareProvider
}

export interface Event {
  id: string
  title: string
  description?: string
  event_type: string
  location?: string
  scheduled_at: string
  duration_minutes: number
  max_attendees?: number
  current_attendees: number
  organizer_id?: string
  is_virtual: boolean
  created_at: string
  updated_at: string
  healthcare_providers?: HealthcareProvider
}

export interface Payment {
  id: string
  consultation_id: string
  user_id: string
  amount_leone: number
  payment_method: string
  payment_status: "pending" | "completed" | "failed" | "refunded"
  transaction_id?: string
  payment_provider?: string
  created_at: string
  updated_at: string
}
