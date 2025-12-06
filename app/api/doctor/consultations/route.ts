import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";

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

    // Get doctor's provider ID
    const { data: provider, error: providerError } = await supabase
      .from("healthcare_providers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (providerError || !provider) {
      // Doctor doesn't have a provider profile yet - return empty list
      return NextResponse.json({ consultations: [] });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
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
      .eq("provider_id", provider.id)
      .order("scheduled_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: consultations, error: consultationsError } = await query;

    if (consultationsError) {
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

