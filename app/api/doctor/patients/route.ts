import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch doctor's patients
export async function GET() {
  const { user, profile, error } = await authGuard({ requiredRole: "Doctor" });

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
      return NextResponse.json({ patients: [] });
    }

    // Get unique patients who have consulted with this doctor
    const { data: consultations, error: consultationsError } = await supabase
      .from("consultations")
      .select("user_id")
      .eq("provider_id", provider.id)
      .neq("status", "cancelled");

    if (consultationsError) {
      return NextResponse.json(
        { error: "Failed to fetch patients" },
        { status: 500 }
      );
    }

    const uniqueUserIds = [
      ...new Set(consultations?.map((c) => c.user_id).filter(Boolean)),
    ];

    if (uniqueUserIds.length === 0) {
      return NextResponse.json({ patients: [] });
    }

    // Get patient details
    const { data: patients, error: patientsError } = await supabase
      .from("users")
      .select("*")
      .in("id", uniqueUserIds)
      .order("full_name", { ascending: true });

    if (patientsError) {
      return NextResponse.json(
        { error: "Failed to fetch patient details" },
        { status: 500 }
      );
    }

    // Get consultation count per patient
    const patientsWithStats = await Promise.all(
      (patients || []).map(async (patient) => {
        const { count } = await supabase
          .from("consultations")
          .select("id", { count: "exact", head: true })
          .eq("provider_id", provider.id)
          .eq("user_id", patient.id)
          .neq("status", "cancelled");

        return {
          ...patient,
          consultation_count: count || 0,
        };
      })
    );

    return NextResponse.json({ patients: patientsWithStats });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

