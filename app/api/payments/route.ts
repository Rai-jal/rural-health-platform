import { NextResponse } from "next/server";
import { z } from "zod";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { createPaymentSchema } from "@/lib/validations/payment";

// GET - Fetch user's payments
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

    let query = supabase
      .from("payments")
      .select(
        `
        *,
        consultations (
          id,
          consultation_type,
          scheduled_at,
          healthcare_providers (
            full_name,
            specialty
          )
        )
      `
      )
      .order("created_at", { ascending: false });

    // Patients see only their payments
    // Admins see all payments
    if (profile.role === "Patient") {
      query = query.eq("user_id", user.id);
    }
    // Admin sees all - no filter

    const { data, error: dbError } = await query;

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch payments" },
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

// POST - Create payment record
export async function POST(request: Request) {
  const { user, profile, error } = await authGuard();

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only patients can create payments
  if (profile.role !== "Patient" && profile.role !== "Admin") {
    return NextResponse.json(
      { error: "Only patients can create payments" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // Validate input
    const validatedData = createPaymentSchema.parse(body);

    const supabase = await createClient();

    // Verify consultation exists and belongs to user (if patient)
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .select("id, user_id, cost_leone")
      .eq("id", validatedData.consultation_id)
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    // Verify payment amount matches consultation cost
    if (validatedData.amount_leone !== consultation.cost_leone) {
      return NextResponse.json(
        { error: "Payment amount does not match consultation cost" },
        { status: 400 }
      );
    }

    // If patient, verify consultation belongs to them
    if (profile.role === "Patient" && consultation.user_id !== user.id) {
      return NextResponse.json(
        { error: "Consultation does not belong to you" },
        { status: 403 }
      );
    }

    // Get user profile for payment details
    const { data: userProfile } = await supabase
      .from("users")
      .select("full_name, email, phone_number")
      .eq("id", user.id)
      .single();

    // Import payment gateway service
    const { paymentGateway } = await import("@/lib/payment/gateway");

    // Build redirect URL for payment callback (for card/redirect flows)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = `${appUrl}/payments/callback`;

    // Initiate payment through Flutterwave gateway
    // The gateway will generate its own transaction ID and reference
    const gatewayResponse = await paymentGateway.initiatePayment({
      amount: validatedData.amount_leone,
      phoneNumber: body.phone_number || userProfile?.phone_number || user.phone_number,
      email: body.email || userProfile?.email || user.email || `user${user.id}@healthconnect.app`,
      customerName: userProfile?.full_name || profile.full_name || "Customer",
      paymentMethod: validatedData.payment_method as any,
      consultationId: validatedData.consultation_id,
      userId: user.id,
      description: `Consultation payment - ${consultation.consultation_type || "Consultation"}`,
      redirectUrl,
    });

    // Check if gateway initiation was successful
    if (!gatewayResponse.success) {
      return NextResponse.json(
        { 
          error: gatewayResponse.message || "Failed to initiate payment",
          gateway: {
            success: false,
            message: gatewayResponse.message,
          }
        },
        { status: 400 }
      );
    }

    // Create payment record with Flutterwave transaction ID and reference
    // Store reference for webhook matching (more reliable than transaction ID)
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          consultation_id: validatedData.consultation_id,
          user_id: user.id,
          amount_leone: validatedData.amount_leone,
          payment_method: validatedData.payment_method,
          payment_provider: validatedData.payment_provider || "flutterwave", // Default to Flutterwave
          payment_status: gatewayResponse.status,
          transaction_id: gatewayResponse.reference || gatewayResponse.transactionId, // Use reference (tx_ref) as primary ID
        },
      ])
      .select(
        `
        *,
        consultations (
          id,
          consultation_type,
          scheduled_at
        )
      `
      )
      .single();

    if (paymentError) {
      console.error("Database error:", paymentError);
      return NextResponse.json(
        { error: "Failed to create payment record" },
        { status: 500 }
      );
    }

    // Send payment confirmation notification immediately
    // This ensures users get confirmation even if webhook hasn't updated status yet
    if (payment && payment.consultations) {
      try {
        const { notifyPaymentConfirmation } = await import("@/lib/notifications");
        await notifyPaymentConfirmation(
          payment.consultations.id,
          user.id,
          payment.amount_leone
        );
        console.log("✅ Payment confirmation notification sent on payment creation");
      } catch (notifError) {
        console.error("Error sending payment confirmation notification:", notifError);
        // Don't fail the payment creation if notification fails
      }
    }

    // Return payment with gateway response
    // Include payment link for redirect-based payments (card payments)
    return NextResponse.json(
      {
        data: payment,
        gateway: {
          success: gatewayResponse.success,
          message: gatewayResponse.message,
          paymentLink: gatewayResponse.paymentLink, // For card/redirect payments
          paymentInstructions: gatewayResponse.paymentInstructions, // For mobile money/USSD
          reference: gatewayResponse.reference, // Flutterwave transaction reference
          transactionId: gatewayResponse.transactionId,
        },
        message: gatewayResponse.message,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
