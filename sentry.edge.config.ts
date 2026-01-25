/**
 * Sentry Edge Configuration
 * 
 * This file configures Sentry for edge runtime (middleware, edge functions).
 */

// Optional Sentry - only initialize if package is installed
let Sentry: any = null;
try {
  Sentry = require("@sentry/nextjs");
} catch (e) {
  // Sentry not installed - skip initialization
}

// Only initialize if Sentry is available and DSN is configured
if (Sentry && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Lower sample rate for edge (can be expensive)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

  debug: process.env.NODE_ENV === "development",
  environment: process.env.NODE_ENV || "development",
  release: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",

  // Before send hook - scrub sensitive data
  beforeSend(event) {
    // Same scrubbing as server config
    if (event.request) {
      delete event.request.cookies;
      if (event.request.headers) {
        const sensitiveHeaders = [
          "authorization",
          "cookie",
          "x-api-key",
          "x-auth-token",
        ];
        sensitiveHeaders.forEach((header) => {
          delete event.request.headers[header.toLowerCase()];
        });
      }
    }

    if (event.user) {
      event.user = { id: event.user.id };
    }

    return event;
  },
  });
}
