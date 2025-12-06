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
      communityGroupsResult,
      paymentsResult,
    ] = await Promise.all([
      // Upcoming consultations
      supabase
        .from("consultations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .in("status", ["scheduled", "in_progress"])
        .gte("scheduled_at", today.toISOString()),

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

      // Community groups joined
      supabase
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_active", true),

      // Total payments
      supabase
        .from("payments")
        .select("amount_leone, payment_status")
        .eq("user_id", user.id),
    ]);

    // Calculate total health content views (using download count as proxy)
    // In a real implementation, you'd have a separate views table
    const healthContentViewed = healthContentResult.data?.reduce(
      (sum, content) => sum + (content.download_count || 0),
      0
    ) || 0;

    // Calculate total payments
    const totalPayments = paymentsResult.data?.reduce(
      (sum, payment) => {
        if (payment.payment_status === "completed") {
          return sum + (payment.amount_leone || 0);
        }
        return sum;
      },
      0
    ) || 0;

    // Get recent consultations
    const { data: recentConsultations } = await supabase
      .from("consultations")
      .select(
        `
        id,
        scheduled_at,
        consultation_type,
        status,
        cost_leone,
        healthcare_providers (
          id,
          full_name,
          specialty
        )
      `
      )
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      stats: {
        upcomingConsultations: upcomingConsultationsResult.count || 0,
        healthContentViewed,
        communityGroups: communityGroupsResult.count || 0,
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

