import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const { user, profile, error } = await authGuard({ requiredRole: "Admin" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Fetch all statistics in parallel
    const [
      usersResult,
      consultationsResult,
      paymentsResult,
      providersResult,
      recentUsersResult,
      recentConsultationsResult,
    ] = await Promise.all([
      // Total users count
      supabase.from("users").select("id", { count: "exact", head: true }),
      
      // Total consultations count
      supabase.from("consultations").select("id", { count: "exact", head: true }),
      
      // Total revenue (sum of completed payments)
      supabase
        .from("payments")
        .select("amount_leone")
        .eq("payment_status", "completed"),
      
      // Total healthcare providers count
      supabase
        .from("healthcare_providers")
        .select("id", { count: "exact", head: true }),
      
      // Recent users (last 7 days)
      supabase
        .from("users")
        .select("id")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .select("id", { count: "exact", head: true }),
      
      // Recent consultations (last 7 days)
      supabase
        .from("consultations")
        .select("id")
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .select("id", { count: "exact", head: true }),
    ]);

    // Calculate total revenue
    const totalRevenue = paymentsResult.data?.reduce(
      (sum, payment) => sum + (payment.amount_leone || 0),
      0
    ) || 0;

    // Get pending consultations count
    const { count: pendingConsultations } = await supabase
      .from("consultations")
      .select("id", { count: "exact", head: true })
      .eq("status", "scheduled");

    // Get completed consultations count
    const { count: completedConsultations } = await supabase
      .from("consultations")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed");

    // Get users by role
    const [patientsResult, doctorsResult, adminsResult] = await Promise.all([
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "Patient"),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "Doctor"),
      supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "Admin"),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers: usersResult.count || 0,
        totalConsultations: consultationsResult.count || 0,
        totalRevenue,
        totalHealthcareProviders: providersResult.count || 0,
        pendingConsultations: pendingConsultations || 0,
        completedConsultations: completedConsultations || 0,
        recentUsers: recentUsersResult.count || 0, // Last 7 days
        recentConsultations: recentConsultationsResult.count || 0, // Last 7 days
        usersByRole: {
          patients: patientsResult.count || 0,
          doctors: doctorsResult.count || 0,
          admins: adminsResult.count || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}

