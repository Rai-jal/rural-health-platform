/**
 * Test Notification Endpoint
 * 
 * Manually test sending notifications to diagnose issues
 * 
 * Usage:
 *   GET /api/test/notify?userId=USER_ID&consultationId=CONSULTATION_ID&amount=10000
 */

import { NextResponse } from "next/server";
import { notifyPaymentConfirmation } from "@/lib/notifications";
import { getAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const consultationId = searchParams.get("consultationId");
    const amount = parseInt(searchParams.get("amount") || "10000");

    if (!userId || !consultationId) {
      return NextResponse.json(
        {
          error: "Missing required parameters",
          required: ["userId", "consultationId"],
          optional: ["amount"],
          example: "/api/test/notify?userId=xxx&consultationId=yyy&amount=10000",
        },
        { status: 400 }
      );
    }

    // Get user data for diagnostics
    const adminClient = getAdminClient();
    const { data: user } = await adminClient
      .from("users")
      .select("id, full_name, phone_number, email, notification_preferences")
      .eq("id", userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: `User ${userId} not found` },
        { status: 404 }
      );
    }

    // Diagnostic info
    const diagnostics = {
      user: {
        id: user.id,
        name: user.full_name,
        phoneNumber: user.phone_number || "❌ Not set",
        email: user.email || "❌ Not set",
        notificationPreferences: user.notification_preferences || "null (defaults to SMS)",
      },
      phoneNumberValid: user.phone_number
        ? /^\+[1-9]\d{10,14}$/.test(user.phone_number)
        : false,
      canSendSMS: !!(
        user.phone_number &&
        /^\+[1-9]\d{10,14}$/.test(user.phone_number) &&
        (user.notification_preferences === "sms" ||
          user.notification_preferences === "both" ||
          !user.notification_preferences)
      ),
      canSendEmail: !!(
        user.email &&
        (user.notification_preferences === "email" ||
          user.notification_preferences === "both" ||
          !user.notification_preferences)
      ),
    };

    // Send notification
    try {
      await notifyPaymentConfirmation(consultationId, userId, amount);

      return NextResponse.json({
        success: true,
        message: "Notification sent",
        diagnostics,
        note: "Check server logs for detailed SMS/Email delivery status",
      });
    } catch (notifError) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send notification",
          details: notifError instanceof Error ? notifError.message : "Unknown error",
          diagnostics,
        },
        { status: 500 }
      );
    }
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
