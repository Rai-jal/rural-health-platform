/**
 * Notification Service
 * Centralized notification handling for the application
 */

import { smsService } from "./sms";
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
    if (provider.users.phone_number) {
      await smsService.sendProviderBookingNotification(
        provider.users.phone_number,
        patientName,
        consultationType,
        consultation.scheduled_at
      );
    }

    // TODO: Add email notification here if needed
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
    if (patient.phone_number) {
      await smsService.sendPatientConfirmation(
        patient.phone_number,
        providerName,
        consultationType,
        consultation.scheduled_at
      );
    }

    // TODO: Add email notification here if needed
    // TODO: Add push notification here if needed
  } catch (error) {
    console.error("Error sending patient acceptance notification:", error);
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

    // TODO: Add email notification here if needed
  } catch (error) {
    console.error("Error sending payment confirmation notification:", error);
    // Don't throw - notifications are non-critical
  }
}

