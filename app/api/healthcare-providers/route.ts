import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch healthcare providers (public endpoint)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get("specialty");
    const language = searchParams.get("language");
    const available = searchParams.get("available") === "true";

    const supabase = await createClient();

    let query = supabase
      .from("healthcare_providers")
      .select("*")
      .order("rating", { ascending: false });

    // Apply filters
    if (specialty) {
      query = query.eq("specialty", specialty);
    }

    if (language) {
      query = query.contains("languages", [language]);
    }

    if (available) {
      query = query.eq("is_available", true);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch healthcare providers" },
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
