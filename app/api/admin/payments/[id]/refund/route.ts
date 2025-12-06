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

    // TODO: Integrate with payment gateway API to process actual refund
    // This is a placeholder - implement actual refund logic based on payment_provider

    return NextResponse.json({
      payment: updatedPayment,
      message: "Refund processed successfully",
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

