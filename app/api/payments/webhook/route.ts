import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { paymentGateway } from "@/lib/payment/gateway";

// POST - Payment webhook handler
// This endpoint receives callbacks from payment gateways
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const headersList = headers();
    const paymentMethod = headersList.get("x-payment-method") || "orange_money"; // Default
    
    // Verify webhook signature from payment gateway
    // TODO: Implement signature verification based on payment gateway
    // This is critical for security - never trust webhooks without verification
    // Example:
    // const signature = headersList.get("x-signature");
    // const isValid = await verifyWebhookSignature(body, signature, paymentMethod);
    // if (!isValid) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    // Process webhook through payment gateway service
    const verification = await paymentGateway.handleWebhook(body, paymentMethod);

    if (!verification.verified) {
      return NextResponse.json(
        { error: "Webhook verification failed" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update payment status
    const { data: payment, error: updateError } = await supabase
      .from("payments")
      .update({
        payment_status: verification.status,
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_id", verification.transactionId)
      .select(
        `
        *,
        consultations (
          id,
          status,
          user_id
        )
      `
      )
      .single();

    if (updateError) {
      console.error("Database error:", updateError);
      return NextResponse.json(
        { error: "Failed to update payment" },
        { status: 500 }
      );
    }

    // If payment completed, update consultation status and send notifications
    if (verification.status === "completed" && payment) {
      // Update consultation status to confirmed
      await supabase
        .from("consultations")
        .update({
          status: "scheduled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.consultation_id);

      // TODO: Send confirmation email/SMS
      // TODO: Trigger notifications
      // Example:
      // await sendPaymentConfirmationSMS(payment.consultations?.user_id);
    }

    return NextResponse.json({ 
      message: "Webhook processed successfully", 
      data: payment,
      verification 
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
