/**
 * Email Notification Service
 * Handles sending email notifications via SendGrid or AWS SES
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

type EmailProvider = "sendgrid" | "ses" | "none";

export class EmailService {
  private provider: EmailProvider;
  private sendGridApiKey: string | undefined;
  private sendGridFromEmail: string | undefined;
  private sendGridFromName: string | undefined;
  private sesRegion: string | undefined;
  private sesAccessKeyId: string | undefined;
  private sesSecretAccessKey: string | undefined;
  private sesFromEmail: string | undefined;
  private defaultFromEmail: string;
  private defaultFromName: string;
  private enabled: boolean;

  constructor() {
    // SendGrid configuration
    this.sendGridApiKey = process.env.SENDGRID_API_KEY;
    this.sendGridFromEmail = process.env.SENDGRID_FROM_EMAIL;
    this.sendGridFromName = process.env.SENDGRID_FROM_NAME || "HealthConnect";

    // AWS SES configuration
    this.sesRegion = process.env.AWS_SES_REGION;
    this.sesAccessKeyId = process.env.AWS_SES_ACCESS_KEY_ID;
    this.sesSecretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY;
    this.sesFromEmail = process.env.AWS_SES_FROM_EMAIL;

    // Default configuration
    this.defaultFromEmail = process.env.EMAIL_FROM || "noreply@healthconnect.app";
    this.defaultFromName = process.env.EMAIL_FROM_NAME || "HealthConnect";

    // Determine provider and if enabled
    if (this.sendGridApiKey) {
      this.provider = "sendgrid";
      this.enabled = true;
    } else if (this.sesAccessKeyId && this.sesSecretAccessKey && this.sesRegion) {
      this.provider = "ses";
      this.enabled = true;
    } else {
      this.provider = "none";
      this.enabled = false;
    }
  }

  /**
   * Send email via configured provider
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    if (!this.enabled) {
      console.warn("Email service not configured. Skipping email send.");
      console.log("Would send email:", {
        to: options.to,
        subject: options.subject,
      });
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    try {
      if (this.provider === "sendgrid") {
        return await this.sendViaSendGrid(options);
      } else if (this.provider === "ses") {
        return await this.sendViaSES(options);
      } else {
        return {
          success: false,
          error: "No email provider configured",
        };
      }
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send email via SendGrid API
   */
  private async sendViaSendGrid(options: EmailOptions): Promise<EmailResponse> {
    if (!this.sendGridApiKey) {
      return {
        success: false,
        error: "SendGrid API key not configured",
      };
    }

    const fromEmail = options.from || this.sendGridFromEmail || this.defaultFromEmail;
    const fromName = options.fromName || this.sendGridFromName || this.defaultFromName;

    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.sendGridApiKey}`,
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
              subject: options.subject,
            },
          ],
          from: {
            email: fromEmail,
            name: fromName,
          },
          content: [
            {
              type: "text/html",
              value: options.html,
            },
            ...(options.text
              ? [
                  {
                    type: "text/plain",
                    value: options.text,
                  },
                ]
              : []),
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorDetails = errorText;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.errors?.[0]?.message || errorJson.message || errorText;
        } catch {
          // If not JSON, use text as-is
        }
        
        console.error("SendGrid API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorDetails,
          fullResponse: errorText,
        });
        
        return {
          success: false,
          error: `SendGrid API error: ${response.status} - ${errorDetails}`,
        };
      }

      // SendGrid returns empty body on success, but includes message-id in headers
      const messageId = response.headers.get("x-message-id") || undefined;

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      console.error("SendGrid error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown SendGrid error",
      };
    }
  }

  /**
   * Send email via AWS SES API
   * 
   * IMPORTANT: This implementation requires @aws-sdk/client-ses to be installed
   * for production use. AWS SES requires proper Signature v4 signing which cannot
   * be implemented with simple fetch requests.
   * 
   * To use AWS SES:
   * 1. Install: npm install @aws-sdk/client-ses
   * 2. Configure AWS credentials in .env.local
   * 3. The SDK will be used automatically if installed
   * 
   * For now, this returns an error directing users to install the SDK.
   * Most users should use SendGrid instead (simpler setup).
   */
  private async sendViaSES(options: EmailOptions): Promise<EmailResponse> {
    if (!this.sesAccessKeyId || !this.sesSecretAccessKey || !this.sesRegion) {
      return {
        success: false,
        error: "AWS SES not fully configured",
      };
    }

    // Check if AWS SDK is installed at runtime
    // Use a runtime require check to avoid Next.js build-time module analysis
    let awsSDK: any = null;
    try {
      // Check if we're in Node.js environment and module exists
      if (typeof require !== 'undefined') {
        // Try to require the module - this won't be analyzed at build time
        const requireFunc = require;
        awsSDK = requireFunc('@aws-sdk/client-ses');
      } else {
        throw new Error('require not available');
      }
    } catch (e: any) {
      // AWS SDK not installed or not in Node.js environment
      const errorMsg = e?.code === 'MODULE_NOT_FOUND' || e?.message?.includes('require')
        ? "AWS SDK not installed. To use AWS SES, install @aws-sdk/client-ses: npm install @aws-sdk/client-ses. Alternatively, use SendGrid (simpler setup)."
        : "AWS SES requires Node.js environment. Use SendGrid for simpler setup.";
      
      return {
        success: false,
        error: errorMsg,
      };
    }

    // If we get here, AWS SDK is available
    const fromEmail = options.from || this.sesFromEmail || this.defaultFromEmail;

    try {
      const { SESClient, SendEmailCommand } = awsSDK;
      
      const sesClient = new SESClient({
        region: this.sesRegion,
        credentials: {
          accessKeyId: this.sesAccessKeyId!,
          secretAccessKey: this.sesSecretAccessKey!,
        },
      });

      const command = new SendEmailCommand({
        Source: fromEmail,
        Destination: {
          ToAddresses: [options.to],
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: "UTF-8",
          },
          Body: {
            Html: {
              Data: options.html,
              Charset: "UTF-8",
            },
            ...(options.text
              ? {
                  Text: {
                    Data: options.text,
                    Charset: "UTF-8",
                  },
                }
              : {}),
          },
        },
      });

      const response = await sesClient.send(command);
      return {
        success: true,
        messageId: response.MessageId,
      };
    } catch (error) {
      console.error("AWS SES error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown AWS SES error",
      };
    }
  }

  /**
   * Generate HTML email template wrapper
   */
  private getEmailTemplate(content: string, title?: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "HealthConnect Notification"}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">HealthConnect</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    ${content}
  </div>
  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
    <p>© ${new Date().getFullYear()} HealthConnect. All rights reserved.</p>
    <p style="margin-top: 10px;">This is an automated message. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Provider booking notification email (new consultation request)
   */
  async sendProviderBookingEmail(
    to: string,
    patientName: string,
    consultationType: string,
    scheduledAt: string | null,
    consultationId: string
  ): Promise<EmailResponse> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const consultationUrl = `${appUrl}/doctor/consultations`;

    const scheduledInfo = scheduledAt
      ? new Date(scheduledAt).toLocaleString("en-US", {
          dateStyle: "long",
          timeStyle: "short",
        })
      : "To be scheduled";

    const content = `
      <h2 style="color: #1f2937; margin-top: 0;">New Consultation Request</h2>
      <p>You have received a new consultation request.</p>
      
      <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
        <p style="margin: 5px 0;"><strong>Patient:</strong> ${patientName}</p>
        <p style="margin: 5px 0;"><strong>Type:</strong> ${consultationType}</p>
        <p style="margin: 5px 0;"><strong>Scheduled:</strong> ${scheduledInfo}</p>
      </div>

      <p>Please log in to accept or decline this consultation request.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${consultationUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Consultation</a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: "New Consultation Request - HealthConnect",
      html: this.getEmailTemplate(content, "New Consultation Request"),
      text: `New Consultation Request\n\nPatient: ${patientName}\nType: ${consultationType}\nScheduled: ${scheduledInfo}\n\nView: ${consultationUrl}`,
    });
  }

  /**
   * Consultation assigned notification email
   */
  async sendConsultationAssignedEmail(
    to: string,
    providerName: string,
    consultationType: string,
    scheduledDate: string,
    consultationId: string
  ): Promise<EmailResponse> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const consultationUrl = `${appUrl}/consultation/${consultationId}`;

    const content = `
      <h2 style="color: #1f2937; margin-top: 0;">Provider Assigned to Your Consultation</h2>
      <p>Great news! A healthcare provider has been assigned to your consultation request.</p>
      
      <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #667eea;">
        <p style="margin: 5px 0;"><strong>Provider:</strong> ${providerName}</p>
        <p style="margin: 5px 0;"><strong>Type:</strong> ${consultationType}</p>
        <p style="margin: 5px 0;"><strong>Scheduled:</strong> ${scheduledDate}</p>
      </div>

      <p>Please log in to confirm this provider or choose another provider if needed.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${consultationUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Consultation</a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: "Provider Assigned - HealthConnect",
      html: this.getEmailTemplate(content, "Provider Assigned"),
      text: `Provider Assigned to Your Consultation\n\nProvider: ${providerName}\nType: ${consultationType}\nScheduled: ${scheduledDate}\n\nView: ${consultationUrl}`,
    });
  }

  /**
   * Consultation confirmed notification email
   */
  async sendConsultationConfirmedEmail(
    to: string,
    providerName: string,
    consultationType: string,
    scheduledAt: string,
    consultationId: string
  ): Promise<EmailResponse> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const consultationUrl = `${appUrl}/consultation/${consultationId}`;
    const scheduledDate = new Date(scheduledAt).toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    });

    const content = `
      <h2 style="color: #1f2937; margin-top: 0;">Consultation Confirmed</h2>
      <p>Your consultation has been confirmed and is scheduled.</p>
      
      <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 5px 0;"><strong>Provider:</strong> ${providerName}</p>
        <p style="margin: 5px 0;"><strong>Type:</strong> ${consultationType}</p>
        <p style="margin: 5px 0;"><strong>Scheduled:</strong> ${scheduledDate}</p>
      </div>

      <p>You will receive a reminder 1 hour before your consultation.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${consultationUrl}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Consultation</a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: "Consultation Confirmed - HealthConnect",
      html: this.getEmailTemplate(content, "Consultation Confirmed"),
      text: `Consultation Confirmed\n\nProvider: ${providerName}\nType: ${consultationType}\nScheduled: ${scheduledDate}\n\nView: ${consultationUrl}`,
    });
  }

  /**
   * Payment successful notification email
   */
  async sendPaymentConfirmationEmail(
    to: string,
    amount: number,
    consultationType: string,
    consultationId: string
  ): Promise<EmailResponse> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const consultationUrl = `${appUrl}/consultation/${consultationId}`;
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "SLL",
      minimumFractionDigits: 0,
    }).format(amount);

    const content = `
      <h2 style="color: #1f2937; margin-top: 0;">Payment Confirmed</h2>
      <p>Your payment has been processed successfully.</p>
      
      <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 5px 0;"><strong>Amount:</strong> ${formattedAmount}</p>
        <p style="margin: 5px 0;"><strong>Consultation Type:</strong> ${consultationType}</p>
        <p style="margin: 5px 0;"><strong>Status:</strong> Payment Confirmed</p>
      </div>

      <p>Your consultation is now confirmed. You will receive scheduling details soon.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${consultationUrl}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Consultation</a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: "Payment Confirmed - HealthConnect",
      html: this.getEmailTemplate(content, "Payment Confirmed"),
      text: `Payment Confirmed\n\nAmount: ${formattedAmount}\nConsultation: ${consultationType}\n\nView: ${consultationUrl}`,
    });
  }

  /**
   * Consultation reminder email
   */
  async sendConsultationReminderEmail(
    to: string,
    providerName: string,
    consultationType: string,
    scheduledAt: string,
    consultationId: string
  ): Promise<EmailResponse> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const consultationUrl = `${appUrl}/consultation/${consultationId}`;
    const scheduledDate = new Date(scheduledAt).toLocaleString("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    });

    const content = `
      <h2 style="color: #1f2937; margin-top: 0;">Consultation Reminder</h2>
      <p>This is a reminder that you have a consultation scheduled soon.</p>
      
      <div style="background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
        <p style="margin: 5px 0;"><strong>Provider:</strong> ${providerName}</p>
        <p style="margin: 5px 0;"><strong>Type:</strong> ${consultationType}</p>
        <p style="margin: 5px 0;"><strong>Scheduled:</strong> ${scheduledDate}</p>
      </div>

      <p>Please join the consultation on time. If you need to reschedule, please contact us as soon as possible.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${consultationUrl}" style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Consultation</a>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: "Consultation Reminder - HealthConnect",
      html: this.getEmailTemplate(content, "Consultation Reminder"),
      text: `Consultation Reminder\n\nProvider: ${providerName}\nType: ${consultationType}\nScheduled: ${scheduledDate}\n\nView: ${consultationUrl}`,
    });
  }
}

export const emailService = new EmailService();
