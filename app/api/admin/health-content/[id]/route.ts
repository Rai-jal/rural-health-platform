import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateContentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  content_type: z.enum(["article", "audio", "video"]).optional(),
  language: z.string().min(1).optional(),
  content_text: z.string().optional(),
  audio_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  duration_minutes: z.number().int().min(0).optional(),
  is_offline_available: z.boolean().optional(),
  topics: z.array(z.string()).optional(),
});

// PATCH - Update health content
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, profile, error } = await authGuard({ requiredRole: "Admin" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = updateContentSchema.parse(body);

    const supabase = await createClient();

    const { data: content, error: contentError } = await supabase
      .from("health_content")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (contentError) {
      return NextResponse.json(
        { error: contentError.message || "Failed to update content" },
        { status: 400 }
      );
    }

    return NextResponse.json({ content });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete health content
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, profile, error } = await authGuard({ requiredRole: "Admin" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    const { error: deleteError } = await supabase
      .from("health_content")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete content" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

