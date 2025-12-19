import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).optional(),
  full_name: z.string().min(1),
  phone_number: z.string().optional(),
  role: z.enum(["Patient", "Doctor", "Admin"]).default("Patient"),
  location: z.string().optional(),
  age: z.number().int().positive().optional(),
  preferred_language: z.string().optional(),
});

// GET - Fetch all users (Admin only)
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
      .from("users")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error counting users:", countError);
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, full_name, role, phone_number, location, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (usersError) {
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new user (Admin only)
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
    const validatedData = createUserSchema.parse(body);

    const supabase = await createClient();
    let authUserId: string | null = null;

    // If password is provided, create auth user
    if (validatedData.password) {
      try {
        const adminClient = getAdminClient();

        const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
          email: validatedData.email,
          password: validatedData.password,
          email_confirm: true,
          user_metadata: {
            full_name: validatedData.full_name,
            role: validatedData.role,
          },
        });

        if (authError) {
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
    } else {
      // If no password provided, password is required for new users
      return NextResponse.json(
        { error: "Password is required for new users" },
        { status: 400 }
      );
    }

    // Create or update user profile
    const { email, password, ...userProfileData } = validatedData;
    const profileData = authUserId
      ? { id: authUserId, email, ...userProfileData }
      : { email, ...userProfileData };

    const { data: createdUser, error: profileError } = await supabase
      .from("users")
      .upsert(profileData, { onConflict: "id" })
      .select()
      .single();

    if (profileError) {
      // Clean up auth user if profile creation fails
      if (authUserId && validatedData.password) {
        try {
          const adminClient = getAdminClient();
          await adminClient.auth.admin.deleteUser(authUserId);
        } catch (cleanupErr) {
          console.error("Error during cleanup:", cleanupErr);
        }
      }

      return NextResponse.json(
        { error: profileError.message || "Failed to create user profile" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        user: createdUser,
        message: validatedData.password
          ? "User created successfully with login credentials"
          : "User profile created successfully",
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
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

