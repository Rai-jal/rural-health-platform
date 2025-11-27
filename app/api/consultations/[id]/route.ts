import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";

// GET - Get single consultation
export async function GET(
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

    const { data: consultation, error: dbError } = await supabase
      .from("consultations")
      .select(
        `
        *,
        healthcare_providers (
          id,
          full_name,
          specialty,
          languages,
          rating
        ),
        users (
          id,
          full_name,
          email
        )
      `
      )
      .eq("id", params.id)
      .single();

    if (dbError || !consultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    // Check permissions
    if (profile.role === "Patient" && consultation.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (profile.role === "Doctor") {
      // Doctors can only see their own consultations
      // This would need provider_id check - simplified for now
      // In production, you'd link doctors to healthcare_providers table
    }

    return NextResponse.json({ data: consultation });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update consultation (status, notes, etc.)
export async function PATCH(
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

  // Only doctors and admins can update consultations
  if (profile.role === "Patient") {
    return NextResponse.json(
      { error: "Patients cannot update consultations" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const supabase = await createClient();

    // Validate update data
    const updateData: {
      status?: string;
      notes?: string;
      duration_minutes?: number;
    } = {};

    if (body.status) {
      const validStatuses = [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updateData.status = body.status;
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    if (body.duration_minutes !== undefined) {
      updateData.duration_minutes = Number.parseInt(body.duration_minutes);
    }

    const { data: consultation, error: updateError } = await supabase
      .from("consultations")
      .update(updateData)
      .eq("id", params.id)
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
      .single();

    if (updateError || !consultation) {
      return NextResponse.json(
        { error: "Failed to update consultation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: consultation });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
