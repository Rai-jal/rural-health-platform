/**
 * Sentry Server Configuration
 * 
 * This file configures Sentry for server-side error tracking in Next.js API routes and server components.
 * It captures backend errors, API errors, authentication errors, and payment failures.
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

  // Release version
  release: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",

  // Integrations
  integrations: [
    Sentry.nodeProfilingIntegration(),
  ],

  // Before send hook - scrub sensitive data
  beforeSend(event, hint) {
    // Remove sensitive information from errors
    if (event.request) {
      // Remove cookies
      delete event.request.cookies;

      // Scrub headers
      if (event.request.headers) {
        const sensitiveHeaders = [
          "authorization",
          "cookie",
          "x-api-key",
          "x-auth-token",
          "authentication",
          "x-supabase-key",
          "x-supabase-token",
        ];
        sensitiveHeaders.forEach((header) => {
          delete event.request.headers[header.toLowerCase()];
        });
      }

      // Remove query parameters
      if (event.request.query_string) {
        const url = new URL(event.request.url || "");
        const sensitiveParams = [
          "token",
          "api_key",
          "password",
          "secret",
          "key",
          "auth",
        ];
        sensitiveParams.forEach((param) => {
          url.searchParams.delete(param);
        });
        event.request.url = url.toString();
      }

      // Remove body data for sensitive endpoints
      if (event.request.data) {
        const sensitiveEndpoints = [
          "/api/auth/",
          "/api/payments/",
          "/api/user/profile",
        ];
        const isSensitiveEndpoint = sensitiveEndpoints.some((endpoint) =>
          event.request.url?.includes(endpoint)
        );

        if (isSensitiveEndpoint) {
          // Don't send request body for sensitive endpoints
          delete event.request.data;
        } else if (typeof event.request.data === "object") {
          // Scrub sensitive fields from body
          const sensitiveFields = [
            "password",
            "token",
            "api_key",
            "secret",
            "credit_card",
            "card_number",
            "cvv",
            "ssn",
            "apiKey",
            "authToken",
          ];
          const scrubObject = (obj: any): any => {
            if (Array.isArray(obj)) {
              return obj.map(scrubObject);
            }
            if (obj && typeof obj === "object") {
              const scrubbed: any = {};
              for (const [key, value] of Object.entries(obj)) {
                if (sensitiveFields.includes(key.toLowerCase())) {
                  scrubbed[key] = "[REDACTED]";
                } else {
                  scrubbed[key] = scrubObject(value);
                }
              }
              return scrubbed;
            }
            return obj;
          };
          event.request.data = scrubObject(event.request.data);
        }
      }
    }

    // Scrub user data
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
        "supabaseKey",
        "twilioToken",
        "sendgridKey",
      ];
      sensitiveKeys.forEach((key) => {
        delete event.extra[key];
      });
    }

    return event;
  },

  // Ignore specific errors
  ignoreErrors: [
    // Database connection errors (often transient)
    "ECONNREFUSED",
    "ETIMEDOUT",
    // Validation errors (often expected)
    "ZodError",
    // Non-actionable errors
    "NON_ERROR_THROWN",
  ],
  });
}
