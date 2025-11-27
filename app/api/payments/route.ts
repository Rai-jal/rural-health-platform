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

    // Generate transaction ID
    const transactionId = `TXN${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    // Create payment record
    // Note: In production, you'd integrate with payment gateway here
    // For now, we'll create the record with "pending" status
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          consultation_id: validatedData.consultation_id,
          user_id: user.id,
          amount_leone: validatedData.amount_leone,
          payment_method: validatedData.payment_method,
          payment_provider: validatedData.payment_provider,
          payment_status: "pending", // Will be updated by webhook
          transaction_id: transactionId,
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
        { error: "Failed to create payment" },
        { status: 500 }
      );
    }

    // TODO: Integrate with payment gateway here
    // For now, we'll simulate successful payment
    // In production, this would call the payment gateway API
    // and update status via webhook

    return NextResponse.json(
      {
        data: payment,
        message: "Payment initiated. Status will be updated via webhook.",
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
