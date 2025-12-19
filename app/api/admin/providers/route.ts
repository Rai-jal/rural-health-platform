import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { env } from "@/lib/env";

const createProviderSchema = z.object({
  full_name: z.string().min(1),
  specialty: z.string().min(1),
  languages: z.array(z.string()).default(["English"]),
  experience_years: z.number().int().min(0).default(0),
  location: z.string().optional(),
  is_available: z.boolean().default(true),
  // Login credentials (optional - for creating auth user)
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
});

// GET - Fetch all healthcare providers
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
    const { searchParams } = new URL(request.url || new URL("http://localhost"));
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from("healthcare_providers")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error counting providers:", countError);
    }

    const { data: providers, error: providersError } = await supabase
      .from("healthcare_providers")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (providersError) {
      return NextResponse.json(
        { error: "Failed to fetch providers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      providers: providers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
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
    let authUserId: string | null = null;

    // If email and password are provided, create auth user first
    if (validatedData.email && validatedData.password) {
      try {
        // Use admin client to create auth user
        const adminClient = getAdminClient();
        
        const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
          email: validatedData.email,
          password: validatedData.password,
          email_confirm: true, // Auto-confirm email for admin-created users
          user_metadata: {
            full_name: validatedData.full_name,
            role: "Doctor",
          },
        });

        if (authError) {
          // Handle specific Supabase auth errors
          if (authError.message.includes("already registered")) {
            return NextResponse.json(
              { error: "A user with this email already exists" },
              { status: 409 }
            );
          }
          throw authError;
        }

        if (!authUser.user) {
          throw new Error("Failed to create auth user");
        }

        authUserId = authUser.user.id;

        // Create user profile in users table with Doctor role
        const { error: userProfileError } = await supabase
          .from("users")
          .upsert({
            id: authUserId,
            email: validatedData.email,
            full_name: validatedData.full_name,
            role: "Doctor",
            location: validatedData.location,
          });

        if (userProfileError) {
          console.error("Error creating user profile:", userProfileError);
          // Clean up: delete auth user if profile creation fails
          await adminClient.auth.admin.deleteUser(authUserId);
          throw new Error("Failed to create user profile");
        }

        // Send welcome email (optional - using Supabase's built-in email)
        // The email confirmation is already sent by Supabase
        // You can customize this via Supabase Dashboard > Authentication > Email Templates
      } catch (authErr) {
        console.error("Error creating auth user:", authErr);
        if (authErr instanceof Error) {
          return NextResponse.json(
            { error: authErr.message || "Failed to create user account" },
            { status: 400 }
          );
        }
        throw authErr;
      }
    }

    // Create healthcare provider profile
    const { email, password, ...providerData } = validatedData;
    const providerInsert = authUserId
      ? { ...providerData, user_id: authUserId }
      : providerData;

    const { data: provider, error: providerError } = await supabase
      .from("healthcare_providers")
      .insert(providerInsert)
      .select()
      .single();

    if (providerError) {
      // If provider creation fails but auth user was created, clean up
      if (authUserId) {
        try {
          const adminClient = getAdminClient();
          await adminClient.auth.admin.deleteUser(authUserId);
          await supabase.from("users").delete().eq("id", authUserId);
        } catch (cleanupErr) {
          console.error("Error during cleanup:", cleanupErr);
        }
      }

      return NextResponse.json(
        { error: providerError.message || "Failed to create provider" },
        { status: 400 }
      );
    }

    // Success response
    return NextResponse.json(
      {
        provider,
        message: authUserId
          ? "Provider created successfully. Login credentials have been sent via email."
          : "Provider created successfully (no login credentials provided).",
      },
      { status: 201 }
    );
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

