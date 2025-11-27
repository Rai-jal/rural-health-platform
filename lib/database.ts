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

// Mock data for when Supabase is not configured
const mockHealthContent: HealthContent[] = [
  {
    id: "1",
    title: "Prenatal Care Basics",
    category: "maternal",
    content_type: "audio",
    language: "English/Krio",
    description: "Essential care during pregnancy for mother and baby health",
    duration_minutes: 8,
    rating: 4.9,
    download_count: 1250,
    is_offline_available: true,
    topics: ["Pregnancy", "Nutrition", "Doctor Visits"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Safe Delivery Practices",
    category: "maternal",
    content_type: "audio",
    language: "Mende/English",
    description: "What to expect during delivery and how to prepare",
    duration_minutes: 12,
    rating: 4.8,
    download_count: 980,
    is_offline_available: true,
    topics: ["Delivery", "Birth Plan", "Emergency Signs"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Breastfeeding Guide",
    category: "childcare",
    content_type: "audio",
    language: "Temne/English",
    description: "Complete guide to successful breastfeeding",
    duration_minutes: 10,
    rating: 4.9,
    download_count: 1500,
    is_offline_available: true,
    topics: ["Breastfeeding", "Nutrition", "Baby Health"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Childhood Vaccinations",
    category: "childcare",
    content_type: "audio",
    language: "English/Krio",
    description: "Important vaccines for children and when to get them",
    duration_minutes: 6,
    rating: 4.7,
    download_count: 850,
    is_offline_available: true,
    topics: ["Vaccines", "Child Health", "Prevention"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    title: "Healthy Eating During Pregnancy",
    category: "nutrition",
    content_type: "audio",
    language: "Limba/English",
    description: "Nutritious foods for pregnant mothers with local ingredients",
    duration_minutes: 9,
    rating: 4.8,
    download_count: 1100,
    is_offline_available: true,
    topics: ["Pregnancy Nutrition", "Local Foods", "Healthy Diet"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "6",
    title: "Hand Washing and Hygiene",
    category: "hygiene",
    content_type: "audio",
    language: "English/Krio",
    description: "Proper hand washing techniques to prevent disease",
    duration_minutes: 5,
    rating: 4.6,
    download_count: 2000,
    is_offline_available: true,
    topics: ["Hygiene", "Disease Prevention", "Health Habits"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "7",
    title: "Family Planning Methods",
    category: "family",
    content_type: "audio",
    language: "English/Krio",
    description: "Overview of safe and effective family planning methods available in Sierra Leone",
    duration_minutes: 15,
    rating: 4.8,
    download_count: 890,
    is_offline_available: true,
    topics: ["Contraception", "Family Planning", "Reproductive Health"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "8",
    title: "Natural Family Planning",
    category: "family",
    content_type: "audio",
    language: "Mende/English",
    description: "Natural methods for spacing pregnancies and family planning",
    duration_minutes: 12,
    rating: 4.6,
    download_count: 650,
    is_offline_available: true,
    topics: ["Natural Methods", "Fertility Awareness", "Family Planning"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "9",
    title: "Birth Spacing Benefits",
    category: "family",
    content_type: "audio",
    language: "Temne/English",
    description: "Health benefits of spacing births for mother and child wellbeing",
    duration_minutes: 10,
    rating: 4.7,
    download_count: 720,
    is_offline_available: true,
    topics: ["Birth Spacing", "Maternal Health", "Child Health"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "10",
    title: "Contraceptive Options",
    category: "family",
    content_type: "audio",
    language: "English/Krio",
    description: "Safe contraceptive options available at local health centers",
    duration_minutes: 18,
    rating: 4.9,
    download_count: 1050,
    is_offline_available: true,
    topics: ["Contraception", "Health Centers", "Women's Health"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "11",
    title: "Reproductive Health Education",
    category: "family",
    content_type: "audio",
    language: "Limba/English",
    description: "Understanding reproductive health and making informed decisions",
    duration_minutes: 14,
    rating: 4.8,
    download_count: 780,
    is_offline_available: true,
    topics: ["Reproductive Health", "Education", "Women's Rights"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "12",
    title: "Counseling for Couples",
    category: "family",
    content_type: "audio",
    language: "English/Krio",
    description: "Family planning counseling and communication for couples",
    duration_minutes: 16,
    rating: 4.7,
    download_count: 560,
    is_offline_available: true,
    topics: ["Couples Counseling", "Communication", "Family Planning"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockHealthcareProviders: HealthcareProvider[] = [
  {
    id: "1",
    full_name: "Dr. Fatima Kamara",
    specialty: "Maternal Health",
    languages: ["English", "Krio", "Mende"],
    experience_years: 8,
    rating: 4.9,
    total_consultations: 150,
    location: "Freetown",
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    full_name: "Dr. Aminata Sesay",
    specialty: "General Practice",
    languages: ["English", "Krio", "Temne"],
    experience_years: 12,
    rating: 4.8,
    total_consultations: 200,
    location: "Bo",
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    full_name: "Dr. Mariama Bangura",
    specialty: "Women's Health",
    languages: ["English", "Krio", "Limba"],
    experience_years: 6,
    rating: 4.9,
    total_consultations: 120,
    location: "Makeni",
    is_available: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const mockCommunityGroups: CommunityGroup[] = [
  {
    id: "1",
    name: "New Mothers Support",
    description: "Support group for new mothers sharing experiences and advice",
    category: "Maternal Health",
    language: "English/Krio",
    location: "Freetown & Rural Areas",
    member_count: 245,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    healthcare_providers: {
      id: "nurse1",
      full_name: "Nurse Sarah Kamara",
      specialty: "Community Health",
      languages: ["English", "Krio"],
      experience_years: 5,
      rating: 4.7,
      total_consultations: 180,
      location: "Kenema",
      is_available: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: "2",
    name: "Pregnancy Journey",
    description: "Expecting mothers sharing their pregnancy experiences",
    category: "Pregnancy",
    language: "Mende/English",
    location: "Bo District",
    member_count: 189,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    healthcare_providers: {
      id: "midwife1",
      full_name: "Midwife Fatima Sesay",
      specialty: "Maternal Care",
      languages: ["Mende", "English"],
      experience_years: 10,
      rating: 4.8,
      total_consultations: 250,
      location: "Bo",
      is_available: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
]

const mockEvents: Event[] = [
  {
    id: "1",
    title: "Maternal Health Workshop",
    description: "Learn about prenatal care and safe delivery practices",
    event_type: "Workshop",
    location: "Community Center, Freetown",
    scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    duration_minutes: 120,
    max_attendees: 50,
    current_attendees: 45,
    is_virtual: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    healthcare_providers: {
      id: "1",
      full_name: "Dr. Fatima Kamara",
      specialty: "Maternal Health",
      languages: ["English", "Krio", "Mende"],
      experience_years: 8,
      rating: 4.9,
      total_consultations: 150,
      location: "Freetown",
      is_available: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: "2",
    title: "Breastfeeding Support Circle",
    description: "Support group for breastfeeding mothers",
    event_type: "Support Group",
    location: "Health Post, Bo",
    scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // In 3 days
    duration_minutes: 90,
    max_attendees: 30,
    current_attendees: 25,
    is_virtual: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Healthcare Providers
export async function getHealthcareProviders(): Promise<HealthcareProvider[]> {
  if (!isSupabaseConfigured || !supabase) {
    console.log("Using mock data for healthcare providers")
    return mockHealthcareProviders
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
    return mockHealthcareProviders
  }
}

export async function getHealthcareProvider(id: string): Promise<HealthcareProvider | null> {
  if (!isSupabaseConfigured || !supabase) {
    return mockHealthcareProviders.find((p) => p.id === id) || null
  }

  try {
    const { data, error } = await supabase.from("healthcare_providers").select("*").eq("id", id).single()

    if (error) throw error
    return data as HealthcareProvider
  } catch (error) {
    console.error("Error fetching healthcare provider:", error)
    return mockHealthcareProviders.find((p) => p.id === id) || null
  }
}

// Health Content
export async function getHealthContent(filters?: {
  category?: string
  language?: string
  search?: string
}): Promise<HealthContent[]> {
  if (!isSupabaseConfigured || !supabase) {
    console.log("Using mock data for health content")
    let filteredContent = [...mockHealthContent]

    if (filters?.category && filters.category !== "all") {
      filteredContent = filteredContent.filter((content) => content.category === filters.category)
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      filteredContent = filteredContent.filter(
        (content) =>
          content.title.toLowerCase().includes(searchLower) || content.description?.toLowerCase().includes(searchLower),
      )
    }

    return filteredContent
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
    return mockHealthContent
  }
}

export async function incrementDownloadCount(contentId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    console.log("Mock: Incrementing download count for content", contentId)
    // Update mock data
    const content = mockHealthContent.find((c) => c.id === contentId)
    if (content) {
      content.download_count += 1
    }
    return
  }

  try {
    const { error } = await supabase.rpc("increment_download_count", {
      content_id: contentId,
    })

    if (error) throw error
  } catch (error) {
    console.error("Error incrementing download count:", error)
  }
}

// Community Groups
export async function getCommunityGroups(): Promise<CommunityGroup[]> {
  if (!isSupabaseConfigured || !supabase) {
    console.log("Using mock data for community groups")
    return mockCommunityGroups
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
    return mockCommunityGroups
  }
}

// Events
export async function getUpcomingEvents(): Promise<Event[]> {
  if (!isSupabaseConfigured || !supabase) {
    console.log("Using mock data for events")
    return mockEvents
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
    return mockEvents
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
    console.log("Mock: Creating user", userData)
    const mockUser: User = {
      id: `user_${Date.now()}`,
      ...userData,
      preferred_language: userData.preferred_language || "English",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return mockUser
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
    console.log("Mock: Getting user by phone", phoneNumber)
    return null // Always return null for mock to simulate new user
  }

  try {
    const { data, error } = await supabase.from("users").select("*").eq("phone_number", phoneNumber).single()

    if (error && error.code !== "PGRST116") throw error
    return data as User | null
  } catch (error) {
    console.error("Error fetching user by phone:", error)
    return null
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
    console.log("Mock: Creating consultation", consultationData)
    const mockConsultation: Consultation = {
      id: `consultation_${Date.now()}`,
      ...consultationData,
      status: "scheduled",
      duration_minutes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      healthcare_providers: mockHealthcareProviders.find((p) => p.id === consultationData.provider_id),
    }
    return mockConsultation
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
    console.log("Mock: Getting user consultations", userId)
    return []
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
    return []
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
    console.log("Mock: Creating payment", paymentData)
    return {
      id: `payment_${Date.now()}`,
      ...paymentData,
      transaction_id: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
      payment_status: "completed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
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
