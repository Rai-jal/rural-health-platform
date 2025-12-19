/**
 * Standardized error handling utilities
 */

export interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object" && "error" in error) {
    return String(error.error);
  }
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return "An unexpected error occurred";
}

/**
 * Handle API error response
 */
export async function handleApiError(response: Response): Promise<ErrorResponse> {
  try {
    const data = await response.json();
    return {
      error: data.error || "Request failed",
      message: data.message,
      details: data.details || data.issues,
    };
  } catch {
    return {
      error: `Request failed with status ${response.status}`,
      message: response.statusText,
    };
  }
}

/**
 * Format error for display to user
 */
export function formatErrorForUser(error: unknown): string {
  const message = getErrorMessage(error);
  
  // User-friendly error messages
  const friendlyMessages: Record<string, string> = {
    "unauthorized": "You are not authorized to perform this action. Please log in.",
    "forbidden": "You don't have permission to access this resource.",
    "not found": "The requested resource was not found.",
    "network": "Network error. Please check your internet connection.",
    "timeout": "Request timed out. Please try again.",
  };

  const lowerMessage = message.toLowerCase();
  for (const [key, friendly] of Object.entries(friendlyMessages)) {
    if (lowerMessage.includes(key)) {
      return friendly;
    }
  }

  return message;
}

