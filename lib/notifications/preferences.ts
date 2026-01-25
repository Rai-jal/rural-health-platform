/**
 * Notification Preferences Helper
 * 
 * Utilities for checking and respecting user notification preferences
 */

import type { NotificationPreference } from '@/lib/types/auth'

/**
 * Get user's notification preference
 * Defaults to 'sms' for backward compatibility
 */
export function getUserNotificationPreference(
  userPreference?: NotificationPreference | null
): NotificationPreference {
  return userPreference || 'sms'
}

/**
 * Check if user wants SMS notifications
 */
export function shouldSendSMS(
  userPreference?: NotificationPreference | null
): boolean {
  const preference = getUserNotificationPreference(userPreference)
  return preference === 'sms' || preference === 'both'
}

/**
 * Check if user wants Email notifications
 */
export function shouldSendEmail(
  userPreference?: NotificationPreference | null
): boolean {
  const preference = getUserNotificationPreference(userPreference)
  return preference === 'email' || preference === 'both'
}

/**
 * Get notification preference display name
 */
export function getPreferenceDisplayName(
  preference: NotificationPreference
): string {
  const names: Record<NotificationPreference, string> = {
    sms: 'SMS Only',
    email: 'Email Only',
    both: 'SMS & Email',
  }
  return names[preference]
}

/**
 * Get notification preference description
 */
export function getPreferenceDescription(
  preference: NotificationPreference
): string {
  const descriptions: Record<NotificationPreference, string> = {
    sms: 'Receive notifications via SMS only',
    email: 'Receive notifications via Email only',
    both: 'Receive notifications via both SMS and Email',
  }
  return descriptions[preference]
}
