import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createContentSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  content_type: z.enum(["article", "audio", "video"]).default("article"),
  language: z.string().min(1),
  content_text: z.string().optional(),
  audio_url: z.string().url().optional(),
  video_url: z.string().url().optional(),
  duration_minutes: z.number().int().min(0).default(0),
  is_offline_available: z.boolean().default(false),
  topics: z.array(z.string()).default([]),
});

// GET - Fetch all health content (Admin only)
export async function GET() {
  const { user, profile, error } = await authGuard({ requiredRole: "Admin" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    const { data: content, error: contentError } = await supabase
      .from("health_content")
      .select("*")
      .order("created_at", { ascending: false });

    if (contentError) {
      return NextResponse.json(
        { error: "Failed to fetch content" },
        { status: 500 }
      );
    }

    return NextResponse.json({ content: content || [] });
  } catch (error) {
    console.error("Error fetching content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new health content
export async function POST(request: Request) {
  const { user, profile, error } = await authGuard({ requiredRole: "Admin" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = createContentSchema.parse(body);

    const supabase = await createClient();

    const { data: content, error: contentError } = await supabase
      .from("health_content")
      .insert(validatedData)
      .select()
      .single();

    if (contentError) {
      return NextResponse.json(
        { error: contentError.message || "Failed to create content" },
        { status: 400 }
      );
    }

    return NextResponse.json({ content }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

