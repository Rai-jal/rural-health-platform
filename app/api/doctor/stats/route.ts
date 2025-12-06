import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";

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

    // First, find the healthcare provider profile for this doctor
    const { data: provider, error: providerError } = await supabase
      .from("healthcare_providers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const providerId = provider?.id;

    if (providerError || !providerId) {
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

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch all statistics in parallel
    const [
      todaysConsultationsResult,
      pendingConsultationsResult,
      totalConsultationsResult,
      uniquePatientsResult,
      upcomingConsultationsResult,
    ] = await Promise.all([
      // Today's consultations
      supabase
        .from("consultations")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", providerId)
        .gte("scheduled_at", today.toISOString())
        .lt("scheduled_at", tomorrow.toISOString()),

      // Pending consultations
      supabase
        .from("consultations")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", providerId)
        .eq("status", "scheduled"),

      // Total consultations
      supabase
        .from("consultations")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", providerId),

      // Unique patients (distinct user_ids)
      supabase
        .from("consultations")
        .select("user_id")
        .eq("provider_id", providerId),

      // Upcoming consultations (next 7 days)
      supabase
        .from("consultations")
        .select(
          `
          id,
          scheduled_at,
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
        .in("status", ["scheduled", "in_progress"])
        .gte("scheduled_at", today.toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(10),
    ]);

    // Get unique patients count
    const uniquePatients = new Set(
      uniquePatientsResult.data?.map((c) => c.user_id).filter(Boolean) || []
    ).size;

    // Get provider rating
    const { data: providerData } = await supabase
      .from("healthcare_providers")
      .select("rating")
      .eq("id", providerId)
      .single();

    return NextResponse.json({
      stats: {
        todaysConsultations: todaysConsultationsResult.count || 0,
        pendingConsultations: pendingConsultationsResult.count || 0,
        totalPatients: uniquePatients,
        rating: providerData?.rating || 0.0,
        totalConsultations: totalConsultationsResult.count || 0,
        upcomingConsultations: upcomingConsultationsResult.data || [],
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

