import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { paymentGateway } from "@/lib/payment/gateway";

/**
 * POST - Payment webhook handler
 * 
 * Receives callbacks from Flutterwave when payment status changes.
 * 
 * Flutterwave Webhook Events:
 * - charge.completed: Payment completed successfully
 * - charge.successful: Payment successful (same as completed)
 * 
 * Security:
 * - Verifies webhook signature using Flutterwave webhook secret
 * - Only processes verified webhooks
 * - Updates payment status and consultation automatically
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const headersList = headers();
    
    // Get Flutterwave webhook signature from headers
    // Flutterwave sends signature in 'verif-hash' header (or 'x-flutterwave-signature')
    const signature =
      headersList.get("verif-hash") ||
      headersList.get("x-flutterwave-signature") ||
      headersList.get("x-signature") ||
      "";

    // Process webhook through payment gateway service
    // This verifies signature and extracts transaction details
    const verification = await paymentGateway.handleWebhook(body, signature);

    if (!verification.verified) {
      console.error("Webhook verification failed:", {
        hasSignature: !!signature,
        reference: verification.reference,
      });
      return NextResponse.json(
        { error: "Webhook verification failed - invalid signature" },
        { status: 401 }
      );
    }

    // Use admin client to bypass RLS for webhook updates
    const adminClient = getAdminClient();

    // Find payment by transaction reference (Flutterwave tx_ref or transaction_id)
    // Try reference first (most reliable), then transaction_id
    let payment = null;
    let updateError = null;

    // Try to find payment by reference (from Flutterwave tx_ref)
    // Flutterwave tx_ref is stored in transaction_id field
    if (verification.reference) {
      const result = await adminClient
        .from("payments")
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
        .eq("transaction_id", verification.reference)
        .maybeSingle();

      if (result.data) {
        payment = result.data;
      }
    }

    // If not found by reference, try transaction_id
    if (!payment && verification.transactionId) {
      const result = await adminClient
        .from("payments")
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
        .eq("transaction_id", verification.transactionId)
        .limit(1)
        .single();

      if (result.data) {
        payment = result.data;
      }
    }

    // If still not found, payment might not exist yet (shouldn't happen but handle gracefully)
    if (!payment) {
      console.warn("Payment not found for webhook:", {
        reference: verification.reference,
        transactionId: verification.transactionId,
      });
      // Return success to Flutterwave so they don't retry, but log the issue
      return NextResponse.json({
        message: "Webhook received but payment not found",
        reference: verification.reference,
      });
    }

    // Update payment status
    const { data: updatedPayment, error: updateErr } = await adminClient
      .from("payments")
      .update({
        payment_status: verification.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
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

    if (updateErr || !updatedPayment) {
      console.error("Database error updating payment:", updateErr);
      return NextResponse.json(
        { error: "Failed to update payment" },
        { status: 500 }
      );
    }

    payment = updatedPayment;

    // If payment completed, update consultation status and send notifications
    if (verification.status === "completed" && payment && payment.consultations) {
      // Update consultation status to confirmed
      await adminClient
        .from("consultations")
        .update({
          status: "scheduled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.consultation_id);

      // Send payment confirmation notification
      try {
        const { notifyPaymentConfirmation } = await import("@/lib/notifications");
        await notifyPaymentConfirmation(
          payment.consultation_id,
          payment.consultations.user_id,
          payment.amount_leone
        );
      } catch (notifError) {
        console.error("Error sending payment confirmation:", notifError);
        // Don't fail the webhook if notification fails
      }
    }

    // Return success to Flutterwave immediately
    // This prevents retries and is important for webhook reliability
    return NextResponse.json({
      message: "Webhook processed successfully",
      status: "success",
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
