/**
 * Admin Alert Service
 * Sends email alerts to administrators for important events
 * 
 * Usage:
 *   import { sendAdminAlert } from '@/lib/notifications/admin-alerts';
 *   await sendAdminAlert('payment_failed', { paymentId: '...', amount: 10000 });
 */

import { emailService } from "./email";
import { getAdminClient } from "@/lib/supabase/admin";

export type AdminAlertType =
  | "payment_failed"
  | "payment_refunded"
  | "consultation_cancelled"
  | "high_volume_consultations"
  | "system_error"
  | "webhook_failed"
  | "sms_delivery_failed";

interface AdminAlertData {
  [key: string]: any;
}

/**
 * Get admin email addresses from database
 */
async function getAdminEmails(): Promise<string[]> {
  try {
    const adminClient = getAdminClient();
    
    const { data: admins, error } = await adminClient
      .from("users")
      .select("email")
      .eq("role", "Admin")
      .not("email", "is", null);

    if (error) {
      console.error("Error fetching admin emails:", error);
      return [];
    }

    return (admins || []).map((admin) => admin.email).filter(Boolean);
  } catch (error) {
    console.error("Error in getAdminEmails:", error);
    return [];
  }
}

/**
 * Generate email subject based on alert type
 */
function getAlertSubject(type: AdminAlertType): string {
  const subjects: Record<AdminAlertType, string> = {
    payment_failed: "⚠️ Payment Failed - Action Required",
    payment_refunded: "💰 Payment Refunded",
    consultation_cancelled: "❌ Consultation Cancelled",
    high_volume_consultations: "📊 High Volume Alert",
    system_error: "🔴 System Error Detected",
    webhook_failed: "⚠️ Webhook Processing Failed",
    sms_delivery_failed: "📱 SMS Delivery Failed",
  };

  return subjects[type] || "Admin Alert";
}

/**
 * Generate email HTML body based on alert type
 */
function getAlertBody(type: AdminAlertType, data: AdminAlertData): string {
  const baseStyle = `
    font-family: Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  `;

  const cardStyle = `
    background: #f9fafb;
    border-left: 4px solid #ef4444;
    padding: 20px;
    border-radius: 6px;
    margin: 20px 0;
  `;

  let content = "";

  switch (type) {
    case "payment_failed":
      content = `
        <h2 style="color: #ef4444;">Payment Failed</h2>
        <div style="${cardStyle}">
          <p><strong>Payment ID:</strong> ${data.paymentId || "N/A"}</p>
          <p><strong>Amount:</strong> Le ${data.amount?.toLocaleString() || "N/A"}</p>
          <p><strong>User ID:</strong> ${data.userId || "N/A"}</p>
          <p><strong>Consultation ID:</strong> ${data.consultationId || "N/A"}</p>
          <p><strong>Error:</strong> ${data.error || "Unknown error"}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/payments">View in Admin Dashboard</a></p>
      `;
      break;

    case "payment_refunded":
      content = `
        <h2 style="color: #10b981;">Payment Refunded</h2>
        <div style="${cardStyle}">
          <p><strong>Payment ID:</strong> ${data.paymentId || "N/A"}</p>
          <p><strong>Amount:</strong> Le ${data.amount?.toLocaleString() || "N/A"}</p>
          <p><strong>Refund ID:</strong> ${data.refundId || "N/A"}</p>
          <p><strong>User ID:</strong> ${data.userId || "N/A"}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/payments">View in Admin Dashboard</a></p>
      `;
      break;

    case "consultation_cancelled":
      content = `
        <h2 style="color: #f59e0b;">Consultation Cancelled</h2>
        <div style="${cardStyle}">
          <p><strong>Consultation ID:</strong> ${data.consultationId || "N/A"}</p>
          <p><strong>Patient:</strong> ${data.patientName || "N/A"}</p>
          <p><strong>Provider:</strong> ${data.providerName || "N/A"}</p>
          <p><strong>Reason:</strong> ${data.reason || "Not specified"}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/consultations">View in Admin Dashboard</a></p>
      `;
      break;

    case "high_volume_consultations":
      content = `
        <h2 style="color: #3b82f6;">High Volume Alert</h2>
        <div style="${cardStyle}">
          <p><strong>Total Consultations Today:</strong> ${data.count || 0}</p>
          <p><strong>Threshold:</strong> ${data.threshold || 50}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>This is an automated alert for high consultation volume.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin">View Admin Dashboard</a></p>
      `;
      break;

    case "system_error":
      content = `
        <h2 style="color: #ef4444;">System Error Detected</h2>
        <div style="${cardStyle}">
          <p><strong>Error Type:</strong> ${data.errorType || "Unknown"}</p>
          <p><strong>Message:</strong> ${data.message || "N/A"}</p>
          <p><strong>Route:</strong> ${data.route || "N/A"}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          ${data.stack ? `<pre style="background: #1f2937; color: #f9fafb; padding: 10px; border-radius: 4px; overflow-x: auto;">${data.stack}</pre>` : ""}
        </div>
        <p>Please investigate this error immediately.</p>
      `;
      break;

    case "webhook_failed":
      content = `
        <h2 style="color: #ef4444;">Webhook Processing Failed</h2>
        <div style="${cardStyle}">
          <p><strong>Webhook Type:</strong> ${data.webhookType || "Unknown"}</p>
          <p><strong>Transaction ID:</strong> ${data.transactionId || "N/A"}</p>
          <p><strong>Error:</strong> ${data.error || "Unknown error"}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>Webhook processing failed. Manual intervention may be required.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/payments">View Payments</a></p>
      `;
      break;

    case "sms_delivery_failed":
      content = `
        <h2 style="color: #f59e0b;">SMS Delivery Failed</h2>
        <div style="${cardStyle}">
          <p><strong>Phone Number:</strong> ${data.phoneNumber || "N/A"}</p>
          <p><strong>User ID:</strong> ${data.userId || "N/A"}</p>
          <p><strong>Notification Type:</strong> ${data.notificationType || "N/A"}</p>
          <p><strong>Error:</strong> ${data.error || "Unknown error"}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>SMS notification failed to deliver. User may need to update phone number.</p>
      `;
      break;

    default:
      content = `
        <h2>Admin Alert</h2>
        <div style="${cardStyle}">
          <p><strong>Type:</strong> ${type}</p>
          <p><strong>Data:</strong></p>
          <pre>${JSON.stringify(data, null, 2)}</pre>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `;
  }

  return `
    <div style="${baseStyle}">
      ${content}
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 12px;">
        This is an automated alert from HealthConnect. Please do not reply to this email.
      </p>
    </div>
  `;
}

