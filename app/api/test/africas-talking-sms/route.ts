/**
 * Test Endpoint for Africa's Talking SMS
 * 
 * This endpoint allows you to test SMS sending via Africa's Talking
 * 
 * Usage:
 *   POST /api/test/africas-talking-sms
 *   Body: {
 *     "phoneNumber": "+232XXXXXXXX",
 *     "message": "Test message"
 *   }
 * 
 * Example:
 *   curl -X POST http://localhost:3000/api/test/africas-talking-sms \
 *     -H "Content-Type: application/json" \
 *     -d '{"phoneNumber": "+23272860043", "message": "Test SMS from HealthConnect"}'
 */

import { NextResponse } from "next/server";
import { africasTalkingSMSService } from "@/lib/notifications/africas-talking";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, message } = body;

    // Validate input
    if (!phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "phoneNumber is required",
          example: {
            phoneNumber: "+23272860043",
            message: "Test SMS from HealthConnect",
          },
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: "message is required",
          example: {
            phoneNumber: "+23272860043",
            message: "Test SMS from HealthConnect",
          },
        },
        { status: 400 }
      );
    }

    // Check if service is enabled
    if (!africasTalkingSMSService.isEnabled()) {
      return NextResponse.json(
        {
          success: false,
          error: "Africa's Talking SMS service is not configured",
          details: {
            missing: {
              username: !process.env.AFRICAS_TALKING_USERNAME,
              apiKey: !process.env.AFRICAS_TALKING_API_KEY,
            },
            setup: {
              step1: "Get credentials from https://account.africastalking.com/apps",
              step2: "Add AFRICAS_TALKING_USERNAME to .env.local",
              step3: "Add AFRICAS_TALKING_API_KEY to .env.local",
              step4: "Set AFRICAS_TALKING_MODE=sandbox for testing",
              step5: "Restart your development server",
            },
          },
        },
        { status: 500 }
      );
    }

    // Send SMS
    console.log("Sending test SMS via Africa's Talking:", {
      phoneNumber,
      messageLength: message.length,
    });

    const result = await africasTalkingSMSService.sendSMS({
      to: phoneNumber,
      message,
    });

    // Return result
    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: "SMS sent successfully",
          data: {
            messageId: result.messageId,
            phoneNumber,
            provider: "africas-talking",
            details: result.details,
          },
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to send SMS",
          details: result.details,
          phoneNumber,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in test SMS endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check service status
 */
export async function GET() {
  const isEnabled = africasTalkingSMSService.isEnabled();
  const hasUsername = !!process.env.AFRICAS_TALKING_USERNAME;
  const hasApiKey = !!process.env.AFRICAS_TALKING_API_KEY;
  const mode = process.env.AFRICAS_TALKING_MODE || "production";
  const senderId = process.env.SMS_SENDER_ID || "HealthConnect";

  return NextResponse.json({
    service: "Africa's Talking SMS",
    enabled: isEnabled,
    configuration: {
      hasUsername,
      hasApiKey,
      mode,
      senderId,
    },
    usage: {
      method: "POST",
      endpoint: "/api/test/africas-talking-sms",
      body: {
        phoneNumber: "+232XXXXXXXX",
        message: "Your test message",
      },
      example: {
        curl: `curl -X POST http://localhost:3000/api/test/africas-talking-sms \\
  -H "Content-Type: application/json" \\
  -d '{"phoneNumber": "+23272860043", "message": "Test SMS"}'`,
      },
    },
    setup: {
      step1: "Sign up at https://account.africastalking.com",
      step2: "Create an app and get your username and API key",
      step3: "Add credentials to .env.local",
      step4: "For testing, set AFRICAS_TALKING_MODE=sandbox",
      step5: "For production, set AFRICAS_TALKING_MODE=production",
    },
  });
}
