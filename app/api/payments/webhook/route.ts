import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

// POST - Payment webhook handler
// This endpoint receives callbacks from payment gateways
export async function POST(request: Request) {
  try {
    // TODO: Verify webhook signature from payment gateway
    // This is critical for security - never trust webhooks without verification

    const body = await request.json();
    const supabase = await createClient();

    // Extract payment information from webhook
    const {
      transaction_id,
      payment_status,
      amount,
      // Add other fields based on your payment gateway
    } = body;

    if (!transaction_id) {
      return NextResponse.json(
        { error: "Transaction ID required" },
        { status: 400 }
      );
    }

    // Update payment status
    const { data: payment, error: updateError } = await supabase
      .from("payments")
      .update({
        payment_status: payment_status || "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_id", transaction_id)
      .select()
      .single();

    if (updateError) {
      console.error("Database error:", updateError);
      return NextResponse.json(
        { error: "Failed to update payment" },
        { status: 500 }
      );
    }

    // If payment completed, you might want to:
    // - Send confirmation email/SMS
    // - Update consultation status
    // - Trigger notifications

    return NextResponse.json({ message: "Webhook processed", data: payment });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
