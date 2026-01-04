import { NextResponse } from "next/server";
import { authGuard } from "@/lib/auth/api-guard";

/**
 * Generate Twilio Access Token for video calls
 * POST /api/calls/token
 */
export async function POST(request: Request) {
  const { user, profile, error } = await authGuard();

  if (error) {
    return error;
  }

  if (!user || !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { identity, roomName, consultationId } = body;

    if (!identity || !roomName || !consultationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;

    if (!accountSid || !apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Twilio not configured" },
        { status: 500 }
      );
    }

    // Generate Twilio Access Token
    // Note: Install twilio package: npm install twilio
    let AccessToken, VideoGrant;
    try {
      const twilio = require("twilio");
      AccessToken = twilio.jwt.AccessToken;
      VideoGrant = AccessToken.VideoGrant;
    } catch (err) {
      return NextResponse.json(
        {
          error:
            "Twilio SDK not installed. Run: npm install twilio",
        },
        { status: 500 }
      );
    }

    const token = new AccessToken(accountSid, apiKey, apiSecret);
    token.identity = identity;

    // Grant video access
    const videoGrant = new VideoGrant({
      room: roomName,
    });
    token.addGrant(videoGrant);

    return NextResponse.json({
      token: token.toJwt(),
      roomName,
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}

