import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";

// POST - Increment download count
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, profile, error } = await authGuard();

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Verify content exists
    const { data: content, error: contentError } = await supabase
      .from("health_content")
      .select("id, download_count")
      .eq("id", params.id)
      .single();

    if (contentError || !content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Increment download count using RPC function or direct update
    const { error: updateError } = await supabase.rpc(
      "increment_download_count",
      {
        content_id: params.id,
      }
    );

    // If RPC doesn't exist, use direct update
    if (updateError) {
      const { error: directUpdateError } = await supabase
        .from("health_content")
        .update({ download_count: (content.download_count || 0) + 1 })
        .eq("id", params.id);

      if (directUpdateError) {
        console.error("Database error:", directUpdateError);
        return NextResponse.json(
          { error: "Failed to update download count" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: "Download count updated",
      download_count: (content.download_count || 0) + 1,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
