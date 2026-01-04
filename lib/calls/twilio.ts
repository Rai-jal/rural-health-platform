/**
 * Twilio Video and Voice Call Service
 * Handles video and voice call functionality using Twilio
 */

interface AccessTokenOptions {
  identity: string;
  roomName?: string; // For video calls
  consultationId: string;
}

interface CallOptions {
  to: string;
  from: string;
  consultationId: string;
  patientName?: string;
  providerName?: string;
}

export class TwilioCallService {
  private accountSid: string | undefined;
  private apiKey: string | undefined;
  private apiSecret: string | undefined;
  private phoneNumber: string | undefined;
  private enabled: boolean;

  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.apiKey = process.env.TWILIO_API_KEY;
    this.apiSecret = process.env.TWILIO_API_SECRET;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.enabled = !!(
      this.accountSid &&
      this.apiKey &&
      this.apiSecret &&
      this.phoneNumber
    );
  }

  /**
   * Generate Twilio Access Token for video calls
   */
  async generateVideoToken(
    options: AccessTokenOptions
  ): Promise<{ token: string; roomName: string } | null> {
    if (!this.enabled) {
      console.warn("Twilio not configured. Cannot generate video token.");
      return null;
    }

    try {
      // Generate room name if not provided
      const roomName = options.roomName || `consultation-${options.consultationId}`;

      // In production, use Twilio SDK to generate token
      // For now, we'll create an API endpoint that generates the token server-side
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/calls/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identity: options.identity,
            roomName,
            consultationId: options.consultationId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate token");
      }

      const data = await response.json();
      return {
        token: data.token,
        roomName: data.roomName,
      };
    } catch (error) {
      console.error("Error generating video token:", error);
      return null;
    }
  }

  /**
   * Initiate a voice call
   */
  async initiateVoiceCall(options: CallOptions): Promise<{
    success: boolean;
    callSid?: string;
    error?: string;
  }> {
    if (!this.enabled) {
      console.warn("Twilio not configured. Cannot initiate call.");
      return {
        success: false,
        error: "Twilio not configured",
      };
    }

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Calls.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${this.accountSid}:${process.env.TWILIO_AUTH_TOKEN}`
            ).toString("base64")}`,
          },
          body: new URLSearchParams({
            From: options.from || this.phoneNumber!,
            To: options.to,
            Url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/calls/voice-handler?consultationId=${options.consultationId}`,
            Method: "POST",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Twilio call error:", data);
        return {
          success: false,
          error: data.message || "Failed to initiate call",
        };
      }

      return {
        success: true,
        callSid: data.sid,
      };
    } catch (error) {
      console.error("Error initiating voice call:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

export const twilioCallService = new TwilioCallService();

