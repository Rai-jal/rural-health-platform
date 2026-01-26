/**
 * Debug Endpoint for Africa's Talking SMS
 * Shows configuration and tests authentication
 */

import { NextResponse } from "next/server";

export async function GET() {
  const username = process.env.AFRICAS_TALKING_USERNAME;
  const apiKey = process.env.AFRICAS_TALKING_API_KEY;
  const mode = process.env.AFRICAS_TALKING_MODE || "production";
  
  const apiUrl = mode === "sandbox"
    ? "https://api.sandbox.africastalking.com"
    : "https://api.africastalking.com";

  // Create auth header for testing
  let authHeader = null;
  if (username && apiKey) {
    authHeader = Buffer.from(`${username}:${apiKey}`).toString("base64");
  }

  return NextResponse.json({
    configuration: {
      username: username || "NOT SET",
      apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : "NOT SET",
      mode,
      apiUrl,
      hasCredentials: !!(username && apiKey),
    },
    authentication: {
      authString: username && apiKey ? `${username}:${apiKey.substring(0, 10)}...` : "NOT AVAILABLE",
      authHeader: authHeader ? `${authHeader.substring(0, 20)}...` : "NOT AVAILABLE",
      headerFormat: authHeader ? `Basic ${authHeader.substring(0, 20)}...` : "NOT AVAILABLE",
    },
    testRequest: {
      url: `${apiUrl}/version1/messaging`,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "Authorization": authHeader ? `Basic ${authHeader}` : "NOT SET",
      },
    },
    nextSteps: {
      step1: "Verify credentials are correct in .env.local",
      step2: "Restart dev server: npm run dev",
      step3: "Check server logs for authentication details",
      step4: "Verify phone number is added in Africa's Talking sandbox dashboard",
    },
  });
}
