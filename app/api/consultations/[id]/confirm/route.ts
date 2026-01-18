import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { confirmConsultationSchema } from "@/lib/validations/consultation";
import { validateStatusTransition } from "@/lib/validations/consultation-status";
import { z } from "zod";

// PATCH - Patient confirms or switches provider (Patient only)
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

  // Only patients can confirm consultations
  if (profile.role !== "Patient") {
    return NextResponse.json(
      { error: "Only patients can confirm consultations" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = confirmConsultationSchema.parse(body);

    const supabase = await createClient();

    // Get the consultation
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", params.id)
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    // Verify the consultation belongs to this patient
    if (consultation.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Validate status transition: assigned → confirmed
    const validation = validateStatusTransition(
      consultation.status,
      validatedData.confirmed ? "confirmed" : consultation.status,
      "Patient"
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: "Invalid status transition",
          message: validation.error,
          currentStatus: consultation.status,
        },
        { status: 400 }
      );
    }

    // Additional check: can only confirm from assigned status
    if (validatedData.confirmed && consultation.status !== "assigned") {
      return NextResponse.json(
        { 
          error: `Consultation is in ${consultation.status} status and cannot be confirmed`,
          message: "Only consultations in 'assigned' status can be confirmed",
        },
        { status: 400 }
      );
    }

    // Verify the provider exists and is available (if switching)
    if (validatedData.provider_id !== consultation.provider_id) {
      const { data: provider, error: providerError } = await supabase
        .from("healthcare_providers")
        .select("id, is_available")
        .eq("id", validatedData.provider_id)
        .single();

      if (providerError || !provider) {
        return NextResponse.json(
          { error: "Healthcare provider not found" },
          { status: 404 }
        );
      }

      if (!provider.is_available) {
        return NextResponse.json(
          { error: "Healthcare provider is not available" },
          { status: 400 }
        );
      }
    }

    // Update consultation status to confirmed
    const updateData: {
      provider_id: string;
      status: string;
    } = {
      provider_id: validatedData.provider_id,
      status: validatedData.confirmed ? "confirmed" : "assigned",
    };

    // If confirming, set scheduled_at if not already set
    if (validatedData.confirmed && !consultation.scheduled_at && consultation.preferred_date) {
      updateData.scheduled_at = consultation.preferred_date;
    }

    const { data: updatedConsultation, error: updateError } = await supabase
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
          specialty,
          languages,
          rating
        )
      `
      )
      .single();

    if (updateError || !updatedConsultation) {
      console.error("Database error:", updateError);
      return NextResponse.json(
        { error: "Failed to confirm consultation" },
        { status: 500 }
      );
    }

    // If confirmed, notify both provider and patient
    if (validatedData.confirmed && updatedConsultation.provider_id) {
      try {
        const { notifyProviderBooking, notifyPatientAcceptance } = await import("@/lib/notifications");
        // Notify provider that consultation is confirmed
        await notifyProviderBooking(updatedConsultation.id, updatedConsultation.provider_id);
        // Notify patient that their confirmation was successful
        if (updatedConsultation.user_id) {
          await notifyPatientAcceptance(updatedConsultation.id, updatedConsultation.user_id);
        }
      } catch (notifError) {
        console.error("Error sending confirmation notifications:", notifError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({ consultation: updatedConsultation }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Error confirming consultation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
