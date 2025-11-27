import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch upcoming events
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const eventType = searchParams.get("event_type");

    const supabase = await createClient();

    let query = supabase
      .from("events")
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
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true });

    // Apply filters
    if (eventType) {
      query = query.eq("event_type", eventType);
    }

    if (limit) {
      query = query.limit(Number.parseInt(limit) || 10);
    } else {
      query = query.limit(10);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch events" },
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
