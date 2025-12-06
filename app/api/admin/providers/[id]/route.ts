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
  rating: z.number().min(0).max(5).optional(),
});

// GET - Get single provider
export async function GET(
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

    const { data: provider, error: providerError } = await supabase
      .from("healthcare_providers")
      .select("*")
      .eq("id", params.id)
      .single();

    if (providerError || !provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ provider });
  } catch (error) {
    console.error("Error fetching provider:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update provider
export async function PATCH(
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
    const body = await request.json();
    const validatedData = updateProviderSchema.parse(body);

    const supabase = await createClient();

    const { data: provider, error: providerError } = await supabase
      .from("healthcare_providers")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (providerError) {
      return NextResponse.json(
        { error: providerError.message || "Failed to update provider" },
        { status: 400 }
      );
    }

    return NextResponse.json({ provider });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating provider:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete provider
export async function DELETE(
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

    // Check if provider has active consultations
    const { data: consultations } = await supabase
      .from("consultations")
      .select("id")
      .eq("provider_id", params.id)
      .in("status", ["scheduled", "in_progress"])
      .limit(1);

    if (consultations && consultations.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete provider with active consultations" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("healthcare_providers")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete provider" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting provider:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

