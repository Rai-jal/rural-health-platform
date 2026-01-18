/**
 * Notification Service
 * Centralized notification handling for the application
 */

import { smsService } from "./sms";
import { emailService } from "./email";
import { getAdminClient } from "@/lib/supabase/admin";

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

    // Get provider details
    const { data: provider } = await adminClient
      .from("healthcare_providers")
      .select(
        `
        *,
        users (
          id,
          full_name,
          phone_number,
          email
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

    // Send SMS notification
    if (provider.users.phone_number && consultation.scheduled_at) {
      await smsService.sendProviderBookingNotification(
        provider.users.phone_number,
        patientName,
        consultationType,
        consultation.scheduled_at
      );
    } else if (provider.users.phone_number) {
      // If no scheduled_at, send a notification without date
      const message = `New Consultation Request\n\nPatient: ${patientName}\nType: ${consultationType}\n\nPlease log in to view details.`;
      await smsService.sendSMS({
        to: provider.users.phone_number,
        message,
      });
    }

    // Send email notification
    if (provider.users.email) {
      try {
        if (consultation.scheduled_at) {
          await emailService.sendConsultationConfirmedEmail(
            provider.users.email,
            patientName,
            consultationType,
            consultation.scheduled_at,
            consultationId
          );
        }
        // For booking notifications without scheduled_at, we can send a simpler email
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

    // Send SMS confirmation
    if (patient.phone_number && consultation.scheduled_at) {
      await smsService.sendPatientConfirmation(
        patient.phone_number,
        providerName,
        consultationType,
        consultation.scheduled_at
      );
    } else if (patient.phone_number) {
      // If no scheduled_at, send a simplified confirmation
      const message = `Consultation Confirmed\n\nProvider: ${providerName}\nType: ${consultationType}\n\nYour consultation has been confirmed. You will receive scheduling details soon.`;
      await smsService.sendSMS({
        to: patient.phone_number,
        message,
      });
    }

    // Send email notification
    if (patient.email && consultation.scheduled_at) {
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

    // Get patient details
    const { data: patient } = await adminClient
      .from("users")
      .select("id, full_name, phone_number, email")
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

    // Send SMS notification
    if (patient.phone_number) {
      await smsService.sendPatientAssignmentNotification(
        patient.phone_number,
        providerName,
        consultationType,
        scheduledDate
      );
    }

    // Send email notification
    if (patient.email) {
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

    // Get patient details
    const { data: patient } = await adminClient
      .from("users")
      .select("id, full_name, phone_number, email")
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

    // Send SMS confirmation
    if (patient.phone_number) {
      await smsService.sendPaymentConfirmation(
        patient.phone_number,
        amount,
        consultationType
      );
    }

    // Send email notification
    if (patient.email) {
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

    // Get user details
    const { data: user } = await adminClient
      .from("users")
      .select("id, full_name, phone_number, email")
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

    // Send email reminder
    if (user.email) {
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

    // Send SMS reminder
    if (user.phone_number) {
      try {
        const scheduledDate = new Date(consultation.scheduled_at).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        });
        const message = `Consultation Reminder\n\nProvider: ${providerName}\nType: ${consultationType}\nScheduled: ${scheduledDate}\n\nPlease join on time.`;
        await smsService.sendSMS({
          to: user.phone_number,
          message,
        });
      } catch (smsError) {
        console.error("Error sending SMS reminder:", smsError);
        // Don't throw - SMS failures are non-critical
      }
    }
  } catch (error) {
    console.error("Error sending consultation reminder:", error);
    // Don't throw - notifications are non-critical
  }
}
