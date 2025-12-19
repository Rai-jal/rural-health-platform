import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch all payments (Admin only)
export async function GET(request: Request) {
  const { user, profile, error } = await authGuard({ requiredRole: "Admin" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const paymentMethod = searchParams.get("payment_method");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    // Build count query for pagination
    let countQuery = supabase
      .from("payments")
      .select("*", { count: "exact", head: true });

    if (status) {
      countQuery = countQuery.eq("payment_status", status);
    }
    if (paymentMethod) {
      countQuery = countQuery.eq("payment_method", paymentMethod);
    }

    const { count, error: countError } = await countQuery;
    if (countError) {
      console.error("Error counting payments:", countError);
    }

    let query = supabase
      .from("payments")
      .select(
        `
        *,
        users (
          id,
          full_name,
          email
        ),
        consultations (
          id,
          consultation_type,
          scheduled_at
        )
      `
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("payment_status", status);
    }

    if (paymentMethod) {
      query = query.eq("payment_method", paymentMethod);
    }

    const { data: payments, error: paymentsError } = await query;

    if (paymentsError) {
      return NextResponse.json(
        { error: "Failed to fetch payments" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      payments: payments || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

