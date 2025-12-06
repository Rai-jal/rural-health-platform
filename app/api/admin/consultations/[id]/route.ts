import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateConsultationSchema = z.object({
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
  notes: z.string().optional(),
  duration_minutes: z.number().int().min(0).optional(),
});

// PATCH - Update consultation (Admin only)
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
    const validatedData = updateConsultationSchema.parse(body);

    const supabase = await createClient();

    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select(
        `
        *,
        users (
          id,
          full_name,
          email
        ),
        healthcare_providers (
          id,
          full_name,
          specialty
        )
      `
      )
      .single();

    if (consultationError) {
      return NextResponse.json(
        { error: consultationError.message || "Failed to update consultation" },
        { status: 400 }
      );
    }

    return NextResponse.json({ consultation });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating consultation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/Delete consultation (Admin only)
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

    // Update status to cancelled instead of deleting
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (consultationError) {
      return NextResponse.json(
        { error: consultationError.message || "Failed to cancel consultation" },
        { status: 400 }
      );
    }

    return NextResponse.json({ consultation });
  } catch (error) {
    console.error("Error cancelling consultation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

