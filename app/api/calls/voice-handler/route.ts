import { NextResponse } from "next/server";

/**
 * Twilio Voice Call Handler
 * This endpoint handles Twilio webhooks for voice calls
 * POST /api/calls/voice-handler
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const consultationId = new URL(request.url).searchParams.get("consultationId");

    // Twilio TwiML response
    // This tells Twilio what to do when the call is answered
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Welcome to HealthConnect consultation service. 
    Please wait while we connect you to your healthcare provider.
  </Say>
  <Dial>
    <!-- Replace with actual provider phone number -->
    <Number>+1234567890</Number>
  </Dial>
</Response>`;

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error("Error handling voice call:", error);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Say>An error occurred. Please try again later.</Say></Response>',
      {
        headers: {
          "Content-Type": "text/xml",
        },
      }
    );
  }
}

