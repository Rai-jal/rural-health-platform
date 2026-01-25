/**
 * Notification Service
 * Centralized notification handling for the application
 */

import { smsService } from "./sms";
import { emailService } from "./email";
import { getAdminClient } from "@/lib/supabase/admin";
import { shouldSendSMS, shouldSendEmail } from "./preferences";

export interface NotificationData {
  consultationId: string;
  type: "booking" | "acceptance" | "payment" | "reminder";
  recipientType: "patient" | "provider";
  recipientId: string;
}

/**
 * Send notification to provider when consultation is booked
 */
export async function notifyProviderBooking(
  consultationId: string,
  providerId: string
): Promise<void> {
  try {
    const adminClient = getAdminClient();

    // Get provider details with notification preferences
    const { data: provider } = await adminClient
      .from("healthcare_providers")
      .select(
        `
        *,
        users (
          id,
          full_name,
          phone_number,
          email,
          notification_preferences
        )
      `
      )
      .eq("id", providerId)
      .single();

    if (!provider || !provider.users) {
      console.error("Provider not found for notification");
      return;
    }

    // Get consultation details
    const { data: consultation } = await adminClient
      .from("consultations")
      .select(
        `
        *,
        users (
          id,
          full_name,
          phone_number
        )
      `
      )
      .eq("id", consultationId)
      .single();

    if (!consultation || !consultation.users) {
      console.error("Consultation not found for notification");
      return;
    }

    const patientName = consultation.users.full_name || "Patient";
    const consultationType =
      consultation.consultation_type === "video"
        ? "Video Call"
        : consultation.consultation_type === "voice"
        ? "Voice Call"
        : "SMS Consultation";

    // Send SMS notification (respect user preferences)
    if (
      shouldSendSMS(provider.users.notification_preferences) &&
      provider.users.phone_number &&
      consultation.scheduled_at
    ) {
      const smsResult = await smsService.sendProviderBookingNotification(
        provider.users.phone_number,
        patientName,
        consultationType,
        consultation.scheduled_at
      );
      
      if (!smsResult.success) {
        console.error("SMS notification failed for provider booking:", {
          consultationId,
          providerId,
          phoneNumber: provider.users.phone_number,
          error: smsResult.error,
          messageId: smsResult.messageId,
        });
      } else {
        console.log("SMS notification sent successfully:", {
          consultationId,
          providerId,
          messageId: smsResult.messageId,
        });
      }
    } else if (
      shouldSendSMS(provider.users.notification_preferences) &&
      provider.users.phone_number
    ) {
      // If no scheduled_at, send a notification without date
      const message = `New Consultation Request\n\nPatient: ${patientName}\nType: ${consultationType}\n\nPlease log in to view details.`;
      const smsResult = await smsService.sendSMS({
        to: provider.users.phone_number,
        message,
      });
      
      if (!smsResult.success) {
        console.error("SMS notification failed (no scheduled_at):", {
          consultationId,
          providerId,
          phoneNumber: provider.users.phone_number,
          error: smsResult.error,
        });
      } else {
        console.log("SMS notification sent successfully (no scheduled_at):", {
          consultationId,
          messageId: smsResult.messageId,
        });
      }
    } else {
      // Log why SMS was not sent
      console.log("SMS not sent for provider booking:", {
        consultationId,
        providerId,
        reason: !shouldSendSMS(provider.users.notification_preferences)
          ? "User preference does not allow SMS"
          : !provider.users.phone_number
          ? "Provider has no phone number"
          : "Unknown reason",
        preference: provider.users.notification_preferences,
        hasPhoneNumber: !!provider.users.phone_number,
      });
    }

    // Send email notification (respect user preferences)
    if (
      shouldSendEmail(provider.users.notification_preferences) &&
      provider.users.email
    ) {
      try {
        await emailService.sendProviderBookingEmail(
          provider.users.email,
          patientName,
          consultationType,
          consultation.scheduled_at,
          consultationId
        );
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        // Don't throw - email failures are non-critical
      }
    }

    // TODO: Add push notification here if needed
  } catch (error) {
    console.error("Error sending provider booking notification:", error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Send confirmation to patient when provider accepts consultation
 */
export async function notifyPatientAcceptance(
  consultationId: string,
  patientId: string
): Promise<void> {
  try {
    const adminClient = getAdminClient();

    // Get patient details
    const { data: patient } = await adminClient
      .from("users")
      .select("id, full_name, phone_number, email")
      .eq("id", patientId)
      .single();

    if (!patient) {
      console.error("Patient not found for notification");
      return;
    }

    // Get consultation details
    const { data: consultation } = await adminClient
      .from("consultations")
      .select(
        `
        *,
        healthcare_providers (
          id,
          full_name
        )
      `
      )
      .eq("id", consultationId)
      .single();

    if (!consultation || !consultation.healthcare_providers) {
      console.error("Consultation not found for notification");
      return;
    }

    const providerName =
      consultation.healthcare_providers.full_name || "Healthcare Provider";
    const consultationType =
      consultation.consultation_type === "video"
        ? "Video Call"
        : consultation.consultation_type === "voice"
        ? "Voice Call"
        : "SMS Consultation";

    // Send SMS confirmation (respect user preferences)
    if (
      shouldSendSMS(patient.notification_preferences) &&
      patient.phone_number &&
      consultation.scheduled_at
    ) {
      const smsResult = await smsService.sendPatientConfirmation(
        patient.phone_number,
        providerName,
        consultationType,
        consultation.scheduled_at
      );
      
      if (!smsResult.success) {
        console.error("SMS notification failed for patient confirmation:", {
          consultationId,
          patientId,
          phoneNumber: patient.phone_number,
          error: smsResult.error,
        });
      } else {
        console.log("SMS notification sent successfully (patient confirmation):", {
          consultationId,
          messageId: smsResult.messageId,
        });
      }
    } else if (
      shouldSendSMS(patient.notification_preferences) &&
      patient.phone_number
    ) {
      // If no scheduled_at, send a simplified confirmation
      const message = `Consultation Confirmed\n\nProvider: ${providerName}\nType: ${consultationType}\n\nYour consultation has been confirmed. You will receive scheduling details soon.`;
      const smsResult = await smsService.sendSMS({
        to: patient.phone_number,
        message,
      });
      
      if (!smsResult.success) {
        console.error("SMS notification failed (confirmation, no scheduled_at):", {
          consultationId,
          patientId,
          phoneNumber: patient.phone_number,
          error: smsResult.error,
        });
      } else {
        console.log("SMS notification sent successfully (confirmation, no scheduled_at):", {
          consultationId,
          messageId: smsResult.messageId,
        });
      }
    } else {
      console.log("SMS not sent for patient confirmation:", {
        consultationId,
        patientId,
        reason: !shouldSendSMS(patient.notification_preferences)
          ? "User preference does not allow SMS"
          : !patient.phone_number
          ? "Patient has no phone number"
          : "No scheduled_at and preference check failed",
        preference: patient.notification_preferences,
        hasPhoneNumber: !!patient.phone_number,
      });
    }

    // Send email notification (respect user preferences)
    if (
      shouldSendEmail(patient.notification_preferences) &&
      patient.email &&
      consultation.scheduled_at
    ) {
      try {
        await emailService.sendConsultationConfirmedEmail(
          patient.email,
          providerName,
          consultationType,
          consultation.scheduled_at,
          consultationId
        );
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        // Don't throw - email failures are non-critical
      }
    }

    // TODO: Add push notification here if needed
  } catch (error) {
    console.error("Error sending patient acceptance notification:", error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Send notification to patient when provider is assigned
 */
export async function notifyPatientAssignment(
  consultationId: string,
  patientId: string
): Promise<void> {
  try {
    const adminClient = getAdminClient();

    // Get patient details with notification preferences
    const { data: patient } = await adminClient
      .from("users")
      .select("id, full_name, phone_number, email, notification_preferences")
      .eq("id", patientId)
      .single();

    if (!patient) {
      console.error("Patient not found for assignment notification");
      return;
    }

    // Get consultation details
    const { data: consultation } = await adminClient
      .from("consultations")
      .select(
        `
        *,
        healthcare_providers (
          id,
          full_name,
          specialty
        )
      `
      )
      .eq("id", consultationId)
      .single();

    if (!consultation || !consultation.healthcare_providers) {
      console.error("Consultation not found for assignment notification");
      return;
    }

    const providerName =
      consultation.healthcare_providers.full_name || "Healthcare Provider";
    const consultationType =
      consultation.consultation_type === "video"
        ? "Video Call"
        : consultation.consultation_type === "voice"
        ? "Voice Call"
        : "SMS Consultation";
    
    // Format scheduled date
    let scheduledDate = "TBD";
    if (consultation.scheduled_at) {
      scheduledDate = new Date(consultation.scheduled_at).toLocaleDateString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } else if (consultation.preferred_date) {
      scheduledDate = new Date(consultation.preferred_date).toLocaleDateString("en-US", {
        dateStyle: "medium",
      });
    }

    // Send SMS notification (respect user preferences)
    if (
      shouldSendSMS(patient.notification_preferences) &&
      patient.phone_number
    ) {
      const smsResult = await smsService.sendPatientAssignmentNotification(
        patient.phone_number,
        providerName,
        consultationType,
        scheduledDate
      );
      
      if (!smsResult.success) {
        console.error("SMS notification failed for patient assignment:", {
          consultationId,
          patientId,
          phoneNumber: patient.phone_number,
          error: smsResult.error,
        });
      } else {
        console.log("SMS notification sent successfully (patient assignment):", {
          consultationId,
          messageId: smsResult.messageId,
        });
      }
    } else {
      console.log("SMS not sent for patient assignment:", {
        consultationId,
        patientId,
        reason: !shouldSendSMS(patient.notification_preferences)
          ? "User preference does not allow SMS"
          : !patient.phone_number
          ? "Patient has no phone number"
          : "Unknown reason",
        preference: patient.notification_preferences,
        hasPhoneNumber: !!patient.phone_number,
      });
    }

    // Send email notification (respect user preferences)
    if (shouldSendEmail(patient.notification_preferences) && patient.email) {
      try {
        await emailService.sendConsultationAssignedEmail(
          patient.email,
          providerName,
          consultationType,
          scheduledDate,
          consultationId
        );
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        // Don't throw - email failures are non-critical
      }
    }

    // TODO: Add push notification here if needed
  } catch (error) {
    console.error("Error sending patient assignment notification:", error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Send payment confirmation notification
 */
export async function notifyPaymentConfirmation(
  consultationId: string,
  patientId: string,
  amount: number
): Promise<void> {
  try {
    const adminClient = getAdminClient();

    // Get patient details with notification preferences
    const { data: patient } = await adminClient
      .from("users")
      .select("id, full_name, phone_number, email, notification_preferences")
      .eq("id", patientId)
      .single();

    if (!patient) {
      console.error("Patient not found for payment notification");
      return;
    }

    // Get consultation details
    const { data: consultation } = await adminClient
      .from("consultations")
      .select("consultation_type")
      .eq("id", consultationId)
      .single();

    if (!consultation) {
      console.error("Consultation not found for payment notification");
      return;
    }

    const consultationType =
      consultation.consultation_type === "video"
        ? "Video Call"
        : consultation.consultation_type === "voice"
        ? "Voice Call"
        : "SMS Consultation";

    // Send SMS confirmation (respect user preferences)
    if (
      shouldSendSMS(patient.notification_preferences) &&
      patient.phone_number
    ) {
      const smsResult = await smsService.sendPaymentConfirmation(
        patient.phone_number,
        amount,
        consultationType
      );
      
      if (!smsResult.success) {
        console.error("SMS notification failed for payment confirmation:", {
          consultationId,
          patientId,
          amount,
          phoneNumber: patient.phone_number,
          error: smsResult.error,
        });
      } else {
        console.log("SMS notification sent successfully (payment confirmation):", {
          consultationId,
          amount,
          messageId: smsResult.messageId,
        });
      }
    } else {
      console.log("SMS not sent for payment confirmation:", {
        consultationId,
        patientId,
        reason: !shouldSendSMS(patient.notification_preferences)
          ? "User preference does not allow SMS"
          : !patient.phone_number
          ? "Patient has no phone number"
          : "Unknown reason",
        preference: patient.notification_preferences,
        hasPhoneNumber: !!patient.phone_number,
      });
    }

    // Send email notification (respect user preferences)
    if (shouldSendEmail(patient.notification_preferences) && patient.email) {
      try {
        await emailService.sendPaymentConfirmationEmail(
          patient.email,
          amount,
          consultationType,
          consultationId
        );
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        // Don't throw - email failures are non-critical
      }
    }
  } catch (error) {
    console.error("Error sending payment confirmation notification:", error);
    // Don't throw - notifications are non-critical
  }
}

/**
 * Send consultation reminder notification
 */
export async function notifyConsultationReminder(
  consultationId: string,
  userId: string,
  recipientType: "patient" | "provider"
): Promise<void> {
  try {
    const adminClient = getAdminClient();

    // Get user details with notification preferences
    const { data: user } = await adminClient
      .from("users")
      .select("id, full_name, phone_number, email, notification_preferences")
      .eq("id", userId)
      .single();

    if (!user) {
      console.error("User not found for reminder notification");
      return;
    }

    // Get consultation details
    const { data: consultation } = await adminClient
      .from("consultations")
      .select(
        `
        *,
        healthcare_providers (
          id,
          full_name
        ),
        users (
          id,
          full_name
        )
      `
      )
      .eq("id", consultationId)
      .single();

    if (!consultation || !consultation.scheduled_at) {
      console.error("Consultation not found or not scheduled for reminder");
      return;
    }

    const providerName =
      consultation.healthcare_providers?.full_name || "Healthcare Provider";
    const patientName = consultation.users?.full_name || "Patient";
    const consultationType =
      consultation.consultation_type === "video"
        ? "Video Call"
        : consultation.consultation_type === "voice"
        ? "Voice Call"
        : "SMS Consultation";

    // Send email reminder (respect user preferences)
    if (
      shouldSendEmail(user.notification_preferences) &&
      user.email
    ) {
      try {
        await emailService.sendConsultationReminderEmail(
          user.email,
          recipientType === "patient" ? providerName : patientName,
          consultationType,
          consultation.scheduled_at,
          consultationId
        );
      } catch (emailError) {
        console.error("Error sending email reminder:", emailError);
        // Don't throw - email failures are non-critical
      }
    }

    // Send SMS reminder (respect user preferences)
    if (
      shouldSendSMS(user.notification_preferences) &&
      user.phone_number
    ) {
      try {
        const scheduledDate = new Date(consultation.scheduled_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        const message = `Consultation Reminder\n\nProvider: ${providerName}\nType: ${consultationType}\nScheduled: ${scheduledDate}\n\nPlease join on time.`;
        const smsResult = await smsService.sendSMS({
          to: user.phone_number,
          message,
        });
        
        if (!smsResult.success) {
          console.error("SMS reminder failed:", {
            consultationId,
            userId,
            recipientType,
            phoneNumber: user.phone_number,
            error: smsResult.error,
          });
        } else {
          console.log("SMS reminder sent successfully:", {
            consultationId,
            messageId: smsResult.messageId,
          });
        }
      } catch (smsError) {
        console.error("Error sending SMS reminder:", smsError);
        // Don't throw - SMS failures are non-critical
      }
    } else {
      console.log("SMS reminder not sent:", {
        consultationId,
        userId,
        reason: !shouldSendSMS(user.notification_preferences)
          ? "User preference does not allow SMS"
          : !user.phone_number
          ? "User has no phone number"
          : "Unknown reason",
        preference: user.notification_preferences,
        hasPhoneNumber: !!user.phone_number,
      });
    }
  } catch (error) {
    console.error("Error sending consultation reminder:", error);
    // Don't throw - notifications are non-critical
  }
}
