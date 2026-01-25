/**
 * SMS Notification Service
 * Handles sending SMS notifications via Twilio or other SMS providers
 */

interface SMSOptions {
  to: string;
  message: string;
  from?: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SMSService {
  private twilioAccountSid: string | undefined;
  private twilioAuthToken: string | undefined;
  private twilioPhoneNumber: string | undefined;
  private enabled: boolean;

  constructor() {
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.enabled = !!(
      this.twilioAccountSid &&
      this.twilioAuthToken &&
      this.twilioPhoneNumber
    );
  }

  /**
   * Validate phone number format
   * Must start with + and have country code (e.g., +232123456789)
   */
  private validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
    if (!phone) {
      return { valid: false, error: "Phone number is required" };
    }
    
    // Must start with + and have country code + number (10-15 digits total)
    const phoneRegex = /^\+[1-9]\d{10,14}$/;
    
    if (!phoneRegex.test(phone)) {
      return {
        valid: false,
        error: `Invalid phone number format. Expected: +232XXXXXXXXX (with country code), got: ${phone}`,
      };
    }
    
    return { valid: true };
  }

  /**
   * Send SMS via Twilio
   */
  async sendSMS(options: SMSOptions): Promise<SMSResponse> {
    if (!this.enabled) {
      console.warn("SMS service not configured. Skipping SMS send.");
      console.log("Would send SMS:", {
        to: options.to,
        message: options.message.substring(0, 50) + "...",
      });
      return {
        success: false,
        error: "SMS service not configured",
      };
    }

    // Validate phone number format
    const phoneValidation = this.validatePhoneNumber(options.to);
    if (!phoneValidation.valid) {
      console.error("Invalid phone number:", phoneValidation.error);
      return {
        success: false,
        error: phoneValidation.error,
      };
    }

    try {
      // Use Twilio SDK if available, otherwise use fetch
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${this.twilioAccountSid}:${this.twilioAuthToken}`
            ).toString("base64")}`,
          },
          body: new URLSearchParams({
            From: options.from || this.twilioPhoneNumber!,
            To: options.to,
            Body: options.message,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Twilio SMS API error:", {
          status: response.status,
          statusText: response.statusText,
          error: data,
          phoneNumber: options.to,
          message: options.message.substring(0, 50) + "...",
        });
        
        // Check for common Twilio errors
        let errorMessage = data.message || "Failed to send SMS";
        if (data.code === 21211) {
          errorMessage = "Invalid phone number format";
        } else if (data.code === 21408) {
          errorMessage = "Phone number not verified (trial account restriction)";
        } else if (data.code === 21608) {
          errorMessage = "Unsubscribed recipient";
        }
        
        return {
          success: false,
          error: errorMessage,
        };
      }

      console.log("SMS sent successfully via Twilio:", {
        messageId: data.sid,
        phoneNumber: options.to,
        status: data.status,
      });

      return {
        success: true,
        messageId: data.sid,
      };
    } catch (error) {
      console.error("Error sending SMS:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send consultation booking notification to provider
   */
  async sendProviderBookingNotification(
    providerPhone: string,
    patientName: string,
    consultationType: string,
    scheduledAt: string
  ): Promise<SMSResponse> {
    const scheduledDate = new Date(scheduledAt).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const message = `New Consultation Request\n\nPatient: ${patientName}\nType: ${consultationType}\nScheduled: ${scheduledDate}\n\nPlease log in to accept or decline.`;

    return this.sendSMS({
      to: providerPhone,
      message,
    });
  }

  /**
   * Send notification to patient when provider is assigned
   */
  async sendPatientAssignmentNotification(
    patientPhone: string,
    providerName: string,
    consultationType: string,
    scheduledDate: string
  ): Promise<SMSResponse> {
    const message = `Provider Assigned\n\nA healthcare provider has been assigned to your consultation request.\n\nProvider: ${providerName}\nType: ${consultationType}\nScheduled: ${scheduledDate}\n\nPlease log in to confirm or choose another provider.`;

    return this.sendSMS({
      to: patientPhone,
      message,
    });
  }

  /**
   * Send consultation confirmation to patient
   */
  async sendPatientConfirmation(
    patientPhone: string,
    providerName: string,
    consultationType: string,
    scheduledAt: string
  ): Promise<SMSResponse> {
    const scheduledDate = new Date(scheduledAt).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const message = `Consultation Confirmed\n\nProvider: ${providerName}\nType: ${consultationType}\nScheduled: ${scheduledDate}\n\nYou will receive a reminder 1 hour before.`;

    return this.sendSMS({
      to: patientPhone,
      message,
    });
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(
    phone: string,
    amount: number,
    consultationType: string
  ): Promise<SMSResponse> {
    const message = `Payment Confirmed\n\nAmount: ${amount} SLL\nConsultation: ${consultationType}\n\nYour consultation is now confirmed.`;

    return this.sendSMS({
      to: phone,
      message,
    });
  }
}

export const smsService = new SMSService();

