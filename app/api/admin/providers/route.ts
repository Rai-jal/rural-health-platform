import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createProviderSchema = z.object({
  full_name: z.string().min(1),
  specialty: z.string().min(1),
  languages: z.array(z.string()).default(["English"]),
  experience_years: z.number().int().min(0).default(0),
  location: z.string().optional(),
  is_available: z.boolean().default(true),
});

// GET - Fetch all healthcare providers
export async function GET() {
  const { user, profile, error } = await authGuard({ requiredRole: "Admin" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    const { data: providers, error: providersError } = await supabase
      .from("healthcare_providers")
      .select("*")
      .order("created_at", { ascending: false });

    if (providersError) {
      return NextResponse.json(
        { error: "Failed to fetch providers" },
        { status: 500 }
      );
    }

    return NextResponse.json({ providers: providers || [] });
  } catch (error) {
    console.error("Error fetching providers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new healthcare provider
export async function POST(request: Request) {
  const { user, profile, error } = await authGuard({ requiredRole: "Admin" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = createProviderSchema.parse(body);

    const supabase = await createClient();

    const { data: provider, error: providerError } = await supabase
      .from("healthcare_providers")
      .insert(validatedData)
      .select()
      .single();

    if (providerError) {
      return NextResponse.json(
        { error: providerError.message || "Failed to create provider" },
        { status: 400 }
      );
    }

    return NextResponse.json({ provider }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating provider:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

