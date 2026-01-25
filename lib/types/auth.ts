// User roles
export type UserRole = 'Patient' | 'Doctor' | 'Admin'

// Notification preferences type
export type NotificationPreference = 'sms' | 'email' | 'both'

// User profile type (matches database schema)
export interface UserProfile {
  id: string
  email: string
  phone_number?: string | null
  full_name: string
  age?: number | null
  preferred_language: string
  location?: string | null
  role: UserRole
  notification_preferences?: NotificationPreference // Default: 'sms' (backward compatible)
  created_at: string
  updated_at: string
}

// Auth session type
export interface AuthSession {
  user: {
    id: string
    email: string
    role: UserRole
    profile: UserProfile
  }
}