/**
 * Send admin alert email
 * 
 * @param type - Type of alert
 * @param data - Alert data
 * @param customRecipients - Optional custom email addresses (defaults to all admins)
 */
export async function sendAdminAlert(
  type: AdminAlertType,
  data: AdminAlertData,
  customRecipients?: string[]
): Promise<{ success: boolean; sent: number; errors: string[] }> {
  try {
    // Get admin emails (or use custom recipients)
    const recipients = customRecipients || (await getAdminEmails());

    if (recipients.length === 0) {
      console.warn("No admin email addresses found. Skipping admin alert.");
      return {
        success: false,
        sent: 0,
        errors: ["No admin email addresses found"],
      };
    }

    const subject = getAlertSubject(type);
    const html = getAlertBody(type, data);

    const results = {
      success: true,
      sent: 0,
      errors: [] as string[],
    };

    // Send email to each admin
    for (const email of recipients) {
      try {
        const result = await emailService.sendEmail({
          to: email,
          subject,
          html,
          text: html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
        });

        if (result.success) {
          results.sent++;
          console.log(`✅ Admin alert sent to ${email}:`, { type, messageId: result.messageId });
        } else {
          results.errors.push(`Failed to send to ${email}: ${result.error}`);
          console.error(`❌ Failed to send admin alert to ${email}:`, result.error);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Error sending to ${email}: ${errorMsg}`);
        console.error(`❌ Error sending admin alert to ${email}:`, error);
      }
    }

    if (results.sent === 0 && results.errors.length > 0) {
      results.success = false;
    }

    return results;
  } catch (error) {
    console.error("Error in sendAdminAlert:", error);
    return {
      success: false,
      sent: 0,
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

/**
 * Convenience functions for common alert types
 */

export async function alertPaymentFailed(
  paymentId: string,
  userId: string,
  consultationId: string,
  amount: number,
  error: string
): Promise<void> {
  await sendAdminAlert("payment_failed", {
    paymentId,
    userId,
    consultationId,
    amount,
    error,
  });
}

export async function alertPaymentRefunded(
  paymentId: string,
  userId: string,
  amount: number,
  refundId?: string
): Promise<void> {
  await sendAdminAlert("payment_refunded", {
    paymentId,
    userId,
    amount,
    refundId,
  });
}

export async function alertConsultationCancelled(
  consultationId: string,
  patientName: string,
  providerName: string,
  reason?: string
): Promise<void> {
  await sendAdminAlert("consultation_cancelled", {
    consultationId,
    patientName,
    providerName,
    reason,
  });
}

export async function alertSystemError(
  errorType: string,
  message: string,
  route?: string,
  stack?: string
): Promise<void> {
  await sendAdminAlert("system_error", {
    errorType,
    message,
    route,
    stack,
  });
}

export async function alertWebhookFailed(
  webhookType: string,
  transactionId: string,
  error: string
): Promise<void> {
  await sendAdminAlert("webhook_failed", {
    webhookType,
    transactionId,
    error,
  });
}
