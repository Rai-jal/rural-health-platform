import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateProviderSchema = z.object({
  full_name: z.string().min(1).optional(),
  specialty: z.string().min(1).optional(),
  languages: z.array(z.string()).optional(),
  experience_years: z.number().int().min(0).optional(),
  location: z.string().optional(),
  is_available: z.boolean().optional(),
});

// GET - Get doctor's provider profile
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

    const { data: provider, error: providerError } = await supabase
      .from("healthcare_providers")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (providerError) {
      // Provider profile doesn't exist, return null
      return NextResponse.json({ provider: null });
    }

    return NextResponse.json({ provider });
  } catch (error) {
    console.error("Error fetching provider profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update doctor's provider profile
export async function PATCH(request: Request) {
  const { user, profile, error } = await authGuard({ requiredRole: "Doctor" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = updateProviderSchema.parse(body);

    const supabase = await createClient();

    // Check if provider profile exists
    const { data: existingProvider } = await supabase
      .from("healthcare_providers")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let provider;

    if (existingProvider) {
      // Update existing profile
      const { data: updatedProvider, error: updateError } = await supabase
        .from("healthcare_providers")
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message || "Failed to update profile" },
          { status: 400 }
        );
      }

      provider = updatedProvider;
    } else {
      // Create new provider profile
      const { data: newProvider, error: createError } = await supabase
        .from("healthcare_providers")
        .insert({
          ...validatedData,
          user_id: user.id,
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: createError.message || "Failed to create profile" },
          { status: 400 }
        );
      }

      provider = newProvider;
    }

    return NextResponse.json({ provider });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating provider profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

