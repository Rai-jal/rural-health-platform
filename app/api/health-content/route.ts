import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch health content (public or authenticated)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const language = searchParams.get("language");
    const search = searchParams.get("search");

    const supabase = await createClient();

    let query = supabase
      .from("health_content")
      .select("*")
      .order("rating", { ascending: false });

    // Apply filters
    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (language) {
      query = query.eq("language", language);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch health content" },
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
