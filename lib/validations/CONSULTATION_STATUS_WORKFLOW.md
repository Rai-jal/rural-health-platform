# Consultation Status Workflow - Validation System

## Overview

This document describes the status transition validation system implemented for the consultation workflow. The system enforces strict status transitions and role-based permissions at the API level.

## Status Flow

```
pending_admin_review → assigned → confirmed → scheduled → in_progress → completed
                                      ↓
                                  cancelled (at any stage except completed)
```

## Valid Status Transitions

| From Status | To Status | Allowed Roles | Description |
|-------------|-----------|---------------|-------------|
| `draft` | `pending_admin_review` | Patient, Admin | Initial consultation request creation |
| `pending_admin_review` | `assigned` | Admin | Admin assigns provider |
| `pending_admin_review` | `cancelled` | Admin | Admin cancels before assignment |
| `assigned` | `confirmed` | Patient | Patient confirms assigned provider |
| `assigned` | `cancelled` | Patient, Admin | Patient or Admin cancels before confirmation |
| `confirmed` | `scheduled` | Doctor, Admin | Doctor or Admin schedules consultation |
| `confirmed` | `cancelled` | Patient, Admin | Patient or Admin cancels after confirmation |
| `scheduled` | `in_progress` | Doctor | Doctor starts consultation |
| `scheduled` | `cancelled` | Patient, Doctor, Admin | Any role can cancel scheduled consultation |
| `in_progress` | `completed` | Doctor | Doctor completes consultation |
| `in_progress` | `cancelled` | Doctor, Admin | Doctor or Admin cancels during consultation |

**Terminal States:** `completed`, `cancelled` - No further transitions allowed

## Role-Based Permissions

### Admin Permissions

- **Assign Provider**: `pending_admin_review` → `assigned`
- **Reschedule**: Available in `pending_admin_review`, `assigned`, `confirmed`, `scheduled` statuses
- **Cancel**: Available in most statuses (except `completed`)
- **Update Status**: Can transition to `scheduled`, `in_progress`, `completed`, `cancelled` (with validation)
- **Update Notes**: Limited based on consultation status

### Doctor Permissions

- **Update Notes**: Available in `assigned`, `confirmed`, `scheduled`, `in_progress`, `completed` statuses
- **Update Duration**: Available in `in_progress`, `completed` statuses
- **Schedule**: `confirmed` → `scheduled`
- **Start**: `scheduled` → `in_progress`
- **Complete**: `in_progress` → `completed`
- **Cancel**: Available in `scheduled`, `in_progress` statuses
- **Reschedule**: Available in `confirmed` status

### Patient Permissions

- **Confirm**: `assigned` → `confirmed`
- **Cancel**: Available in `assigned`, `confirmed`, `scheduled` statuses

## Implementation Details

### Validation Utility

The validation system is implemented in `/lib/validations/consultation-status.ts` with the following key functions:

1. **`validateStatusTransition(fromStatus, toStatus, role)`**
   - Validates if a status transition is allowed
   - Returns `{ isValid: boolean, error: string | null }`

2. **`validateRolePermission(status, role, action)`**
   - Validates if a role can perform an action on a consultation
   - Actions: `update_notes`, `update_duration`, `assign_provider`, `reschedule`, `confirm`, `cancel`, `start`, `complete`
   - Returns `{ canPerform: boolean, error: string | null }`

3. **`getValidNextStatuses(currentStatus, role)`**
   - Returns all valid next statuses for a given status and role
   - Useful for UI to show available actions

### API Route Guards

All consultation API routes now include status transition validation:

#### Admin Routes
- **`/api/admin/consultations/[id]`** (PATCH): Validates status transitions and role permissions
- **`/api/admin/consultations/[id]`** (DELETE): Validates cancellation transition
- **`/api/admin/consultations/[id]/assign`** (POST): Validates `pending_admin_review` → `assigned` transition

#### Doctor Routes
- **`/api/doctor/consultations/[id]`** (PATCH): Validates status transitions, notes, duration, and reschedule permissions

#### Patient Routes
- **`/api/consultations/[id]/confirm`** (PATCH): Validates `assigned` → `confirmed` transition

#### General Routes
- **`/api/consultations/[id]`** (PATCH): Validates status transitions for both doctors and admins

## Error Responses

All validation failures return consistent error responses:

```json
{
  "error": "Invalid status transition",
  "message": "Doctor role cannot transition consultation from assigned to completed. Only Patient can perform this transition.",
  "currentStatus": "assigned",
  "targetStatus": "completed"
}
```

## Security Considerations

1. **Status Transition Validation**: Prevents invalid transitions (e.g., `confirmed` → `pending`)
2. **Role-Based Permissions**: Ensures only authorized roles can perform specific actions
3. **API-Level Guards**: Validation occurs before database operations
4. **Terminal State Protection**: `completed` and `cancelled` consultations cannot be modified
5. **Current Status Check**: Always fetches current status before validation

## Testing

To test the status validation system:

1. **Test Invalid Transitions**: Attempt to transition from `confirmed` → `pending` (should fail)
2. **Test Role Restrictions**: Try to confirm as a Doctor (should fail - only Patient can confirm)
3. **Test Terminal States**: Try to update a `completed` consultation (should fail)
4. **Test Valid Transitions**: Verify all valid transitions work correctly

## Future Enhancements

Potential improvements:

1. **Audit Log**: Log all status transitions for audit trail
2. **Business Rules**: Add time-based restrictions (e.g., can't cancel within 24 hours)
3. **Webhooks**: Trigger notifications on status changes
4. **Status History**: Track status change history in database
