/**
 * Sentry Client Configuration
 * 
 * This file configures Sentry for client-side error tracking in Next.js App Router.
 * It runs in the browser and captures frontend errors, React errors, and unhandled promises.
 */

// Optional Sentry - only initialize if package is installed
let Sentry: any = null;
try {
  Sentry = require("@sentry/nextjs");
} catch (e) {
  // Sentry not installed - skip initialization
  console.warn("Sentry not available - error tracking disabled");
}

// Only initialize if Sentry is available and DSN is configured
if (Sentry && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set sample rate for performance monitoring (0.0 to 1.0)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Set sample rate for profiling (0.0 to 1.0)
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === "development",

  // Environment
  environment: process.env.NODE_ENV || "development",

  // Release version (useful for tracking errors by version)
  release: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",

  // Integrations
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true, // Mask all text for privacy
      blockAllMedia: true, // Block all media for privacy
    }),
  ],

  // Before send hook - scrub sensitive data
  beforeSend(event, hint) {
    // Remove sensitive information from errors
    if (event.request) {
      // Remove cookies
      delete event.request.cookies;

      // Scrub headers that might contain sensitive data
      if (event.request.headers) {
        const sensitiveHeaders = [
          "authorization",
          "cookie",
          "x-api-key",
          "x-auth-token",
          "authentication",
        ];
        sensitiveHeaders.forEach((header) => {
          delete event.request.headers[header.toLowerCase()];
        });
      }

      // Remove query parameters that might be sensitive
      if (event.request.query_string) {
        const url = new URL(event.request.url || "");
        const sensitiveParams = ["token", "api_key", "password", "secret"];
        sensitiveParams.forEach((param) => {
          url.searchParams.delete(param);
        });
        event.request.url = url.toString();
      }
    }

    // Scrub user data (don't send emails, phone numbers, etc.)
    if (event.user) {
      event.user = {
        id: event.user.id,
        // Don't include email, username, ip_address, etc.
      };
    }

    // Scrub context data
    if (event.contexts) {
      delete event.contexts.email;
      delete event.contexts.phone_number;
      delete event.contexts.phone;
    }

    // Scrub extra data
    if (event.extra) {
      const sensitiveKeys = [
        "email",
        "phone",
        "phone_number",
        "password",
        "token",
        "api_key",
        "secret",
        "credit_card",
        "ssn",
      ];
      sensitiveKeys.forEach((key) => {
        delete event.extra[key];
      });
    }

    return event;
  },

  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    "atomicFindClose",
    "fb_xd_fragment",
    "bmi_SafeAddOnload",
    "EBCallBackMessageReceived",
    "conduitPage",
    // Network errors (often not actionable)
    "NetworkError",
    "Failed to fetch",
    // ResizeObserver errors (common in React)
    "ResizeObserver loop limit exceeded",
    // Non-actionable browser errors
    "Non-Error promise rejection captured",
  ],

  // Filter out certain transactions
  beforeSendTransaction(event) {
    // Don't track health check endpoints
    if (event.transaction?.includes("/api/health")) {
      return null;
    }
    return event;
  },
  });
}
