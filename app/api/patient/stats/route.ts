import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { user, profile, error } = await authGuard({ requiredRole: "Patient" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch all statistics in parallel
    const [
      upcomingConsultationsResult,
      totalConsultationsResult,
      healthContentResult,
      paymentsResult,
    ] = await Promise.all([
      // Upcoming consultations (include assigned, confirmed, scheduled, in_progress)
      // Check both scheduled_at and preferred_date for future dates
      supabase
        .from("consultations")
        .select("id, scheduled_at, preferred_date, status", { count: "exact", head: false })
        .eq("user_id", user.id)
        .in("status", ["assigned", "confirmed", "scheduled", "in_progress"]),

      // Total consultations
      supabase
        .from("consultations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),

      // Health content viewed (we'll use download_count as a proxy)
      // Note: This is a simplified approach. In a real app, you'd track views separately
      supabase
        .from("health_content")
        .select("download_count")
        .limit(1000), // Get all content to sum downloads

      // Total payments (both completed and pending)
      supabase
        .from("payments")
        .select("amount_leone, payment_status")
        .eq("user_id", user.id)
        .in("payment_status", ["completed", "pending"]),
    ]);

    // Calculate total health content views (using download count as proxy)
    // In a real implementation, you'd have a separate views table
    const healthContentViewed = healthContentResult.data?.reduce(
      (sum, content) => sum + (content.download_count || 0),
      0
    ) || 0;

    // Calculate total payments (include both completed and pending)
    // This ensures payments show even if webhooks haven't updated status yet
    const totalPayments = paymentsResult.data?.reduce(
      (sum, payment) => sum + (payment.amount_leone || 0),
      0
    ) || 0;

    // Calculate upcoming consultations count
    // Filter consultations that are upcoming (scheduled_at or preferred_date in future, or no date set)
    const upcomingConsultations = (upcomingConsultationsResult.data || []).filter((consultation) => {
      // If has scheduled_at, check if it's in the future
      if (consultation.scheduled_at) {
        const scheduledDate = new Date(consultation.scheduled_at);
        return scheduledDate >= today;
      }
      // If has preferred_date, check if it's in the future
      if (consultation.preferred_date) {
        const preferredDate = new Date(consultation.preferred_date);
        return preferredDate >= today;
      }
      // If no date set but status is assigned/confirmed, count as upcoming
      return ["assigned", "confirmed"].includes(consultation.status);
    }).length;

    // Get recent consultations with payment information
    const { data: recentConsultations } = await supabase
      .from("consultations")
      .select(
        `
        id,
        scheduled_at,
        preferred_date,
        consultation_type,
        status,
        cost_leone,
        healthcare_providers (
          id,
          full_name,
          specialty
        ),
        payments (
          id,
          payment_status,
          amount_leone,
          payment_method
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      stats: {
        upcomingConsultations: upcomingConsultations,
        healthContentViewed,
        totalPayments,
        totalConsultations: totalConsultationsResult.count || 0,
        recentConsultations: recentConsultations || [],
      },
    });
  } catch (error) {
    console.error("Error fetching patient stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

