import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { twilioCallService } from "@/lib/calls/twilio";

/**
 * Initiate a voice call for consultation
 * POST /api/calls/initiate
 */
export async function POST(request: Request) {
  const { user, profile, error } = await authGuard();

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { consultationId } = body;

    if (!consultationId) {
      return NextResponse.json(
        { error: "Consultation ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get consultation details
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .select(
        `
        *,
        users (
          id,
          full_name,
          phone_number
        ),
        healthcare_providers (
          id,
          full_name,
          user_id,
          users (
            id,
            phone_number
          )
        )
      `
      )
      .eq("id", consultationId)
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    // Determine caller and recipient based on user role
    let callerPhone: string | null = null;
    let recipientPhone: string | null = null;

    if (profile.role === "Patient") {
      callerPhone = consultation.users?.phone_number || null;
      recipientPhone =
        consultation.healthcare_providers?.users?.phone_number || null;
    } else if (profile.role === "Doctor") {
      recipientPhone = consultation.users?.phone_number || null;
      callerPhone =
        consultation.healthcare_providers?.users?.phone_number || null;
    } else {
      return NextResponse.json(
        { error: "Only patients and doctors can initiate calls" },
        { status: 403 }
      );
    }

    if (!callerPhone || !recipientPhone) {
      return NextResponse.json(
        { error: "Phone numbers not available for call" },
        { status: 400 }
      );
    }

    // Only allow voice calls for voice consultation type
    if (consultation.consultation_type !== "voice") {
      return NextResponse.json(
        { error: "Voice calls only available for voice consultations" },
        { status: 400 }
      );
    }

    // Initiate call
    const result = await twilioCallService.initiateVoiceCall({
      to: recipientPhone,
      from: callerPhone,
      consultationId,
      patientName: consultation.users?.full_name,
      providerName: consultation.healthcare_providers?.full_name,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to initiate call" },
        { status: 500 }
      );
    }

    // Update consultation status
    await supabase
      .from("consultations")
      .update({
        status: "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", consultationId);

    return NextResponse.json({
      success: true,
      callSid: result.callSid,
      message: "Call initiated successfully",
    });
  } catch (error) {
    console.error("Error initiating call:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

