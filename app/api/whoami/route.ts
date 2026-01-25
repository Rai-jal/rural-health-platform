/**
 * Who Am I Endpoint
 * 
 * Returns the currently logged-in user's ID and information
 * Useful for testing and diagnostics
 * 
 * Usage:
 *   GET /api/whoami
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          error: "Not logged in",
          message: "Please log in to your app first",
          hint: "Go to http://localhost:3000 and log in, then try again"
        },
        { status: 401 }
      );
    }
    
    // Get full user profile from database
    const adminClient = getAdminClient();
    const { data: profile } = await adminClient
      .from("users")
      .select("id, email, full_name, phone_number, notification_preferences, role")
      .eq("id", user.id)
      .single();
    
    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      profile: profile || null,
      message: "You are logged in as this user",
      diagnostic: {
        hasPhoneNumber: !!profile?.phone_number,
        phoneNumberFormat: profile?.phone_number 
          ? (/^\+[1-9]\d{10,14}$/.test(profile.phone_number) ? "✅ Valid E.164" : "❌ Invalid format")
          : "❌ Not set",
        hasEmail: !!profile?.email,
        notificationPreferences: profile?.notification_preferences || "null (defaults to SMS)",
        canReceiveSMS: !!(
          profile?.phone_number &&
          /^\+[1-9]\d{10,14}$/.test(profile.phone_number) &&
          (profile?.notification_preferences === "sms" ||
           profile?.notification_preferences === "both" ||
           !profile?.notification_preferences)
        ),
        canReceiveEmail: !!(
          profile?.email &&
          (profile?.notification_preferences === "email" ||
           profile?.notification_preferences === "both" ||
           !profile?.notification_preferences)
        ),
      },
      usage: {
        testNotification: `/api/test/notify?userId=${user.id}&consultationId=CONSULTATION_ID&amount=10000`,
        diagnostic: `npx tsx scripts/diagnose-notifications.ts ${user.id}`,
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
