/**
 * Database utility functions
 * 
 * NOTE: This file is deprecated. All API routes should use Supabase directly.
 * This file is kept for backward compatibility but will throw errors if Supabase is not configured.
 * 
 * For new code, use:
 * - Client-side: `import { createClient } from '@/lib/supabase/client'`
 * - Server-side: `import { createClient } from '@/lib/supabase/server'`
 */

import {
  supabase,
  isSupabaseConfigured,
  type HealthcareProvider,
  type HealthContent,
  type CommunityGroup,
  type Event,
  type Consultation,
  type User,
} from "./supabase"

// Healthcare Providers
export async function getHealthcareProviders(): Promise<HealthcareProvider[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Cannot fetch healthcare providers.")
  }

  try {
    const { data, error } = await supabase
      .from("healthcare_providers")
      .select("*")
      .eq("is_available", true)
      .order("rating", { ascending: false })

    if (error) throw error
    return data as HealthcareProvider[]
  } catch (error) {
    console.error("Error fetching healthcare providers:", error)
    throw error
  }
}

export async function getHealthcareProvider(id: string): Promise<HealthcareProvider | null> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Cannot fetch healthcare provider.")
  }

  try {
    const { data, error } = await supabase.from("healthcare_providers").select("*").eq("id", id).single()

    if (error) throw error
    return data as HealthcareProvider
  } catch (error) {
    console.error("Error fetching healthcare provider:", error)
    throw error
  }
}

// Health Content
export async function getHealthContent(filters?: {
  category?: string
  language?: string
  search?: string
}): Promise<HealthContent[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Cannot fetch health content.")
  }

  try {
    let query = supabase.from("health_content").select("*").order("rating", { ascending: false })

    if (filters?.category && filters.category !== "all") {
      query = query.eq("category", filters.category)
    }

    if (filters?.language) {
      query = query.eq("language", filters.language)
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data as HealthContent[]
  } catch (error) {
    console.error("Error fetching health content:", error)
    throw error
  }
}

export async function incrementDownloadCount(contentId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Cannot increment download count.")
  }

  try {
    const { error } = await supabase.rpc("increment_download_count", {
      content_id: contentId,
    })

    if (error) throw error
  } catch (error) {
    console.error("Error incrementing download count:", error)
    throw error
  }
}

// Community Groups
export async function getCommunityGroups(): Promise<CommunityGroup[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Cannot fetch community groups.")
  }

  try {
    const { data, error } = await supabase
      .from("community_groups")
      .select(`
        *,
        healthcare_providers (
          full_name,
          specialty
        )
      `)
      .eq("is_active", true)
      .order("member_count", { ascending: false })

    if (error) throw error
    return data as CommunityGroup[]
  } catch (error) {
    console.error("Error fetching community groups:", error)
    throw error
  }
}

// Events
export async function getUpcomingEvents(): Promise<Event[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Cannot fetch events.")
  }

  try {
    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        healthcare_providers (
          full_name,
          specialty
        )
      `)
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(10)

    if (error) throw error
    return data as Event[]
  } catch (error) {
    console.error("Error fetching events:", error)
    throw error
  }
}

// Users
export async function createUser(userData: {
  phone_number: string
  full_name: string
  age?: number
  preferred_language?: string
  location?: string
}): Promise<User> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Cannot create user.")
  }

  try {
    const { data, error } = await supabase.from("users").insert([userData]).select().single()

    if (error) throw error
    return data as User
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function getUserByPhone(phoneNumber: string): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Cannot fetch user.")
  }

  try {
    const { data, error } = await supabase.from("users").select("*").eq("phone_number", phoneNumber).single()

    if (error && error.code !== "PGRST116") throw error
    return data as User | null
  } catch (error) {
    console.error("Error fetching user by phone:", error)
    throw error
  }
}

// Consultations
export async function createConsultation(consultationData: {
  user_id: string
  provider_id: string
  consultation_type: "video" | "voice" | "sms"
  scheduled_at: string
  cost_leone: number
  reason_for_consultation?: string
}): Promise<Consultation> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Cannot create consultation.")
  }

  try {
    const { data, error } = await supabase
      .from("consultations")
      .insert([consultationData])
      .select(`
        *,
        healthcare_providers (
          full_name,
          specialty,
          languages
        ),
        users (
          full_name,
          phone_number
        )
      `)
      .single()

    if (error) throw error
    return data as Consultation
  } catch (error) {
    console.error("Error creating consultation:", error)
    throw error
  }
}

export async function getUserConsultations(userId: string): Promise<Consultation[]> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Cannot fetch consultations.")
  }

  try {
    const { data, error } = await supabase
      .from("consultations")
      .select(`
        *,
        healthcare_providers (
          full_name,
          specialty,
          languages
        )
      `)
      .eq("user_id", userId)
      .order("scheduled_at", { ascending: false })

    if (error) throw error
    return data as Consultation[]
  } catch (error) {
    console.error("Error fetching user consultations:", error)
    throw error
  }
}

// Payments
export async function createPayment(paymentData: {
  consultation_id: string
  user_id: string
  amount_leone: number
  payment_method: string
  payment_provider?: string
}): Promise<any> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Cannot create payment.")
  }

  try {
    const { data, error } = await supabase
      .from("payments")
      .insert([
        {
          ...paymentData,
          transaction_id: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
          payment_status: "completed",
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error("Error creating payment:", error)
    throw error
  }
}
