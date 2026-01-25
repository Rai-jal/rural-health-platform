/**
 * Email Helper Functions
 * 
 * Reusable email sending functions for notifications and reminders.
 * Uses SendGrid as the email provider.
 * 
 * Environment Variables Required:
 * - SENDGRID_API_KEY: SendGrid API key
 * - SENDGRID_FROM_EMAIL: Sender email address
 * - SENDGRID_FROM_NAME: Sender name (optional, defaults to "HealthConnect")
 * 
 * Usage:
 * ```typescript
 * import { sendEmail } from '@/lib/notifications/email-helper';
 * 
 * await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Test Email',
 *   body: '<h1>Hello</h1><p>This is a test email.</p>'
 * });
 * ```
 */

import { emailService } from "./email";

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string; // HTML body
  text?: string; // Plain text version (optional)
  from?: string;
  fromName?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email using configured email service (SendGrid or AWS SES)
 * 
 * @param options - Email options
 * @returns Result with success status and message ID or error
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  try {
    console.log("📧 Sending email:", {
      to: options.to,
      subject: options.subject,
      provider: "sendgrid", // Currently using SendGrid
    });

    const result = await emailService.sendEmail({
      to: options.to,
      subject: options.subject,
      html: options.body,
      text: options.text || options.body.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      from: options.from,
      fromName: options.fromName,
    });

    if (result.success) {
      console.log("✅ Email sent successfully:", {
        to: options.to,
        messageId: result.messageId,
      });
    } else {
      console.error("❌ Email send failed:", {
        to: options.to,
        error: result.error,
      });
    }

    return {
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    };
  } catch (error) {
    console.error("❌ Error in sendEmail helper:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send notification email
 * Convenience wrapper for common notification emails
 */
export async function sendNotificationEmail(
  to: string,
  subject: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): Promise<SendEmailResult> {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1f2937; margin-top: 0;">${subject}</h2>
      <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
        ${message}
      </div>
      ${actionUrl && actionText
        ? `<div style="text-align: center; margin: 30px 0;">
            <a href="${actionUrl}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">${actionText}</a>
          </div>`
        : ""}
      <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
        This is an automated message from HealthConnect. Please do not reply to this email.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject,
    body: htmlBody,
  });
}

/**
 * Send reminder email
 * Convenience wrapper for reminder emails
 */
export async function sendReminderEmail(
  to: string,
  title: string,
  details: string,
  reminderTime: string,
  actionUrl?: string
): Promise<SendEmailResult> {
  return sendNotificationEmail(
    to,
    `Reminder: ${title}`,
    `
      <p><strong>Reminder:</strong> ${title}</p>
      <p>${details}</p>
      <p><strong>Time:</strong> ${reminderTime}</p>
    `,
    actionUrl,
    "View Details"
  );
}
