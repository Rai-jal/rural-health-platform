import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import { paymentGateway } from "@/lib/payment/gateway";
import { capturePaymentError, captureApiError } from "@/lib/sentry/api-wrapper";

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
    // Flutterwave official docs: signature is in 'flutterwave-signature' header
    // Also check alternative header names for compatibility
    const signature =
      headersList.get("flutterwave-signature") ||  // ✅ Primary (official Flutterwave header)
      headersList.get("verif-hash") ||              // Fallback (older format)
      headersList.get("x-flutterwave-signature") ||
      headersList.get("x-signature") ||
      "";

    // Debug logging for webhook troubleshooting
    console.log("Webhook received:", {
      hasBody: !!body,
      event: body?.event,
      signatureHeader: signature ? "present" : "missing",
      headers: {
        flutterwaveSignature: headersList.get("flutterwave-signature") ? "present" : "missing",
        verifHash: headersList.get("verif-hash") ? "present" : "missing",
        contentType: headersList.get("content-type"),
      },
    });

    // Process webhook through payment gateway service
    // This verifies signature and extracts transaction details
    const verification = await paymentGateway.handleWebhook(body, signature);

    if (!verification.verified) {
      console.error("Webhook verification failed:", {
        hasSignature: !!signature,
        reference: verification.reference,
      });
      
      // Capture webhook verification failure (security issue)
      capturePaymentError(new Error("Webhook signature verification failed"), {
        route: "/api/payments/webhook",
        gateway: "flutterwave",
      });
      
      // Send admin alert for webhook verification failure
      try {
        const { alertWebhookFailed } = await import("@/lib/notifications/admin-alerts");
        await alertWebhookFailed(
          "Flutterwave",
          verification.reference || "unknown",
          "Webhook signature verification failed"
        );
      } catch (alertError) {
        console.error("Failed to send admin alert:", alertError);
      }
      
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
      console.error("❌ CRITICAL: Payment not found for webhook:", {
        reference: verification.reference,
        transactionId: verification.transactionId,
        event: body?.event,
        status: verification.status,
        amount: verification.amount,
      });
      
      // Log all payments with similar references for debugging
      const { data: similarPayments } = await adminClient
        .from("payments")
        .select("id, transaction_id, payment_status, created_at")
        .ilike("transaction_id", `%${verification.reference?.substring(0, 10)}%`)
        .limit(5);
      
      console.error("Similar payments found:", similarPayments);
      
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
      
      // Capture payment update failure
      capturePaymentError(updateErr || new Error("Payment update failed"), {
        route: "/api/payments/webhook",
        consultationId: payment?.consultation_id,
        gateway: "flutterwave",
      });
      
      return NextResponse.json(
        { error: "Failed to update payment" },
        { status: 500 }
      );
    }

    payment = updatedPayment;

    console.log("✅ Payment status updated:", {
      paymentId: payment.id,
      oldStatus: payment.payment_status,
      newStatus: verification.status,
      consultationId: payment.consultation_id,
    });

    // If payment completed, update consultation status and send notifications
    if (verification.status === "completed" && payment && payment.consultations) {
      // Update consultation status to scheduled
      const { error: consultationUpdateError } = await adminClient
        .from("consultations")
        .update({
          status: "scheduled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.consultation_id);

      if (consultationUpdateError) {
        console.error("❌ Failed to update consultation status:", {
          consultationId: payment.consultation_id,
          error: consultationUpdateError,
        });
      } else {
        console.log("✅ Consultation status updated to 'scheduled':", {
          consultationId: payment.consultation_id,
        });
      }

      // Send payment confirmation notification
      try {
        const { notifyPaymentConfirmation } = await import("@/lib/notifications");
        await notifyPaymentConfirmation(
          payment.consultation_id,
          payment.consultations.user_id,
          payment.amount_leone
        );
        console.log("✅ Payment confirmation notification sent");
      } catch (notifError) {
        console.error("Error sending payment confirmation:", notifError);
        // Don't fail the webhook if notification fails
      }
    } else {
      console.log("Payment not completed or consultation missing:", {
        status: verification.status,
        hasConsultation: !!payment.consultations,
        paymentId: payment.id,
      });
    }

    // Return success to Flutterwave immediately
    // This prevents retries and is important for webhook reliability
    return NextResponse.json({
      message: "Webhook processed successfully",
      status: "success",
    });
  } catch (error) {
    console.error("Webhook error:", error);
    
    // Capture unexpected webhook errors
    capturePaymentError(error, {
      route: "/api/payments/webhook",
      gateway: "flutterwave",
    });
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
