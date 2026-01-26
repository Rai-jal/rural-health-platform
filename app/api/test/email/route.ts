/**
 * Quick Email Test Endpoint
 * 
 * Tests if SendGrid email is working
 * 
 * Usage:
 *   GET /api/test/email?to=your-email@example.com
 */

import { NextResponse } from "next/server";
import { emailService } from "@/lib/notifications/email";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get("to") || "prinaldacjsmith@gmail.com"; // Default to your email

    if (!to) {
      return NextResponse.json(
        {
          error: "Missing 'to' parameter",
          usage: "/api/test/email?to=your-email@example.com",
        },
        { status: 400 }
      );
    }

    // Test email
    const result = await emailService.sendEmail({
      to,
      subject: "🧪 HealthConnect Email Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">✅ Email Test Successful!</h2>
          <p>If you're reading this, SendGrid email is working correctly!</p>
          <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>From:</strong> Health-Connect</p>
            <p><strong>To:</strong> ${to}</p>
          </div>
          <p>Your email notifications are now configured and working! 🎉</p>
        </div>
      `,
      text: `Email Test Successful!\n\nIf you're reading this, SendGrid email is working correctly!\n\nTest Time: ${new Date().toLocaleString()}\nFrom: Health-Connect\nTo: ${to}`,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully!",
        details: {
          to,
          messageId: result.messageId,
          timestamp: new Date().toISOString(),
        },
        nextSteps: [
          "Check your email inbox (and spam folder)",
          "Check SendGrid Dashboard → Activity",
          "Verify email was delivered",
        ],
      });
    } else {
      // Get more detailed error from SendGrid
      const errorDetails = result.error || "Unknown error";
      
      return NextResponse.json(
        {
          success: false,
          error: "Failed to send test email",
          details: errorDetails,
          sendGridError: result.error,
          troubleshooting: [
            "1. Check SendGrid API key is correct",
            "2. Verify sender email (prinaldacjsmith@gmail.com) is verified in SendGrid",
            "3. Check server logs for detailed SendGrid error message",
            "4. Make sure you restarted server after adding env variables",
            "5. Go to SendGrid Dashboard → Settings → Sender Authentication",
            "6. Verify 'prinaldacjsmith@gmail.com' shows as 'Verified'",
          ],
          checkSendGrid: "Go to: https://app.sendgrid.com/settings/sender_auth/senders",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
