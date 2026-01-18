/**
 * Consultation Status Transition Validation
 * 
 * Defines valid status transitions and role-based permissions
 * for the consultation workflow.
 */

// All possible consultation statuses
export type ConsultationStatus =
  | "draft"
  | "pending_admin_review"
  | "assigned"
  | "confirmed"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

// User roles
export type UserRole = "Admin" | "Doctor" | "Patient";

/**
 * Valid status transitions based on workflow
 * Format: { fromStatus: { toStatus: allowedRoles[] } }
 */
const VALID_TRANSITIONS: Record<
  ConsultationStatus,
  Partial<Record<ConsultationStatus, UserRole[]>>
> = {
  // Initial status - can only transition to pending_admin_review (system)
  draft: {
    pending_admin_review: ["Patient", "Admin"], // Patient creates request, Admin can also create
  },

  // Admin review - only Admin can assign
  pending_admin_review: {
    assigned: ["Admin"], // Admin assigns provider
    cancelled: ["Admin"], // Admin can cancel if needed
  },

  // Assigned status - Patient can confirm or cancel, Admin can reassign
  assigned: {
    confirmed: ["Patient"], // Patient confirms assigned provider
    cancelled: ["Patient", "Admin"], // Patient or Admin can cancel
  },

  // Confirmed status - Doctor/Admin can schedule, Patient can cancel
  confirmed: {
    scheduled: ["Doctor", "Admin"], // Doctor or Admin schedules consultation
    cancelled: ["Patient", "Admin"], // Patient or Admin can cancel
  },

  // Scheduled status - Doctor can start, anyone can cancel
  scheduled: {
    in_progress: ["Doctor"], // Doctor starts consultation
    cancelled: ["Patient", "Doctor", "Admin"], // Any role can cancel
  },

  // In progress - Doctor can complete or cancel
  in_progress: {
    completed: ["Doctor"], // Doctor completes consultation
    cancelled: ["Doctor", "Admin"], // Doctor or Admin can cancel during consultation
  },

  // Terminal states - no transitions allowed
  completed: {},
  cancelled: {},
};

/**
 * Check if a status transition is valid
 * @param fromStatus Current status
 * @param toStatus Target status
 * @param role User role attempting the transition
 * @returns Object with isValid flag and error message if invalid
 */
export function validateStatusTransition(
  fromStatus: ConsultationStatus | string,
  toStatus: ConsultationStatus | string,
  role: UserRole
): { isValid: boolean; error: string | null } {
  // Type guard for valid status
  const isValidStatus = (
    status: string
  ): status is ConsultationStatus => {
    return [
      "draft",
      "pending_admin_review",
      "assigned",
      "confirmed",
      "scheduled",
      "in_progress",
      "completed",
      "cancelled",
    ].includes(status);
  };

  // Validate statuses are valid
  if (!isValidStatus(fromStatus)) {
    return {
      isValid: false,
      error: `Invalid current status: ${fromStatus}`,
    };
  }

  if (!isValidStatus(toStatus)) {
    return {
      isValid: false,
      error: `Invalid target status: ${toStatus}`,
    };
  }

  // Same status is always valid (no-op)
  if (fromStatus === toStatus) {
    return { isValid: true, error: null };
  }

  // Check if transition is allowed
  const allowedRoles = VALID_TRANSITIONS[fromStatus]?.[toStatus];

  if (!allowedRoles) {
    return {
      isValid: false,
      error: `Invalid status transition: ${fromStatus} → ${toStatus}. This transition is not allowed.`,
    };
  }

  // Check if role is allowed to make this transition
  if (!allowedRoles.includes(role)) {
    return {
      isValid: false,
      error: `${role} role cannot transition consultation from ${fromStatus} to ${toStatus}. Only ${allowedRoles.join(", ")} can perform this transition.`,
    };
  }

  return { isValid: true, error: null };
}

/**
 * Get all valid next statuses for a given status and role
 * @param currentStatus Current consultation status
 * @param role User role
 * @returns Array of valid next statuses
 */
export function getValidNextStatuses(
  currentStatus: ConsultationStatus | string,
  role: UserRole
): ConsultationStatus[] {
  // Type guard
  const isValidStatus = (
    status: string
  ): status is ConsultationStatus => {
    return [
      "draft",
      "pending_admin_review",
      "assigned",
      "confirmed",
      "scheduled",
      "in_progress",
      "completed",
      "cancelled",
    ].includes(status);
  };

  if (!isValidStatus(currentStatus)) {
    return [];
  }

  const transitions = VALID_TRANSITIONS[currentStatus];
  if (!transitions) {
    return [];
  }

  const validStatuses: ConsultationStatus[] = [];

  for (const [toStatus, allowedRoles] of Object.entries(transitions)) {
    if (allowedRoles && allowedRoles.includes(role)) {
      validStatuses.push(toStatus as ConsultationStatus);
    }
  }

  return validStatuses;
}

