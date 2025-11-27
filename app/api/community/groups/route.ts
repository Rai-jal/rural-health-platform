import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch community groups
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const language = searchParams.get("language");
    const active = searchParams.get("active") !== "false"; // Default to true

    const supabase = await createClient();

    let query = supabase
      .from("community_groups")
      .select(
        `
        *,
        healthcare_providers (
          id,
          full_name,
          specialty
        )
      `
      )
      .order("member_count", { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq("category", category);
    }

    if (language) {
      query = query.eq("language", language);
    }

    if (active) {
      query = query.eq("is_active", true);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch community groups" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
