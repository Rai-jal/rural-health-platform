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
        console.error("Twilio SMS error:", data);
        return {
          success: false,
          error: data.message || "Failed to send SMS",
        };
      }

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

