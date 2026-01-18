import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { assignProviderSchema } from "@/lib/validations/consultation";
import { validateStatusTransition, type UserRole } from "@/lib/validations/consultation-status";
import { z } from "zod";

// POST - Assign provider to consultation request (Admin only)
export async function POST(
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
    const validatedData = assignProviderSchema.parse(body);

    const supabase = await createClient();
    const adminClient = getAdminClient();

    // Get the consultation request - use admin client to bypass RLS
    const { data: consultation, error: consultationError } = await adminClient
      .from("consultations")
      .select("*")
      .eq("id", params.id)
      .single();

    if (consultationError || !consultation) {
      console.error("Consultation lookup error:", consultationError);
      return NextResponse.json(
        { error: "Consultation request not found" },
        { status: 404 }
      );
    }

    // Validate status transition: pending_admin_review → assigned
    const validation = validateStatusTransition(
      consultation.status,
      "assigned",
      "Admin"
    );

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: "Invalid status transition",
          message: validation.error,
          currentStatus: consultation.status,
          targetStatus: "assigned",
        },
        { status: 400 }
      );
    }

    // Additional check: can only assign from pending_admin_review
    if (consultation.status !== "pending_admin_review") {
      return NextResponse.json(
        { 
          error: `Consultation is in ${consultation.status} status and cannot be assigned`,
          message: "Only consultations in 'pending_admin_review' status can be assigned a provider",
        },
        { status: 400 }
      );
    }

    // Verify provider exists and is available - use admin client to bypass RLS
    const { data: provider, error: providerError } = await adminClient
      .from("healthcare_providers")
      .select("id, is_available, full_name, specialty")
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

    // Get consultation type pricing if cost not provided
    const consultationPricing: Record<"video" | "voice" | "sms", number> = {
      video: 15000,
      voice: 10000,
      sms: 5000,
    };
    const cost_leone = validatedData.cost_leone || consultationPricing[consultation.consultation_type as "video" | "voice" | "sms"];

    // Update consultation with provider assignment
    const updateData: {
      provider_id: string;
      status: string;
      scheduled_at?: string;
      cost_leone: number;
    } = {
      provider_id: validatedData.provider_id,
      status: "assigned",
      cost_leone: cost_leone,
    };

    if (validatedData.scheduled_at) {
      updateData.scheduled_at = validatedData.scheduled_at;
    } else if (consultation.preferred_date) {
      // Use preferred date if no scheduled_at provided
      updateData.scheduled_at = consultation.preferred_date;
    }

    // Update consultation - use admin client to bypass RLS
    const { data: updatedConsultation, error: updateError } = await adminClient
      .from("consultations")
      .update(updateData)
      .eq("id", params.id)
      .select(
        `
        *,
        users (
          id,
          full_name,
          email,
          phone_number
        ),
        healthcare_providers (
          id,
          full_name,
          specialty,
          languages
        )
      `
      )
      .single();

    if (updateError || !updatedConsultation) {
      console.error("Database error:", updateError);
      console.error("Update data attempted:", updateData);
      return NextResponse.json(
        { error: "Failed to assign provider", details: updateError?.message },
        { status: 500 }
      );
    }

    console.log(`Successfully assigned provider ${validatedData.provider_id} to consultation ${params.id}`);

    // Notify patient about assignment
    if (updatedConsultation.user_id) {
      try {
        const { notifyPatientAssignment } = await import("@/lib/notifications");
        await notifyPatientAssignment(updatedConsultation.id, updatedConsultation.user_id);
      } catch (notifError) {
        console.error("Error sending assignment notification:", notifError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({ consultation: updatedConsultation }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error details:", error.issues);
      return NextResponse.json(
        { 
          error: "Validation error", 
          issues: error.issues,
          message: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
        },
        { status: 400 }
      );
    }
    console.error("Error assigning provider:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
