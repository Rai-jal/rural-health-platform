import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch healthcare providers (public endpoint)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const specialty = searchParams.get("specialty");
    const language = searchParams.get("language");
    const available = searchParams.get("available");

    const supabase = await createClient();

    // Build query - fetch all providers from database
    let query = supabase
      .from("healthcare_providers")
      .select("*")
      .order("rating", { ascending: false })
      .order("full_name", { ascending: true });

    // Apply filters only if specified
    if (specialty) {
      query = query.eq("specialty", specialty);
    }

    if (language) {
      query = query.contains("languages", [language]);
    }

    // Only filter by availability if explicitly requested
    // This allows showing all providers by default
    if (available === "true") {
      query = query.eq("is_available", true);
    } else if (available === "false") {
      query = query.eq("is_available", false);
    }
    // If available is not specified, show all providers

    const { data, error: dbError } = await query;

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch healthcare providers", details: dbError.message },
        { status: 500 }
      );
    }

    // Ensure we return an array even if data is null
    const providers = data || [];

    // Log for debugging (remove in production)
    console.log(`Fetched ${providers.length} healthcare providers from database`);
    if (providers.length > 0) {
      console.log("Provider names:", providers.map(p => p.full_name).join(", "));
    }

    return NextResponse.json({ data: providers });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
