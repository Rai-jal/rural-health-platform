/**
 * SMS Verification Test Script
 * 
 * Tests SMS delivery via Twilio to verify phone numbers and account configuration.
 * 
 * Usage:
 *   npx tsx scripts/test-sms-verification.ts
 * 
 * Environment Variables Required:
 * - TWILIO_ACCOUNT_SID: Twilio account SID
 * - TWILIO_AUTH_TOKEN: Twilio auth token
 * - TWILIO_PHONE_NUMBER: Twilio phone number (sender)
 * 
 * Test Phone Numbers:
 * - Add phone numbers to test in the TEST_PHONE_NUMBERS array below
 * - Numbers must be in E.164 format: +232XXXXXXXXX
 * 
 * Trial Account Restrictions:
 * - Trial accounts can only send to verified numbers
 * - Verify numbers in Twilio Console → Phone Numbers → Verified Caller IDs
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

interface SMSResult {
  phoneNumber: string;
  success: boolean;
  messageId?: string;
  error?: string;
  twilioErrorCode?: string;
  twilioErrorMessage?: string;
}

/**
 * Validate phone number format (E.164)
 */
function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  // E.164 format: +[country code][number] (10-15 digits total)
  const phoneRegex = /^\+[1-9]\d{10,14}$/;
  
  if (!phone) {
    return { valid: false, error: "Phone number is required" };
  }
  
  if (!phoneRegex.test(phone)) {
    return {
      valid: false,
      error: `Invalid format. Expected E.164 format (+232XXXXXXXXX), got: ${phone}`,
    };
  }
  
  return { valid: true };
}

/**
 * Send SMS via Twilio API
 */
async function sendSMS(
  to: string,
  message: string
): Promise<SMSResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return {
      phoneNumber: to,
      success: false,
      error: "Twilio credentials not configured. Check .env.local",
    };
  }

  // Validate phone number
  const validation = validatePhoneNumber(to);
  if (!validation.valid) {
    return {
      phoneNumber: to,
      success: false,
      error: validation.error,
    };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: to,
          Body: message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Extract Twilio error details
      const errorCode = data.code;
      const errorMessage = data.message;

      // Map common Twilio error codes
      let userFriendlyError = errorMessage;
      if (errorCode === 21211) {
        userFriendlyError = "Invalid phone number format";
      } else if (errorCode === 21408) {
        userFriendlyError = "Phone number not verified (trial account restriction)";
      } else if (errorCode === 21608) {
        userFriendlyError = "Unsubscribed recipient";
      } else if (errorCode === 21614) {
        userFriendlyError = "Invalid 'To' phone number";
      }

      return {
        phoneNumber: to,
        success: false,
        error: userFriendlyError,
        twilioErrorCode: errorCode?.toString(),
        twilioErrorMessage: errorMessage,
      };
    }

    return {
      phoneNumber: to,
      success: true,
      messageId: data.sid,
    };
  } catch (error) {
    return {
      phoneNumber: to,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Main test function
 */
async function testSMSVerification() {
  console.log("🧪 SMS Verification Test Script");
  console.log("================================\n");

  // Check Twilio configuration
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  console.log("📋 Configuration Check:");
  console.log(`  TWILIO_ACCOUNT_SID: ${accountSid ? "✅ Set" : "❌ Missing"}`);
  console.log(`  TWILIO_AUTH_TOKEN: ${authToken ? "✅ Set" : "❌ Missing"}`);
  console.log(`  TWILIO_PHONE_NUMBER: ${fromNumber || "❌ Missing"}`);
  console.log("");

  if (!accountSid || !authToken || !fromNumber) {
    console.error("❌ Twilio credentials not configured!");
    console.error("   Please add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to .env.local");
    process.exit(1);
  }

  // Test phone numbers (add your test numbers here)
  // Format: +232XXXXXXXXX (Sierra Leone)
  const TEST_PHONE_NUMBERS = [
    // Add test phone numbers here
    // Example: "+232123456789",
  ];

  if (TEST_PHONE_NUMBERS.length === 0) {
    console.log("⚠️  No test phone numbers configured.");
    console.log("   Add phone numbers to TEST_PHONE_NUMBERS array in this script.");
    console.log("   Format: +232XXXXXXXXX (E.164 format with country code)");
    process.exit(0);
  }

  console.log(`📱 Testing ${TEST_PHONE_NUMBERS.length} phone number(s)\n`);

  const results: SMSResult[] = [];
  const testMessage = `HealthConnect SMS Test\n\nThis is a test message to verify SMS delivery.\n\nTime: ${new Date().toLocaleString()}\n\nIf you received this, SMS is working correctly!`;

  // Send test SMS to each number
  for (const phoneNumber of TEST_PHONE_NUMBERS) {
    console.log(`📤 Sending test SMS to ${phoneNumber}...`);
    
    const result = await sendSMS(phoneNumber, testMessage);
    results.push(result);

    if (result.success) {
      console.log(`  ✅ Success! Message ID: ${result.messageId}`);
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
      if (result.twilioErrorCode) {
        console.log(`     Twilio Error Code: ${result.twilioErrorCode}`);
      }
      if (result.twilioErrorMessage) {
        console.log(`     Twilio Message: ${result.twilioErrorMessage}`);
      }
    }
    console.log("");
  }

  // Summary
  console.log("📊 Test Results Summary:");
  console.log("========================");
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`  Total: ${results.length}`);
  console.log(`  ✅ Successful: ${successful}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log("");

  // Detailed results
  if (successful > 0) {
    console.log("✅ Successful Deliveries:");
    results
      .filter((r) => r.success)
      .forEach((r) => {
        console.log(`  - ${r.phoneNumber} (Message ID: ${r.messageId})`);
      });
    console.log("");
  }

  if (failed > 0) {
    console.log("❌ Failed Deliveries:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  - ${r.phoneNumber}`);
        console.log(`    Error: ${r.error}`);
        if (r.twilioErrorCode === "21408") {
          console.log(`    ⚠️  TRIAL ACCOUNT: This number needs to be verified in Twilio Console`);
          console.log(`       Go to: Twilio Console → Phone Numbers → Verified Caller IDs`);
        }
      });
    console.log("");
  }

  // Recommendations
  if (failed > 0) {
    console.log("💡 Recommendations:");
    console.log("===================");
    
    const unverifiedErrors = results.filter(
      (r) => !r.success && r.twilioErrorCode === "21408"
    );
    
    if (unverifiedErrors.length > 0) {
      console.log("1. Verify phone numbers in Twilio Console:");
      console.log("   - Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified");
      console.log("   - Add each phone number that failed with error 21408");
      console.log("");
    }

    const invalidFormatErrors = results.filter(
      (r) => !r.success && r.error?.includes("Invalid format")
    );
    
    if (invalidFormatErrors.length > 0) {
      console.log("2. Fix phone number formats:");
      console.log("   - Use E.164 format: +[country code][number]");
      console.log("   - Example: +232123456789 (Sierra Leone)");
      console.log("");
    }

    console.log("3. Check Twilio Console → Monitor → Logs → Messaging");
    console.log("   - View detailed delivery logs");
    console.log("   - Check for delivery status and errors");
    console.log("");
  }

  // Exit with appropriate code
  if (failed === 0) {
    console.log("✅ All SMS tests passed!");
    process.exit(0);
  } else {
    console.log("⚠️  Some SMS tests failed. Check recommendations above.");
    process.exit(1);
  }
}

// Run the test
testSMSVerification().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
