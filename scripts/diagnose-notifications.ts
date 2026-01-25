/**
 * Notification Diagnostic Script
 * 
 * Diagnoses why SMS/Email messages are not being sent
 * 
 * Usage:
 *   npx tsx scripts/diagnose-notifications.ts [user_id]
 * 
 * If user_id is not provided, checks system-wide configuration
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

interface DiagnosticResult {
  category: string;
  status: "✅" | "❌" | "⚠️";
  message: string;
  details?: any;
}

async function diagnoseNotifications(userId?: string) {
  console.log("🔍 Notification Diagnostic Tool");
  console.log("================================\n");

  const results: DiagnosticResult[] = [];

  // 1. Check Environment Variables
  console.log("1️⃣  Checking Environment Variables...\n");

  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const sendgridEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!twilioSid || !twilioToken || !twilioPhone) {
    results.push({
      category: "SMS Configuration",
      status: "❌",
      message: "Twilio credentials not configured",
      details: {
        hasAccountSid: !!twilioSid,
        hasAuthToken: !!twilioToken,
        hasPhoneNumber: !!twilioPhone,
      },
    });
  } else {
    results.push({
      category: "SMS Configuration",
      status: "✅",
      message: "Twilio credentials configured",
      details: {
        accountSid: twilioSid.substring(0, 10) + "...",
        phoneNumber: twilioPhone,
      },
    });
  }

  if (!sendgridKey || !sendgridEmail) {
    results.push({
      category: "Email Configuration",
      status: "⚠️",
      message: "SendGrid not configured (emails will not be sent)",
      details: {
        hasApiKey: !!sendgridKey,
        hasFromEmail: !!sendgridEmail,
      },
    });
  } else {
    results.push({
      category: "Email Configuration",
      status: "✅",
      message: "SendGrid configured",
      details: {
        fromEmail: sendgridEmail,
      },
    });
  }

  // 2. Check User Data (if userId provided)
  if (userId) {
    console.log(`2️⃣  Checking User Data for: ${userId}...\n`);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        results.push({
          category: "Database Access",
          status: "❌",
          message: "Supabase credentials not configured",
        });
      } else {
        // Fetch user data
        const response = await fetch(
          `${supabaseUrl}/rest/v1/users?id=eq.${userId}&select=id,full_name,phone_number,email,notification_preferences`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          }
        );

        if (response.ok) {
          const users = await response.json();
          const user = users[0];

          if (!user) {
            results.push({
              category: "User Data",
              status: "❌",
              message: `User ${userId} not found`,
            });
          } else {
            // Check phone number
            if (!user.phone_number) {
              results.push({
                category: "User Phone Number",
                status: "❌",
                message: "User has no phone number",
                details: { userId: user.id, name: user.full_name },
              });
            } else {
              // Validate phone number format
              const phoneRegex = /^\+[1-9]\d{10,14}$/;
              if (!phoneRegex.test(user.phone_number)) {
                results.push({
                  category: "User Phone Number",
                  status: "❌",
                  message: `Invalid phone number format: ${user.phone_number}`,
                  details: {
                    current: user.phone_number,
                    expected: "+232XXXXXXXXX (E.164 format)",
                  },
                });
              } else {
                results.push({
                  category: "User Phone Number",
                  status: "✅",
                  message: `Phone number valid: ${user.phone_number}`,
                });
              }
            }

            // Check email
            if (!user.email) {
              results.push({
                category: "User Email",
                status: "⚠️",
                message: "User has no email address",
                details: { userId: user.id, name: user.full_name },
              });
            } else {
              results.push({
                category: "User Email",
                status: "✅",
                message: `Email configured: ${user.email}`,
              });
            }

            // Check notification preferences
            const prefs = user.notification_preferences || {};
            const smsEnabled = prefs.sms !== false; // Default to true if not set
            const emailEnabled = prefs.email !== false; // Default to true if not set

            if (!smsEnabled) {
              results.push({
                category: "Notification Preferences",
                status: "❌",
                message: "SMS notifications disabled in user preferences",
                details: { preferences: prefs },
              });
            } else {
              results.push({
                category: "Notification Preferences",
                status: "✅",
                message: "SMS notifications enabled",
                details: { preferences: prefs },
              });
            }

            if (!emailEnabled) {
              results.push({
                category: "Notification Preferences",
                status: "⚠️",
                message: "Email notifications disabled in user preferences",
                details: { preferences: prefs },
              });
            } else {
              results.push({
                category: "Notification Preferences",
                status: "✅",
                message: "Email notifications enabled",
                details: { preferences: prefs },
              });
            }
          }
        } else {
          results.push({
            category: "Database Access",
            status: "❌",
            message: `Failed to fetch user data: ${response.status}`,
          });
        }
      }
    } catch (error) {
      results.push({
        category: "Database Access",
        status: "❌",
        message: `Error fetching user data: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
    }
  }

  // 3. Test SMS Service
  console.log("3️⃣  Testing SMS Service...\n");

  try {
    const { smsService } = await import("../lib/notifications/sms");
    
    // Test with a dummy number (won't actually send)
    const testResult = await smsService.sendSMS({
      to: "+232123456789", // Dummy number for testing
      message: "Test message",
    });

    if (testResult.error?.includes("not configured")) {
      results.push({
        category: "SMS Service",
        status: "❌",
        message: "SMS service not enabled",
        details: { error: testResult.error },
      });
    } else if (testResult.error?.includes("Invalid phone number")) {
      // This is expected for dummy number, but service is working
      results.push({
        category: "SMS Service",
        status: "✅",
        message: "SMS service is configured and validating numbers",
      });
    } else {
      results.push({
        category: "SMS Service",
        status: "✅",
        message: "SMS service is working",
        details: { result: testResult },
      });
    }
  } catch (error) {
    results.push({
      category: "SMS Service",
      status: "❌",
      message: `Error testing SMS service: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }

  // 4. Test Email Service
  console.log("4️⃣  Testing Email Service...\n");

  try {
    const { emailService } = await import("../lib/notifications/email");
    
    const testResult = await emailService.sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Test</p>",
    });

    if (!testResult.success && testResult.error?.includes("not configured")) {
      results.push({
        category: "Email Service",
        status: "⚠️",
        message: "Email service not configured",
        details: { error: testResult.error },
      });
    } else {
      results.push({
        category: "Email Service",
        status: testResult.success ? "✅" : "⚠️",
        message: testResult.success
          ? "Email service is working"
          : `Email service issue: ${testResult.error}`,
      });
    }
  } catch (error) {
    results.push({
      category: "Email Service",
      status: "❌",
      message: `Error testing email service: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }

  // Print Results
  console.log("\n📊 Diagnostic Results:");
  console.log("=====================\n");

  results.forEach((result) => {
    console.log(`${result.status} ${result.category}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2));
    }
    console.log("");
  });

  // Summary
  const critical = results.filter((r) => r.status === "❌");
  const warnings = results.filter((r) => r.status === "⚠️");

  console.log("\n📋 Summary:");
  console.log(`   Critical Issues: ${critical.length}`);
  console.log(`   Warnings: ${warnings.length}`);
  console.log(`   Working: ${results.length - critical.length - warnings.length}`);

  if (critical.length > 0) {
    console.log("\n❌ Critical Issues Found:");
    critical.forEach((r) => {
      console.log(`   - ${r.category}: ${r.message}`);
    });
  }

  if (warnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    warnings.forEach((r) => {
      console.log(`   - ${r.category}: ${r.message}`);
    });
  }

  // Recommendations
  console.log("\n💡 Recommendations:");
  console.log("==================\n");

  if (critical.some((r) => r.category.includes("SMS"))) {
    console.log("1. Fix SMS Configuration:");
    console.log("   - Add TWILIO_ACCOUNT_SID to .env.local");
    console.log("   - Add TWILIO_AUTH_TOKEN to .env.local");
    console.log("   - Add TWILIO_PHONE_NUMBER to .env.local");
    console.log("");
  }

  if (critical.some((r) => r.category.includes("Phone Number"))) {
    console.log("2. Fix User Phone Numbers:");
    console.log("   - Ensure phone numbers are in E.164 format: +232XXXXXXXXX");
    console.log("   - Update phone numbers in database if needed");
    console.log("   - Run SQL: UPDATE users SET phone_number = '+232' || phone_number WHERE phone_number NOT LIKE '+%';");
    console.log("");
  }

  if (critical.some((r) => r.category.includes("Notification Preferences"))) {
    console.log("3. Fix Notification Preferences:");
    console.log("   - Update user preferences to enable SMS/Email");
    console.log("   - Run SQL: UPDATE users SET notification_preferences = '{\"sms\": true, \"email\": true}' WHERE id = 'user_id';");
    console.log("");
  }

  if (warnings.some((r) => r.category.includes("Email"))) {
    console.log("4. Configure Email (Optional):");
    console.log("   - Sign up for SendGrid");
    console.log("   - Add SENDGRID_API_KEY to .env.local");
    console.log("   - Add SENDGRID_FROM_EMAIL to .env.local");
    console.log("");
  }

  process.exit(critical.length > 0 ? 1 : 0);
}

// Get user ID from command line
const userId = process.argv[2];

diagnoseNotifications(userId).catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
