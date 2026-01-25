/**
 * Flutterwave Payment Webhook Handler
 * 
 * Endpoint: POST /api/webhooks/flutterwave
 * 
 * Receives callbacks from Flutterwave when payment status changes.
 * Verifies webhook signature and updates payment status in database.
 * 
 * Environment Variables Required:
 * - FLUTTERWAVE_WEBHOOK_SECRET: Secret hash for signature verification
 * - FLUTTERWAVE_SECRET_KEY: Flutterwave secret key (for API calls if needed)
 * 
 * Flutterwave Webhook Events:
 * - charge.completed: Payment completed successfully
 * - charge.successful: Payment successful (same as completed)
 * 
 * Security:
 * - Verifies webhook signature using HMAC SHA256
 * - Uses 'verif-hash' header (Flutterwave standard)
 * - Only processes verified webhooks
 * - Updates payment status and consultation automatically
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { getAdminClient } from "@/lib/supabase/admin";

/**
 * Verify Flutterwave webhook signature
 * Uses HMAC SHA256 with secret hash from environment variable
 */
function verifyWebhookSignature(payload: any, signature: string): boolean {
  // Support both environment variable names
  const secretHash = 
    process.env.FLUTTERWAVE_WEBHOOK_SECRET || 
    process.env.FLUTTERWAVE_SECRET_HASH || 
    "";

  if (!secretHash) {
    console.warn("⚠️  FLUTTERWAVE_WEBHOOK_SECRET not configured. Webhook verification disabled.");
    // In development, allow webhooks without verification (not recommended for production)
    return process.env.NODE_ENV !== "production";
  }

  try {
    // Flutterwave sends signature in 'verif-hash' header
    // Calculate expected hash using HMAC SHA256
    const payloadString = JSON.stringify(payload);
    const expectedHash = crypto
      .createHmac("sha256", secretHash)
      .update(payloadString)
      .digest("hex");

    // Compare provided signature with expected hash
    // Remove any 'sha256=' prefix if present
    const providedHash = signature.replace("sha256=", "").trim();

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash),
      Buffer.from(providedHash)
    );
  } catch (error) {
    console.error("Webhook signature verification error:", error);
    return false;
  }
}

/**
 * Map Flutterwave payment status to our internal status
 */
function mapFlutterwaveStatus(flutterwaveStatus: string): "pending" | "completed" | "failed" {
  const statusMap: Record<string, "pending" | "completed" | "failed"> = {
    "successful": "completed",
    "completed": "completed",
    "pending": "pending",
    "failed": "failed",
    "cancelled": "failed",
  };

  return statusMap[flutterwaveStatus.toLowerCase()] || "pending";
}

