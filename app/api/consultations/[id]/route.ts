import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import {
  validateStatusTransition,
  validateRolePermission,
  type UserRole,
} from "@/lib/validations/consultation-status";

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
      // Get doctor's provider ID
      const { data: provider } = await supabase
        .from("healthcare_providers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!provider || consultation.provider_id !== provider.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ consultation });
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

    // Get current consultation to validate status transition
    const { data: currentConsultation, error: fetchError } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", params.id)
      .single();

    if (fetchError || !currentConsultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    // If doctor, verify they own this consultation
    if (profile.role === "Doctor") {
      const { data: provider } = await supabase
        .from("healthcare_providers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!provider) {
        return NextResponse.json(
          { error: "Doctor profile not found" },
          { status: 404 }
        );
      }

      if (currentConsultation.provider_id !== provider.id) {
        return NextResponse.json(
          { error: "Consultation not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Validate update data
    const updateData: {
      status?: string;
      notes?: string;
      duration_minutes?: number;
    } = {};

    // Validate status transition if status is being updated
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

      if (body.status !== currentConsultation.status) {
        const role = profile.role as UserRole;
        const validation = validateStatusTransition(
          currentConsultation.status,
          body.status,
          role
        );

        if (!validation.isValid) {
          return NextResponse.json(
            { 
              error: "Invalid status transition",
              message: validation.error,
              currentStatus: currentConsultation.status,
              targetStatus: body.status,
            },
            { status: 400 }
          );
        }
      }

      updateData.status = body.status;
    }

    // Validate role permissions for other actions
    if (body.notes !== undefined) {
      const permission = validateRolePermission(
        currentConsultation.status,
        profile.role as UserRole,
        "update_notes"
      );
      if (!permission.canPerform) {
        return NextResponse.json(
          { error: permission.error },
          { status: 403 }
        );
      }
      updateData.notes = body.notes;
    }

    if (body.duration_minutes !== undefined) {
      const permission = validateRolePermission(
        currentConsultation.status,
        profile.role as UserRole,
        "update_duration"
      );
      if (!permission.canPerform) {
        return NextResponse.json(
          { error: permission.error },
          { status: 403 }
        );
      }
      updateData.duration_minutes = Number.parseInt(body.duration_minutes);
    }

    const { data: consultation, error: updateError } = await supabase
      .from("consultations")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
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

    return NextResponse.json({ consultation });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
