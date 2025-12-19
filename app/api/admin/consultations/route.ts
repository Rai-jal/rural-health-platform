import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch all consultations (Admin only)
export async function GET(request: Request) {
  const { user, profile, error } = await authGuard({ requiredRole: "Admin" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const providerId = searchParams.get("provider_id");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    // Build count query for pagination
    let countQuery = supabase
      .from("consultations")
      .select("*", { count: "exact", head: true });

    if (status) {
      countQuery = countQuery.eq("status", status);
    }
    if (providerId) {
      countQuery = countQuery.eq("provider_id", providerId);
    }

    const { count, error: countError } = await countQuery;
    if (countError) {
      console.error("Error counting consultations:", countError);
    }

    let query = supabase
      .from("consultations")
      .select(
        `
        *,
        users (
          id,
          full_name,
          email,
          phone_number
        ),
        healthcare_providers (
          id,
          full_name,
          specialty
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    if (providerId) {
      query = query.eq("provider_id", providerId);
    }

    const { data: consultations, error: consultationsError } = await query;

    if (consultationsError) {
      return NextResponse.json(
        { error: "Failed to fetch consultations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      consultations: consultations || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching consultations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

