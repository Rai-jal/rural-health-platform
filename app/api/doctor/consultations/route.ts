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

    // Get doctor's provider ID by user_id
    let { data: provider, error: providerError } = await adminClient
      .from("healthcare_providers")
      .select("id, user_id, full_name")
      .eq("user_id", user.id)
      .single();

    if (providerError || !provider) {
      // Doctor doesn't have a provider profile yet - return empty list
      console.error(
        `No provider profile found for doctor user_id: ${user.id}, email: ${user.email}`
      );
      return NextResponse.json({ 
        consultations: [],
        error: "No provider profile found. Please contact administrator.",
        debug: {
          user_id: user.id,
          email: user.email
        }
      }, { status: 404 });
    }

    const providerId = provider.id as string;
    
    // Log for debugging
    console.log(`Doctor consultations query: provider_id=${providerId}, doctor_user_id=${user.id}, doctor_email=${user.email}`);

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
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: consultations, error: consultationsError } = await query;

    if (consultationsError) {
      console.error("Consultations query error:", consultationsError);
      console.error("Query details: provider_id=", providerId, "status=", status);
      return NextResponse.json(
        { error: "Failed to fetch consultations", details: consultationsError.message },
        { status: 500 }
      );
    }

    // Log for debugging
    console.log(`Found ${consultations?.length || 0} consultations for provider_id=${providerId}`);
    if (consultations && consultations.length > 0) {
      console.log(`Sample consultation IDs:`, consultations.slice(0, 3).map(c => ({ id: c.id, status: c.status, provider_id: c.provider_id })));
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
