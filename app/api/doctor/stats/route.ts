import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { user, profile, error } = await authGuard({ requiredRole: "Doctor" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const adminClient = getAdminClient();

    // First, find the healthcare provider profile for this doctor by user_id
    let { data: provider, error: providerError } = await adminClient
      .from("healthcare_providers")
      .select("id, user_id, full_name")
      .eq("user_id", user.id)
      .single();

    const providerId = provider?.id;

    if (providerError || !providerId) {
      console.warn(
        `No provider profile found for doctor user_id: ${user.id}, email: ${user.email}`
      );
      // Doctor doesn't have a provider profile yet
      return NextResponse.json({
        stats: {
          todaysConsultations: 0,
          pendingConsultations: 0,
          totalPatients: 0,
          rating: 0.0,
          totalConsultations: 0,
          upcomingConsultations: [],
        },
      });
    }

    console.log(`Fetching stats for provider_id: ${providerId}`);

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all statistics in parallel using admin client (bypasses RLS)
    const [
      todaysConsultationsResult,
      pendingConsultationsResult,
      totalConsultationsResult,
      uniquePatientsResult,
      upcomingConsultationsResult,
    ] = await Promise.all([
      // Today's consultations (only count those with scheduled_at set)
      adminClient
        .from("consultations")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", providerId)
        .not("scheduled_at", "is", null)
        .gte("scheduled_at", today.toISOString())
        .lt("scheduled_at", tomorrow.toISOString()),

      // Pending consultations (assigned, confirmed - waiting for patient confirmation or scheduled)
      adminClient
        .from("consultations")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", providerId)
        .in("status", ["assigned", "confirmed", "scheduled"]),

      // Total consultations
      adminClient
        .from("consultations")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", providerId),

      // Unique patients (distinct user_ids)
      adminClient
        .from("consultations")
        .select("user_id")
        .eq("provider_id", providerId),

      // Upcoming consultations (includes assigned, confirmed, scheduled, in_progress)
      // Get all consultations with these statuses, then filter/limit in code
      adminClient
        .from("consultations")
        .select(
          `
          id,
          scheduled_at,
          preferred_date,
          consultation_type,
          status,
          users (
            id,
            full_name,
            email
          )
        `
        )
        .eq("provider_id", providerId)
        .in("status", ["assigned", "confirmed", "scheduled", "in_progress"])
        .limit(20),
    ]);

    // Get unique patients count
    const uniquePatients = new Set(
      uniquePatientsResult.data?.map((c) => c.user_id).filter(Boolean) || []
    ).size;

    // Filter and sort upcoming consultations
    const upcomingConsultations = (upcomingConsultationsResult.data || [])
      .filter((consultation) => {
        // Include if scheduled_at is today or later, or if preferred_date is today or later, or if no date set (assigned)
        if (consultation.scheduled_at) {
          return new Date(consultation.scheduled_at) >= today;
        }
        if (consultation.preferred_date) {
          return new Date(consultation.preferred_date) >= today;
        }
        // Include assigned/confirmed consultations even without dates
        return ["assigned", "confirmed"].includes(consultation.status);
      })
      .sort((a, b) => {
        // Sort by scheduled_at first, then preferred_date, then by creation
        const dateA = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 
                     (a.preferred_date ? new Date(a.preferred_date).getTime() : 0);
        const dateB = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 
                     (b.preferred_date ? new Date(b.preferred_date).getTime() : 0);
        return dateA - dateB;
      })
      .slice(0, 10);

    // Get provider rating
    const { data: providerData } = await adminClient
      .from("healthcare_providers")
      .select("rating")
      .eq("id", providerId)
      .single();

    // Log results for debugging
    console.log(`Stats results for provider ${providerId}:`, {
      todaysCount: todaysConsultationsResult.count,
      pendingCount: pendingConsultationsResult.count,
      totalCount: totalConsultationsResult.count,
      uniquePatientsCount: uniquePatients,
      upcomingCount: upcomingConsultations.length,
      upcomingStatuses: upcomingConsultations.map(c => ({ id: c.id, status: c.status })),
      providerRating: providerData?.rating,
    });

    // Check for errors in any query
    if (todaysConsultationsResult.error) {
      console.error("Error fetching today's consultations:", todaysConsultationsResult.error);
    }
    if (pendingConsultationsResult.error) {
      console.error("Error fetching pending consultations:", pendingConsultationsResult.error);
    }
    if (totalConsultationsResult.error) {
      console.error("Error fetching total consultations:", totalConsultationsResult.error);
    }
    if (upcomingConsultationsResult.error) {
      console.error("Error fetching upcoming consultations:", upcomingConsultationsResult.error);
    }

    return NextResponse.json({
      stats: {
        todaysConsultations: todaysConsultationsResult.count || 0,
        pendingConsultations: pendingConsultationsResult.count || 0,
        totalPatients: uniquePatients,
        rating: providerData?.rating || 0.0,
        totalConsultations: totalConsultationsResult.count || 0,
        upcomingConsultations: upcomingConsultations,
      },
    });
  } catch (error) {
    console.error("Error fetching doctor stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