/**
 * Check if a role can perform an action on a consultation
 * @param status Current consultation status
 * @param role User role
 * @param action Action being performed (e.g., "update_notes", "cancel", "assign")
 * @returns Object with canPerform flag and error message if not allowed
 */
export function validateRolePermission(
  status: ConsultationStatus | string,
  role: UserRole,
  action:
    | "update_notes"
    | "update_duration"
    | "assign_provider"
    | "reschedule"
    | "confirm"
    | "cancel"
    | "start"
    | "complete"
): { canPerform: boolean; error: string | null } {
  // Role-based action permissions
  const permissions: Record<
    UserRole,
    Partial<Record<ConsultationStatus, string[]>>
  > = {
    Admin: {
      pending_admin_review: ["assign_provider", "reschedule", "cancel"],
      assigned: ["reschedule", "cancel"],
      confirmed: ["reschedule", "cancel"],
      scheduled: ["reschedule", "cancel"],
      in_progress: ["cancel"],
      completed: [], // Read-only
      cancelled: [], // Read-only
      draft: ["assign_provider"],
    },
    Doctor: {
      assigned: ["update_notes"],
      confirmed: ["update_notes", "reschedule"],
      scheduled: ["update_notes", "start", "cancel"],
      in_progress: ["update_notes", "update_duration", "complete", "cancel"],
      completed: ["update_notes", "update_duration"], // Can add notes after completion
      cancelled: [],
      pending_admin_review: [],
      draft: [],
    },
    Patient: {
      assigned: ["confirm", "cancel"],
      confirmed: ["cancel"],
      scheduled: ["cancel"],
      completed: [],
      cancelled: [],
      pending_admin_review: [],
      in_progress: [],
      draft: [],
    },
  };

  // Type guard
  const isValidStatus = (
    s: string
  ): s is ConsultationStatus => {
    return [
      "draft",
      "pending_admin_review",
      "assigned",
      "confirmed",
      "scheduled",
      "in_progress",
      "completed",
      "cancelled",
    ].includes(s);
  };

  if (!isValidStatus(status)) {
    return {
      canPerform: false,
      error: `Invalid consultation status: ${status}`,
    };
  }

  const allowedActions = permissions[role]?.[status] || [];

  if (!allowedActions.includes(action)) {
    return {
      canPerform: false,
      error: `${role} cannot ${action} a consultation in ${status} status.`,
    };
  }

  return { canPerform: true, error: null };
}

/**
 * Status transition documentation for reference
 */
export const STATUS_TRANSITION_DOC = {
  workflow: "pending_admin_review → assigned → confirmed → scheduled → completed",
  transitions: {
    "pending_admin_review → assigned": {
      allowedBy: ["Admin"],
      description: "Admin assigns a provider to the consultation request",
    },
    "assigned → confirmed": {
      allowedBy: ["Patient"],
      description: "Patient confirms the assigned provider",
    },
    "assigned → cancelled": {
      allowedBy: ["Patient", "Admin"],
      description: "Patient or Admin cancels before confirmation",
    },
    "confirmed → scheduled": {
      allowedBy: ["Doctor", "Admin"],
      description: "Doctor or Admin schedules the consultation",
    },
    "confirmed → cancelled": {
      allowedBy: ["Patient", "Admin"],
      description: "Patient or Admin cancels after confirmation",
    },
    "scheduled → in_progress": {
      allowedBy: ["Doctor"],
      description: "Doctor starts the consultation",
    },
    "scheduled → cancelled": {
      allowedBy: ["Patient", "Doctor", "Admin"],
      description: "Any role can cancel scheduled consultation",
    },
    "in_progress → completed": {
      allowedBy: ["Doctor"],
      description: "Doctor completes the consultation",
    },
    "in_progress → cancelled": {
      allowedBy: ["Doctor", "Admin"],
      description: "Doctor or Admin cancels during consultation",
    },
  },
  terminalStates: ["completed", "cancelled"],
  notes: [
    "Completed and cancelled are terminal states - no further transitions allowed",
    "Cancelled consultations cannot be reactivated",
    "Role-based permissions are strictly enforced at API level",
  ],
};
