import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch single health content item
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data, error: dbError } = await supabase
      .from("health_content")
      .select("*")
      .eq("id", params.id)
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Content not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

