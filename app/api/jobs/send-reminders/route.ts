/**
 * Consultation Reminders Automation Job
 * 
 * Endpoint: GET /api/jobs/send-reminders
 * 
 * Fetches consultations scheduled in the next hour and sends SMS/Email reminders
 * to both patients and providers.
 * 
 * Environment Variables Required:
 * - CRON_SECRET: Secret token for cron job authentication (optional but recommended)
 * - TWILIO_ACCOUNT_SID: Twilio account SID for SMS
 * - TWILIO_AUTH_TOKEN: Twilio auth token
 * - SENDGRID_API_KEY: SendGrid API key for emails (optional)
 * 
 * Cron Setup:
 * - Vercel Cron: Add to vercel.json
 * - External Cron: Call this endpoint every hour
 * - Server Cron: Use node-cron to call this endpoint
 * 
 * Security:
 * - Optional CRON_SECRET authentication
 * - Uses admin client to bypass RLS
 * - Respects user notification preferences
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAdminClient } from "@/lib/supabase/admin";
import { notifyConsultationReminder } from "@/lib/notifications";

/**
 * GET - Send consultation reminders
 * 
 * Finds consultations scheduled in the next hour and sends reminders
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    // Optional: Verify cron secret for security
    const headersList = headers();
    const authHeader = headersList.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.error("❌ Unauthorized cron job request");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      console.log("✅ Cron secret verified");
    } else {
      console.warn("⚠️  CRON_SECRET not set - endpoint is publicly accessible");
    }

    const adminClient = getAdminClient();

    // Calculate time range: now to 1 hour from now
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    console.log("🔍 Searching for consultations scheduled between:", {
      from: now.toISOString(),
      to: oneHourLater.toISOString(),
    });

    // Find consultations scheduled in the next hour
    const { data: consultations, error: consultationsError } = await adminClient
      .from("consultations")
      .select(
        `
        id,
        scheduled_at,
        user_id,
        provider_id,
        status,
        consultation_type,
        healthcare_providers (
          user_id,
          full_name
        ),
        users (
          id,
          full_name,
          phone_number,
          email,
          notification_preferences
        )
      `
      )
      .eq("status", "scheduled")
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", oneHourLater.toISOString())
      .not("scheduled_at", "is", null);

    if (consultationsError) {
      console.error("❌ Database error fetching consultations:", consultationsError);
      return NextResponse.json(
        { error: "Failed to fetch consultations" },
        { status: 500 }
      );
    }

    if (!consultations || consultations.length === 0) {
      console.log("ℹ️  No consultations scheduled in the next hour");
      return NextResponse.json({
        message: "No reminders to send",
        count: 0,
        processingTime: `${Date.now() - startTime}ms`,
      });
    }

    console.log(`📋 Found ${consultations.length} consultation(s) to remind`);

    const results = {
      total: consultations.length,
      patientReminders: { sent: 0, failed: 0, skipped: 0 },
      providerReminders: { sent: 0, failed: 0, skipped: 0 },
      errors: [] as string[],
    };

    // Send reminders for each consultation
    for (const consultation of consultations) {
      try {
        // Send reminder to patient
        if (consultation.user_id && consultation.users) {
          try {
            await notifyConsultationReminder(
              consultation.id,
              consultation.user_id,
              "patient"
            );
            results.patientReminders.sent++;
            console.log(`✅ Patient reminder sent for consultation ${consultation.id}`);
          } catch (patientError) {
            results.patientReminders.failed++;
            const errorMsg = `Failed to send patient reminder for ${consultation.id}: ${patientError instanceof Error ? patientError.message : "Unknown error"}`;
            console.error(`❌ ${errorMsg}`);
            results.errors.push(errorMsg);
          }
        } else {
          results.patientReminders.skipped++;
          console.warn(`⚠️  Skipping patient reminder - no user_id for consultation ${consultation.id}`);
        }

        // Send reminder to provider
        if (consultation.provider_id && consultation.healthcare_providers?.user_id) {
          try {
            await notifyConsultationReminder(
              consultation.id,
              consultation.healthcare_providers.user_id,
              "provider"
            );
            results.providerReminders.sent++;
            console.log(`✅ Provider reminder sent for consultation ${consultation.id}`);
          } catch (providerError) {
            results.providerReminders.failed++;
            const errorMsg = `Failed to send provider reminder for ${consultation.id}: ${providerError instanceof Error ? providerError.message : "Unknown error"}`;
            console.error(`❌ ${errorMsg}`);
            results.errors.push(errorMsg);
          }
        } else {
          results.providerReminders.skipped++;
          console.warn(`⚠️  Skipping provider reminder - no provider_id for consultation ${consultation.id}`);
        }
      } catch (error) {
        const errorMsg = `Error processing consultation ${consultation.id}: ${error instanceof Error ? error.message : "Unknown error"}`;
        console.error(`❌ ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    const processingTime = Date.now() - startTime;
    const totalSent = results.patientReminders.sent + results.providerReminders.sent;
    const totalFailed = results.patientReminders.failed + results.providerReminders.failed;

    console.log(`✅ Reminder job completed in ${processingTime}ms:`, {
      total: results.total,
      sent: totalSent,
      failed: totalFailed,
    });

    return NextResponse.json({
      message: "Reminder job completed",
      results,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("❌ Fatal error in reminder job:", error);
    
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
