import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

// GET - Fetch doctor's consultations
export async function GET(request: Request) {
  const { user, profile, error } = await authGuard({
    requiredRole: "Doctor",
  });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const adminClient = getAdminClient();

    // Get doctor's provider ID - try by user_id first, then by email
    let { data: provider, error: providerError } = await adminClient
      .from("healthcare_providers")
      .select("id, user_id, full_name, email")
      .eq("user_id", user.id)
      .single();

    // If not found by user_id, try by email
    if (providerError || !provider) {
      if (user.email) {
        const { data: providerByEmail, error: emailError } = await adminClient
          .from("healthcare_providers")
          .select("id, user_id, full_name, email")
          .eq("email", user.email)
          .single();

        if (!emailError && providerByEmail) {
          provider = providerByEmail;
          providerError = null;
        }
      }
    }

    if (providerError || !provider) {
      // Doctor doesn't have a provider profile yet - return empty list
      console.warn(
        `No provider profile found for doctor user_id: ${user.id}, email: ${user.email}`
      );
      return NextResponse.json({ consultations: [] });
    }

    const providerId = provider.id as string;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Use admin client to fetch consultations with user data (bypasses RLS)
    let query = adminClient
      .from("consultations")
      .select(
        `
        *,
        users (
          id,
          full_name,
          email,
          phone_number,
          age,
          location
        )
      `
      )
      .eq("provider_id", providerId)
      .order("scheduled_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: consultations, error: consultationsError } = await query;

    if (consultationsError) {
      console.error("Consultations query error:", consultationsError);
      return NextResponse.json(
        { error: "Failed to fetch consultations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ consultations: consultations || [] });
  } catch (error) {
    console.error("Error fetching consultations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
