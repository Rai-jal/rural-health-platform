import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import {
  validateStatusTransition,
  validateRolePermission,
  type UserRole,
} from "@/lib/validations/consultation-status";

const updateConsultationSchema = z.object({
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
  notes: z.string().optional(),
  duration_minutes: z.number().int().min(0).optional(),
  scheduled_at: z.string().datetime().optional(),
});

// PATCH - Update consultation (Admin only)
// Admin can: reschedule, cancel, update status (within valid transitions)
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
    const adminClient = getAdminClient();

    // Get current consultation to check status and validate transition
    const { data: currentConsultation, error: fetchError } = await adminClient
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

    // Validate status transition if status is being updated
    if (validatedData.status && validatedData.status !== currentConsultation.status) {
      const role = profile.role as UserRole;
      const validation = validateStatusTransition(
        currentConsultation.status,
        validatedData.status,
        role
      );

      if (!validation.isValid) {
        return NextResponse.json(
          { 
            error: "Invalid status transition",
            message: validation.error,
            currentStatus: currentConsultation.status,
            targetStatus: validatedData.status,
          },
          { status: 400 }
        );
      }
    }

    // Validate role permissions for other actions
    if (validatedData.notes) {
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
    }

    if (validatedData.scheduled_at) {
      const permission = validateRolePermission(
        currentConsultation.status,
        profile.role as UserRole,
        "reschedule"
      );
      if (!permission.canPerform) {
        return NextResponse.json(
          { error: permission.error },
          { status: 403 }
        );
      }
    }

    // Build update data
    const updateData: {
      status?: string;
      notes?: string;
      duration_minutes?: number;
      scheduled_at?: string;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (validatedData.status) {
      updateData.status = validatedData.status;
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }
    if (validatedData.duration_minutes !== undefined) {
      updateData.duration_minutes = validatedData.duration_minutes;
    }
    if (validatedData.scheduled_at !== undefined) {
      updateData.scheduled_at = validatedData.scheduled_at;
    }

    // Update consultation
    const { data: consultation, error: consultationError } = await adminClient
      .from("consultations")
      .update(updateData)
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
// Admin can cancel consultations in most statuses
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
    const adminClient = getAdminClient();

    // Get current consultation to validate status
    const { data: currentConsultation, error: fetchError } = await adminClient
      .from("consultations")
      .select("status")
      .eq("id", params.id)
      .single();

    if (fetchError || !currentConsultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    // Cannot cancel already completed or cancelled consultations
    if (currentConsultation.status === "completed") {
      return NextResponse.json(
        { 
          error: "Cannot cancel a completed consultation",
          message: "Completed consultations cannot be cancelled",
        },
        { status: 400 }
      );
    }

    if (currentConsultation.status === "cancelled") {
      return NextResponse.json(
        { 
          error: "Consultation is already cancelled",
          message: "This consultation is already cancelled",
        },
        { status: 400 }
      );
    }

    // Validate status transition to cancelled
    const validation = validateStatusTransition(
      currentConsultation.status,
      "cancelled",
      "Admin"
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: "Cannot cancel consultation",
          message: validation.error,
          currentStatus: currentConsultation.status,
        },
        { status: 400 }
      );
    }

    // Update status to cancelled instead of deleting
    const { data: consultation, error: consultationError } = await adminClient
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
