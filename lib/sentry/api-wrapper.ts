/**
 * Sentry API Error Wrapper
 * 
 * Utility functions for capturing API errors, authentication errors, and payment failures
 * with Sentry while scrubbing sensitive data.
 */

// Optional Sentry import - app works even if Sentry isn't installed
let Sentry: any = null;
try {
  Sentry = require("@sentry/nextjs");
} catch (e) {
  // Sentry not installed - that's okay
}

import { NextResponse } from "next/server";

/**
 * Capture API error with Sentry
 * Use this in API routes to track errors with proper context
 */
export function captureApiError(
  error: unknown,
  context: {
    route?: string;
    method?: string;
    userId?: string;
    errorType?: "api" | "auth" | "payment" | "validation" | "database";
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Capture exception with Sentry (if available)
  if (Sentry?.captureException) {
    Sentry.captureException(error, {
    tags: {
      errorType: context.errorType || "api",
      route: context.route || "unknown",
      method: context.method || "unknown",
      ...context.tags,
    },
    user: context.userId
      ? {
          id: context.userId, // Only include user ID, not email or other sensitive data
        }
      : undefined,
    extra: {
      ...context.extra,
      // Don't include sensitive data - already scrubbed by beforeSend hooks
    },
    });
  }
}

/**
 * Wrap API route handler with Sentry error tracking
 * 
 * Example:
 * ```typescript
 * export async function POST(request: Request) {
 *   return withSentryErrorTracking(request, async () => {
 *     // Your API logic here
 *   }, { errorType: "payment" });
 * }
 * ```
 */
export async function withSentryErrorTracking<T>(
  request: Request,
  handler: () => Promise<T>,
  options?: {
    errorType?: "api" | "auth" | "payment" | "validation" | "database";
    route?: string;
    userId?: string;
  }
): Promise<T> {
  const route = options?.route || new URL(request.url).pathname;
  const method = request.method;

  try {
    return await handler();
  } catch (error) {
    captureApiError(error, {
      route,
      method,
      errorType: options?.errorType || "api",
      userId: options?.userId,
    });

    // Re-throw to let Next.js handle the error response
    throw error;
  }
}

/**
 * Capture authentication error
 */
export function captureAuthError(
  error: unknown,
  context?: {
    route?: string;
    userId?: string;
    action?: string; // e.g., "login", "logout", "token_refresh"
  }
): void {
  captureApiError(error, {
    errorType: "auth",
    route: context?.route,
    method: "AUTH",
    userId: context?.userId,
    tags: {
      authAction: context?.action || "unknown",
    },
  });
}

/**
 * Capture payment failure
 */
export function capturePaymentError(
  error: unknown,
  context?: {
    route?: string;
    userId?: string;
    consultationId?: string;
    amount?: number;
    paymentMethod?: string;
    gateway?: string;
  }
): void {
  // NEVER include payment details (card numbers, CVV, etc.) - those are scrubbed automatically
  captureApiError(error, {
    errorType: "payment",
    route: context?.route,
    method: "POST",
    userId: context?.userId,
    tags: {
      paymentGateway: context?.gateway || "unknown",
      paymentMethod: context?.paymentMethod || "unknown",
    },
    extra: {
      consultationId: context?.consultationId,
      // Don't include amount or sensitive payment details
    },
  });
}

/**
 * Capture validation error (usually not critical, but useful for debugging)
 */
export function captureValidationError(
  error: unknown,
  context?: {
    route?: string;
    validationType?: string; // e.g., "zod", "schema"
  }
): void {
  // Validation errors are usually expected, so use lower severity
  if (Sentry?.captureException) {
    Sentry.captureException(error, {
      level: "warning",
      tags: {
        errorType: "validation",
        route: context?.route || "unknown",
        validationType: context?.validationType || "unknown",
      },
    });
  }
}

/**
 * Create error response with Sentry tracking
 * Use this to return errors from API routes while tracking them
 */
export function createErrorResponse(
  error: unknown,
  statusCode: number = 500,
  options?: {
    route?: string;
    method?: string;
    errorType?: "api" | "auth" | "payment" | "validation" | "database";
    userId?: string;
    publicMessage?: string; // User-friendly message (never includes sensitive data)
  }
): NextResponse {
  // Capture error
  captureApiError(error, {
    route: options?.route,
    method: options?.method,
    errorType: options?.errorType,
    userId: options?.userId,
  });

  // Return error response (never expose sensitive error details)
  const publicMessage =
    options?.publicMessage ||
    (statusCode === 500
      ? "Internal server error"
      : error instanceof Error && statusCode < 500
      ? error.message
      : "An error occurred");

  return NextResponse.json(
    {
      error: publicMessage,
      // In development, include more details
      ...(process.env.NODE_ENV === "development" &&
        error instanceof Error && {
          details: error.message,
        }),
    },
    { status: statusCode }
  );
}
