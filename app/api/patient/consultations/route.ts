import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";

// GET - Get patient's consultations
export async function GET(request: Request) {
  const { user, profile, error } = await authGuard({ requiredRole: "Patient" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    const supabase = await createClient();

    let query = supabase
      .from("consultations")
      .select(
        `
        *,
        healthcare_providers (
          id,
          full_name,
          specialty,
          languages,
          experience_years,
          rating,
          location
        )
      `
      )
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (limit) {
      const limitNum = parseInt(limit, 10);
      query = query.limit(limitNum);
    }

    if (offset) {
      const offsetNum = parseInt(offset, 10);
      query = query.range(offsetNum, offsetNum + (parseInt(limit || "10", 10) - 1));
    }

    const { data: consultations, error: queryError } = await query;

    if (queryError) {
      return NextResponse.json(
        { error: queryError.message || "Failed to fetch consultations" },
        { status: 400 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from("consultations")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (status && status !== "all") {
      countQuery = countQuery.eq("status", status);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      consultations: consultations || [],
      total: count || 0,
    });
  } catch (error) {
    console.error("Error fetching consultations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

