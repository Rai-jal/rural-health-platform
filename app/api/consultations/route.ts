import { NextResponse } from "next/server";
import { z } from "zod";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { createConsultationSchema } from "@/lib/validations/consultation";

// GET - Fetch user's consultations
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

    // Build query based on role
    let query = supabase
      .from("consultations")
      .select(
        `
        *,
        healthcare_providers (
          id,
          full_name,
          specialty,
          languages,
          rating
        ),
        users (
          id,
          full_name,
          email
        )
      `
      )
      .order("scheduled_at", { ascending: false });

    // Patients see only their consultations
    // Doctors see consultations assigned to them
    // Admins see all consultations
    if (profile.role === "Patient") {
      query = query.eq("user_id", user.id);
    } else if (profile.role === "Doctor") {
      // Get provider ID using user_id (correct relationship)
      const { data: provider } = await supabase
        .from("healthcare_providers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (provider) {
        query = query.eq("provider_id", provider.id);
      } else {
        // If doctor doesn't have provider profile, return empty
        return NextResponse.json({ data: [] });
      }
    }
    // Admin sees all - no filter needed

    const { data, error: dbError } = await query;

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch consultations" },
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

// POST - Create new consultation
export async function POST(request: Request) {
  const { user, profile, error } = await authGuard();

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only patients can create consultations
  if (profile.role !== "Patient" && profile.role !== "Admin") {
    return NextResponse.json(
      { error: "Only patients can create consultations" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // Validate input
    const validatedData = createConsultationSchema.parse(body);

    const supabase = await createClient();

    // Verify provider exists and is available
    const { data: provider, error: providerError } = await supabase
      .from("healthcare_providers")
      .select("id, is_available")
      .eq("id", validatedData.provider_id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: "Healthcare provider not found" },
        { status: 404 }
      );
    }

    if (!provider.is_available) {
      return NextResponse.json(
        { error: "Healthcare provider is not available" },
        { status: 400 }
      );
    }

    // Create consultation
    const { data: consultation, error: consultationError } = await supabase
      .from("consultations")
      .insert([
        {
          user_id: user.id,
          provider_id: validatedData.provider_id,
          consultation_type: validatedData.consultation_type,
          scheduled_at: validatedData.scheduled_at,
          cost_leone: validatedData.cost_leone,
          reason_for_consultation: validatedData.reason_for_consultation,
          status: "scheduled",
        },
      ])
      .select(
        `
        *,
        healthcare_providers (
          id,
          full_name,
          specialty,
          languages
        )
      `
      )
      .single();

    if (consultationError) {
      console.error("Database error:", consultationError);
      return NextResponse.json(
        { error: "Failed to create consultation" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: consultation }, { status: 201 });
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
