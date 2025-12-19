/**
 * Centralized Error Handling Utilities
 * Provides consistent error handling across the application
 */

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

export class ApplicationError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;

  constructor(message: string, code?: string, statusCode?: number, details?: any) {
    super(message);
    this.name = "ApplicationError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Parse error from API response
 */
export function parseApiError(error: unknown): AppError {
  if (error instanceof ApplicationError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: "UNKNOWN_ERROR",
    };
  }

  if (typeof error === "object" && error !== null) {
    const errorObj = error as any;
    return {
      message: errorObj.message || errorObj.error || "An unknown error occurred",
      code: errorObj.code,
      statusCode: errorObj.statusCode || errorObj.status,
      details: errorObj.details || errorObj.issues,
    };
  }

  return {
    message: "An unknown error occurred",
    code: "UNKNOWN_ERROR",
  };
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  // Map common error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    UNAUTHORIZED: "You are not authorized to perform this action",
    FORBIDDEN: "Access denied. You don't have permission for this action",
    NOT_FOUND: "The requested resource was not found",
    VALIDATION_ERROR: "Please check your input and try again",
    NETWORK_ERROR: "Network error. Please check your connection and try again",
    SERVER_ERROR: "Server error. Please try again later",
    PAYMENT_FAILED: "Payment processing failed. Please try again or use a different payment method",
    CONSULTATION_NOT_FOUND: "Consultation not found",
    PROVIDER_NOT_AVAILABLE: "Healthcare provider is not available at this time",
  };

  if (error.code && errorMessages[error.code]) {
    return errorMessages[error.code];
  }

  return error.message || "An error occurred. Please try again.";
}

/**
 * Handle API error response
 */
export async function handleApiError(response: Response): Promise<AppError> {
  let errorData: any = {};
  
  try {
    errorData = await response.json();
  } catch {
    // If response is not JSON, use status text
    errorData = {
      error: response.statusText || "An error occurred",
      statusCode: response.status,
    };
  }

  return parseApiError(errorData);
}

/**
 * Log error for debugging
 */
export function logError(error: AppError, context?: string) {
  if (process.env.NODE_ENV === "development") {
    console.error(`[${context || "Error"}]`, {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    });
  }
  // In production, send to error tracking service (e.g., Sentry)
}

