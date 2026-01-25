import { NextResponse } from "next/server";
import { z } from "zod";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { 
  createConsultationSchema,
  createConsultationRequestSchema 
} from "@/lib/validations/consultation";

// GET - Fetch user's consultations
export async function GET() {
  const { user, profile, error } = await authGuard();

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // Build query based on role
    let query = supabase
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
      .order("scheduled_at", { ascending: false });

    // Patients see only their consultations
    // Doctors see consultations assigned to them
    // Admins see all consultations
    if (profile.role === "Patient") {
      query = query.eq("user_id", user.id);
    } else if (profile.role === "Doctor") {
      // Get provider ID using user_id (correct relationship)
      const { data: provider } = await supabase
        .from("healthcare_providers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (provider) {
        query = query.eq("provider_id", provider.id);
      } else {
        // If doctor doesn't have provider profile, return empty
        return NextResponse.json({ data: [] });
      }
    }
    // Admin sees all - no filter needed

    const { data, error: dbError } = await query;

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch consultations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new consultation
export async function POST(request: Request) {
  const { user, profile, error } = await authGuard();

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only patients can create consultations
  if (profile.role !== "Patient" && profile.role !== "Admin") {
    return NextResponse.json(
      { error: "Only patients can create consultations" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const supabase = await createClient();

    // Determine if this is a new request workflow (no provider_id) or legacy workflow
    const isRequestWorkflow = !body.provider_id;

    if (isRequestWorkflow) {
      // New workflow: Create consultation request (pending admin review)
      const validatedData = createConsultationRequestSchema.parse(body);

      // Get consultation type pricing
      const consultationPricing: Record<"video" | "voice" | "sms", number> = {
        video: 15000,
        voice: 10000,
        sms: 5000,
      };

      const cost_leone = consultationPricing[validatedData.consultation_type];

      // ✅ FIX: Update user profile with phone number and name if provided in consultation form
      // This ensures phone numbers from consultation booking are saved
      if (validatedData.patient_phone || validatedData.patient_name) {
        const updateData: { phone_number?: string; full_name?: string; updated_at: string } = {
          updated_at: new Date().toISOString(),
        };

        // Format and add phone number if provided
        if (validatedData.patient_phone) {
          let formattedPhone = validatedData.patient_phone.trim();
          if (!formattedPhone.startsWith("+")) {
            // Assume Sierra Leone if no country code
            if (formattedPhone.match(/^[0-9]{9}$/)) {
              formattedPhone = `+232${formattedPhone}`;
            } else if (formattedPhone.match(/^232[0-9]{9}$/)) {
              formattedPhone = `+${formattedPhone}`;
            }
          }
          updateData.phone_number = formattedPhone;
        }

        // Add name if provided
        if (validatedData.patient_name) {
          updateData.full_name = validatedData.patient_name;
        }

        // Update user profile
        const { error: updateError } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", user.id);

        if (updateError) {
          console.warn("Failed to update user profile:", updateError);
          // Don't fail the consultation creation if profile update fails
        } else {
          console.log("✅ User profile updated from consultation form:", {
            phoneUpdated: !!validatedData.patient_phone,
            nameUpdated: !!validatedData.patient_name,
          });
        }
      }

      // Create consultation request
      const { data: consultation, error: consultationError } = await supabase
        .from("consultations")
        .insert([
          {
            user_id: user.id,
            provider_id: null, // No provider assigned yet
            consultation_type: validatedData.consultation_type,
            consultation_category: validatedData.consultation_category,
            preferred_date: validatedData.preferred_date,
            preferred_time_range: validatedData.preferred_time_range || null,
            scheduled_at: null, // Will be set when assigned
            cost_leone: cost_leone,
            reason_for_consultation: validatedData.reason_for_consultation,
            consent_acknowledged: validatedData.consent_acknowledged,
            status: "pending_admin_review",
          },
        ])
        .select(
          `
          *,
          users (
            id,
            full_name,
            email
          )
        `
        )
        .single();

      if (consultationError) {
        console.error("Database error:", consultationError);
        console.error("Error details:", JSON.stringify(consultationError, null, 2));
        return NextResponse.json(
          { 
            error: "Failed to create consultation request",
            details: consultationError.message || consultationError.code || "Unknown database error"
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ data: consultation }, { status: 201 });
    } else {
      // Legacy workflow: Create consultation with provider (backward compatibility)
      const validatedData = createConsultationSchema.parse(body);

      if (!validatedData.provider_id) {
        return NextResponse.json(
          { error: "Provider ID is required for direct booking" },
          { status: 400 }
        );
      }

      // Verify provider exists and is available
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

      // Create consultation
      const { data: consultation, error: consultationError } = await supabase
        .from("consultations")
        .insert([
          {
            user_id: user.id,
            provider_id: validatedData.provider_id,
            consultation_type: validatedData.consultation_type,
            scheduled_at: validatedData.scheduled_at,
            cost_leone: validatedData.cost_leone,
            reason_for_consultation: validatedData.reason_for_consultation,
            status: "scheduled",
          },
        ])
        .select(
          `
          *,
          healthcare_providers (
            id,
            full_name,
            specialty,
            languages
          )
        `
        )
        .single();

      if (consultationError) {
        console.error("Database error:", consultationError);
        return NextResponse.json(
          { error: "Failed to create consultation" },
          { status: 500 }
        );
      }

      // Notify provider about new consultation booking
      if (consultation && consultation.provider_id) {
        try {
          const { notifyProviderBooking } = await import("@/lib/notifications");
          await notifyProviderBooking(consultation.id, consultation.provider_id);
        } catch (notifError) {
          console.error("Error sending provider notification:", notifError);
          // Don't fail the request if notification fails
        }
      }

      return NextResponse.json({ data: consultation }, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
