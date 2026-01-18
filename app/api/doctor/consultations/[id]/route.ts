import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import {
  validateStatusTransition,
  validateRolePermission,
  type UserRole,
} from "@/lib/validations/consultation-status";

const updateConsultationSchema = z.object({
  status: z.enum(["assigned", "confirmed", "scheduled", "in_progress", "completed", "cancelled"]).optional(),
  notes: z.string().optional(),
  duration_minutes: z.number().int().min(0).optional(),
  scheduled_at: z.string().datetime().optional(),
});

// PATCH - Update consultation (Doctor only)
// Doctor can: update notes, schedule (confirmed → scheduled), start (scheduled → in_progress), complete (in_progress → completed), cancel
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { user, profile, error } = await authGuard({ requiredRole: "Doctor" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Get doctor's provider ID
    const { data: provider, error: providerError } = await supabase
      .from("healthcare_providers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    // Verify consultation belongs to this doctor and get current status
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", params.id)
      .eq("provider_id", provider.id)
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json(
        { error: "Consultation not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateConsultationSchema.parse(body);

    // Validate status transition if status is being updated
    if (validatedData.status && validatedData.status !== consultation.status) {
      const role = profile.role as UserRole;
      const validation = validateStatusTransition(
        consultation.status,
        validatedData.status,
        role
      );

      if (!validation.isValid) {
        return NextResponse.json(
          { 
            error: "Invalid status transition",
            message: validation.error,
            currentStatus: consultation.status,
            targetStatus: validatedData.status,
          },
          { status: 400 }
        );
      }
    }

    // Validate role permissions for other actions
    if (validatedData.notes) {
      const permission = validateRolePermission(
        consultation.status,
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

    if (validatedData.duration_minutes !== undefined) {
      const permission = validateRolePermission(
        consultation.status,
        profile.role as UserRole,
        "update_duration"
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
        consultation.status,
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

    // Update consultation - ensure it still belongs to this doctor
    const { data: updatedConsultation, error: updateError } = await supabase
      .from("consultations")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .eq("provider_id", provider.id) // Ensure doctor can only update their own consultations
      .select(
        `
        *,
        users (
          id,
          full_name,
          email,
          phone_number
        )
      `
      )
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update consultation" },
        { status: 400 }
      );
    }

    // If consultation was accepted (status changed to scheduled), notify patient
    if (
      updatedConsultation &&
      validatedData.status === "scheduled" &&
      updatedConsultation.status === "scheduled" &&
      updatedConsultation.users
    ) {
      try {
        const { notifyPatientAcceptance } = await import("@/lib/notifications");
        await notifyPatientAcceptance(
          updatedConsultation.id,
          updatedConsultation.user_id
        );
      } catch (notifError) {
        console.error("Error sending patient notification:", notifError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({ consultation: updatedConsultation });
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