/**
 * POST - Flutterwave webhook handler
 * 
 * Processes payment status updates from Flutterwave
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const headersList = headers();

    // Get Flutterwave webhook signature from 'verif-hash' header
    const signature = headersList.get("verif-hash") || "";

    // Log webhook receipt for debugging
    console.log("📥 Flutterwave webhook received:", {
      event: body?.event,
      hasSignature: !!signature,
      timestamp: new Date().toISOString(),
      headers: {
        verifHash: signature ? "present" : "missing",
        contentType: headersList.get("content-type"),
        userAgent: headersList.get("user-agent"),
      },
    });

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error("❌ Webhook signature verification failed:", {
        hasSignature: !!signature,
        event: body?.event,
        reference: body?.data?.tx_ref,
      });

      return NextResponse.json(
        { 
          error: "Webhook verification failed - invalid signature",
          message: "Signature verification failed. Check FLUTTERWAVE_WEBHOOK_SECRET."
        },
        { status: 401 }
      );
    }

    console.log("✅ Webhook signature verified");

    // Extract transaction details from Flutterwave webhook payload
    const event = body.event;
    const transaction = body.data || {};

    // Only process charge.completed and charge.successful events
    if (event !== "charge.completed" && event !== "charge.successful") {
      console.log(`ℹ️  Ignoring webhook event: ${event}`);
      return NextResponse.json({
        message: "Event ignored",
        event,
        status: "ignored",
      });
    }

    // Extract transaction details
    const txRef = transaction.tx_ref || transaction.flw_ref || "";
    const transactionId = transaction.id ? `FLW-${transaction.id}` : txRef;
    const status = mapFlutterwaveStatus(transaction.status || "pending");
    const amount = transaction.amount || 0;
    const currency = transaction.currency || "SLL";

    console.log("📊 Processing payment update:", {
      txRef,
      transactionId,
      status,
      amount,
      currency,
      event,
    });

    // Use admin client to bypass RLS for webhook updates
    const adminClient = getAdminClient();

    // Find payment by transaction reference (Flutterwave tx_ref)
    // The tx_ref is stored in the transaction_id field in our database
    const { data: payment, error: paymentError } = await adminClient
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
      .eq("transaction_id", txRef)
      .maybeSingle();

    if (paymentError) {
      console.error("❌ Database error finding payment:", paymentError);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    if (!payment) {
      console.warn("⚠️  Payment not found for webhook:", {
        txRef,
        transactionId,
        event,
        status,
      });

      // Log similar payments for debugging
      const { data: similarPayments } = await adminClient
        .from("payments")
        .select("id, transaction_id, payment_status, created_at")
        .ilike("transaction_id", `%${txRef.substring(0, 10)}%`)
        .limit(5);

      console.log("Similar payments found:", similarPayments);

      // Return 200 to Flutterwave so they don't retry
      // But log the issue for investigation
      return NextResponse.json({
        message: "Webhook received but payment not found",
        txRef,
        status: "not_found",
      });
    }

    // Update payment status
    const { data: updatedPayment, error: updateError } = await adminClient
      .from("payments")
      .update({
        payment_status: status,
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

    if (updateError || !updatedPayment) {
      console.error("❌ Database error updating payment:", updateError);
      return NextResponse.json(
        { error: "Failed to update payment" },
        { status: 500 }
      );
    }

    console.log("✅ Payment status updated:", {
      paymentId: updatedPayment.id,
      oldStatus: payment.payment_status,
      newStatus: status,
      consultationId: updatedPayment.consultation_id,
    });

    // If payment completed, update consultation status and send notifications
    if (status === "completed" && updatedPayment.consultations) {
      // Update consultation status to scheduled
      const { error: consultationUpdateError } = await adminClient
        .from("consultations")
        .update({
          status: "scheduled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", updatedPayment.consultation_id);

      if (consultationUpdateError) {
        console.error("❌ Failed to update consultation status:", {
          consultationId: updatedPayment.consultation_id,
          error: consultationUpdateError,
        });
      } else {
        console.log("✅ Consultation status updated to 'scheduled':", {
          consultationId: updatedPayment.consultation_id,
        });
      }

      // Send payment confirmation notification
      try {
        const { notifyPaymentConfirmation } = await import("@/lib/notifications");
        await notifyPaymentConfirmation(
          updatedPayment.consultation_id,
          updatedPayment.consultations.user_id,
          updatedPayment.amount_leone
        );
        console.log("✅ Payment confirmation notification sent");
      } catch (notifError) {
        console.error("⚠️  Error sending payment confirmation:", notifError);
        // Don't fail the webhook if notification fails
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Webhook processed successfully in ${processingTime}ms`);

    // Return 200 immediately to Flutterwave
    // This prevents retries and is important for webhook reliability
    return NextResponse.json({
      message: "Webhook processed successfully",
      status: "success",
      paymentId: updatedPayment.id,
      processingTime: `${processingTime}ms`,
    });

  } catch (error) {
    console.error("❌ Webhook error:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Webhook health check endpoint
 * Useful for testing webhook endpoint availability
 */
export async function GET() {
  return NextResponse.json({
    message: "Flutterwave webhook endpoint is active",
    endpoint: "/api/webhooks/flutterwave",
    method: "POST",
    requiredHeaders: ["verif-hash"],
    environment: {
      hasWebhookSecret: !!process.env.FLUTTERWAVE_WEBHOOK_SECRET,
      hasSecretHash: !!process.env.FLUTTERWAVE_SECRET_HASH,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}
