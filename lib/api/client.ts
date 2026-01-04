/**
 * Client-side API utilities
 * These functions call the API routes instead of directly accessing the database
 */

// Types
export interface Consultation {
  id: string;
  user_id: string;
  provider_id: string;
  consultation_type: "video" | "voice" | "sms";
  scheduled_at: string;
  cost_leone: number;
  status: string;
  reason_for_consultation?: string;
  notes?: string;
  duration_minutes?: number;
  created_at: string;
  updated_at: string;
  healthcare_providers?: {
    id: string;
    full_name: string;
    specialty: string;
    languages: string[];
    rating?: number;
  };
  users?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface Payment {
  id: string;
  consultation_id: string;
  user_id: string;
  amount_leone: number;
  payment_method: string;
  payment_provider?: string;
  payment_status: string;
  transaction_id: string;
  created_at: string;
  updated_at: string;
  consultations?: {
    id: string;
    consultation_type: string;
    scheduled_at: string;
    healthcare_providers?: {
      full_name: string;
      specialty: string;
    };
  };
}

export interface HealthcareProvider {
  id: string;
  full_name: string;
  specialty: string;
  languages: string[];
  experience_years?: number;
  rating?: number;
  total_consultations?: number;
  location?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface HealthContent {
  id: string;
  title: string;
  category: string;
  content_type: string;
  language: string;
  description?: string;
  content_text?: string;
  audio_url?: string;
  video_url?: string;
  duration_minutes?: number;
  rating?: number;
  download_count?: number;
  is_offline_available?: boolean;
  topics?: string[];
  created_at: string;
  updated_at: string;
}

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  language: string;
  location?: string;
  member_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  healthcare_providers?: {
    id: string;
    full_name: string;
    specialty: string;
  };
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_type: string;
  location: string;
  scheduled_at: string;
  duration_minutes: number;
  max_attendees: number;
  current_attendees: number;
  is_virtual: boolean;
  created_at: string;
  updated_at: string;
  healthcare_providers?: {
    id: string;
    full_name: string;
    specialty: string;
  };
}

// API Response wrapper
interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: unknown;
  message?: string;
}

// Helper function to handle API calls
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const result: ApiResponse<T> = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error:
          result.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return { data: result.data || (result as unknown as T), error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// Consultations API
export async function getConsultations(): Promise<{
  data: Consultation[] | null;
  error: string | null;
}> {
  return apiCall<Consultation[]>("/api/consultations");
}

export async function getConsultation(id: string): Promise<{
  data: Consultation | null;
  error: string | null;
}> {
  return apiCall<Consultation>(`/api/consultations/${id}`);
}

export async function createConsultation(consultation: {
  provider_id: string;
  consultation_type: "video" | "voice" | "sms";
  scheduled_at: string;
  cost_leone: number;
  reason_for_consultation?: string;
}): Promise<{ data: Consultation | null; error: string | null }> {
  return apiCall<Consultation>("/api/consultations", {
    method: "POST",
    body: JSON.stringify(consultation),
  });
}

export async function updateConsultation(
  id: string,
  updates: {
    status?: string;
    notes?: string;
    duration_minutes?: number;
  }
): Promise<{ data: Consultation | null; error: string | null }> {
  return apiCall<Consultation>(`/api/consultations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

// Payments API
export async function getPayments(): Promise<{
  data: Payment[] | null;
  error: string | null;
}> {
  return apiCall<Payment[]>("/api/payments");
}

export async function createPayment(payment: {
  consultation_id: string;
  amount_leone: number;
  payment_method: string;
  payment_provider?: string;
}): Promise<{ data: Payment | null; error: string | null }> {
  return apiCall<Payment>("/api/payments", {
    method: "POST",
    body: JSON.stringify(payment),
  });
}

// Healthcare Providers API
export async function getHealthcareProviders(filters?: {
  specialty?: string;
  language?: string;
  available?: boolean;
}): Promise<{ data: HealthcareProvider[] | null; error: string | null }> {
  const params = new URLSearchParams();
  if (filters?.specialty) params.append("specialty", filters.specialty);
  if (filters?.language) params.append("language", filters.language);
  if (filters?.available !== undefined)
    params.append("available", filters.available.toString());

  const queryString = params.toString();
  const url = `/api/healthcare-providers${
    queryString ? `?${queryString}` : ""
  }`;

  return apiCall<HealthcareProvider[]>(url);
}

// Health Content API
export async function getHealthContent(filters?: {
  category?: string;
  language?: string;
  search?: string;
}): Promise<{ data: HealthContent[] | null; error: string | null }> {
  const params = new URLSearchParams();
  if (filters?.category) params.append("category", filters.category);
  if (filters?.language) params.append("language", filters.language);
  if (filters?.search) params.append("search", filters.search);

  const queryString = params.toString();
  const url = `/api/health-content${queryString ? `?${queryString}` : ""}`;

  return apiCall<HealthContent[]>(url);
}

export async function incrementDownloadCount(
  contentId: string
): Promise<{ message: string; download_count: number } | null> {
  const { data, error } = await apiCall<{
    message: string;
    download_count: number;
  }>(`/api/health-content/${contentId}/download`, {
    method: "POST",
  });

  if (error) {
    console.error("Failed to increment download count:", error);
    return null;
  }

  return data;
}

// Community API
export async function getCommunityGroups(filters?: {
  category?: string;
  language?: string;
  active?: boolean;
}): Promise<{ data: CommunityGroup[] | null; error: string | null }> {
  const params = new URLSearchParams();
  if (filters?.category) params.append("category", filters.category);
  if (filters?.language) params.append("language", filters.language);
  if (filters?.active !== undefined)
    params.append("active", filters.active.toString());

  const queryString = params.toString();
  const url = `/api/community/groups${queryString ? `?${queryString}` : ""}`;

  return apiCall<CommunityGroup[]>(url);
}

export async function getUpcomingEvents(filters?: {
  limit?: number;
  eventType?: string;
}): Promise<{ data: Event[] | null; error: string | null }> {
  const params = new URLSearchParams();
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.eventType) params.append("event_type", filters.eventType);

  const queryString = params.toString();
  const url = `/api/community/events${queryString ? `?${queryString}` : ""}`;

  return apiCall<Event[]>(url);
}
