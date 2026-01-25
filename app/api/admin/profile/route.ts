import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateProfileSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone_number: z.string().optional(),
  location: z.string().optional(),
  age: z.number().int().positive().optional(),
  preferred_language: z.string().optional(),
  notification_preferences: z.enum(['sms', 'email', 'both']).optional(),
});

// GET - Get admin's own profile
export async function GET() {
  const { user, profile, error } = await authGuard({ requiredRole: "Admin" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ user: profile });
}

// PATCH - Update admin's own profile
export async function PATCH(request: Request) {
  const { user, profile, error } = await authGuard({ requiredRole: "Admin" });

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    const supabase = await createClient();

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update profile" },
        { status: 400 }
      );
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

