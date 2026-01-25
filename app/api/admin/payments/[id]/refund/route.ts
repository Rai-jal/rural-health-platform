import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";

// POST - Process refund (Admin only)
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
    const supabase = await createClient();

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("id", params.id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    if (payment.payment_status !== "completed") {
      return NextResponse.json(
        { error: "Can only refund completed payments" },
        { status: 400 }
      );
    }

    // Update payment status to refunded
    const { data: updatedPayment, error: updateError } = await supabase
      .from("payments")
      .update({
        payment_status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to process refund" },
        { status: 400 }
      );
    }

    // Process actual refund via Flutterwave API
    if (payment.payment_provider === "flutterwave" && payment.transaction_id) {
      try {
        const { paymentGateway } = await import("@/lib/payment/gateway");
        
        // Process refund through Flutterwave
        const refundResult = await paymentGateway.refundPayment(
          payment.transaction_id,
          payment.amount_leone // Full refund by default
        );

        if (!refundResult.success) {
          // Refund failed at gateway, but we already updated DB
          // Rollback the database update
          await supabase
            .from("payments")
            .update({
              payment_status: "completed", // Revert to completed
              updated_at: new Date().toISOString(),
            })
            .eq("id", params.id);

          return NextResponse.json(
            {
              error: "Refund failed at payment gateway",
              details: refundResult.error || refundResult.message,
            },
            { status: 400 }
          );
        }

        console.log("✅ Refund processed successfully:", {
          paymentId: updatedPayment.id,
          refundId: refundResult.refundId,
          amount: payment.amount_leone,
        });

        return NextResponse.json({
          payment: updatedPayment,
          refund: {
            refundId: refundResult.refundId,
            message: refundResult.message,
          },
          message: "Refund processed successfully",
        });
      } catch (refundError) {
        console.error("❌ Error processing refund via gateway:", refundError);

        // Rollback database update
        await supabase
          .from("payments")
          .update({
            payment_status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", params.id);

        return NextResponse.json(
          {
            error: "Failed to process refund via payment gateway",
            details: refundError instanceof Error ? refundError.message : "Unknown error",
          },
          { status: 500 }
        );
      }
    } else {
      // For non-Flutterwave payments or missing transaction_id, just update database
      console.warn("⚠️  Refund processed (database only):", {
        paymentId: updatedPayment.id,
        provider: payment.payment_provider,
        hasTransactionId: !!payment.transaction_id,
      });

      return NextResponse.json({
        payment: updatedPayment,
        message: "Refund status updated (database only - no gateway integration)",
        warning: "Payment gateway refund not processed. Manual refund may be required.",
      });
    }
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

