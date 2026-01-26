/**
 * Africa's Talking SMS Service
 * Handles sending SMS notifications via Africa's Talking API
 * Specifically designed for Sierra Leone phone numbers (+232)
 * 
 * Documentation: https://developers.africastalking.com/docs/sms
 */

interface AfricasTalkingSMSOptions {
  to: string;
  message: string;
  from?: string; // Short code or alphanumeric sender ID
}

interface AfricasTalkingSMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

/**
 * Normalize phone number to E.164 format
 * Ensures Sierra Leone numbers are in +232XXXXXXXX format
 */
function normalizePhoneNumber(phone: string): { normalized: string; error?: string } {
  if (!phone) {
    return { normalized: "", error: "Phone number is required" };
  }

  // Remove all spaces, dashes, and parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // If starts with 0, replace with +232 (Sierra Leone country code)
  if (cleaned.startsWith("0")) {
    cleaned = "+232" + cleaned.substring(1);
  }
  // If starts with 232 (without +), add +
  else if (cleaned.startsWith("232") && !cleaned.startsWith("+232")) {
    cleaned = "+" + cleaned;
  }
  // If doesn't start with +, add +232
  else if (!cleaned.startsWith("+")) {
    cleaned = "+232" + cleaned;
  }

  // Validate E.164 format: +232 followed by 8 digits
  const e164Regex = /^\+232\d{8}$/;
  if (!e164Regex.test(cleaned)) {
    return {
      normalized: cleaned,
      error: `Invalid Sierra Leone phone number format. Expected: +232XXXXXXXX (8 digits after country code), got: ${phone}`,
    };
  }

  return { normalized: cleaned };
}

/**
 * Africa's Talking SMS Service
 * Handles SMS sending for Sierra Leone phone numbers
 */
export class AfricasTalkingSMSService {
  private username: string | undefined;
  private apiKey: string | undefined;
  private senderId: string | undefined;
  private enabled: boolean;
  private apiUrl: string;

  constructor() {
    // Get credentials from environment variables
    this.username = process.env.AFRICAS_TALKING_USERNAME;
    this.apiKey = process.env.AFRICAS_TALKING_API_KEY;
    this.senderId = process.env.SMS_SENDER_ID || "HealthConnect"; // Default sender ID
    
    // Check if service is enabled
    this.enabled = !!(this.username && this.apiKey);

    // Determine API URL based on environment
    // Sandbox: https://api.sandbox.africastalking.com
    // Production: https://api.africastalking.com
    const isSandbox = process.env.AFRICAS_TALKING_MODE === "sandbox";
    this.apiUrl = isSandbox
      ? "https://api.sandbox.africastalking.com"
      : "https://api.africastalking.com";

    if (!this.enabled) {
      console.warn("Africa's Talking SMS service not configured. Missing credentials.");
    } else {
      console.log("Africa's Talking SMS service initialized:", {
        username: this.username,
        mode: isSandbox ? "sandbox" : "production",
        senderId: this.senderId,
      });
    }
  }

  /**
   * Check if phone number is a Sierra Leone number (+232)
   */
  private isSierraLeoneNumber(phone: string): boolean {
    const normalized = normalizePhoneNumber(phone);
    return normalized.normalized.startsWith("+232");
  }

  /**
   * Send SMS via Africa's Talking API
   * 
   * @param options - SMS options including phone number and message
   * @returns Promise with SMS response including success status and message ID
   */
  async sendSMS(options: AfricasTalkingSMSOptions): Promise<AfricasTalkingSMSResponse> {
    // Check if service is enabled
    if (!this.enabled) {
      console.warn("Africa's Talking SMS service not configured. Skipping SMS send.");
      console.log("Would send SMS:", {
        to: options.to,
        message: options.message.substring(0, 50) + "...",
      });
      return {
        success: false,
        error: "Africa's Talking SMS service not configured",
      };
    }

    // Normalize and validate phone number
    const phoneValidation = normalizePhoneNumber(options.to);
    if (phoneValidation.error) {
      console.error("Invalid phone number:", phoneValidation.error);
      return {
        success: false,
        error: phoneValidation.error,
      };
    }

    // Verify it's a Sierra Leone number
    if (!this.isSierraLeoneNumber(phoneValidation.normalized)) {
      return {
        success: false,
        error: `Phone number is not a Sierra Leone number. Expected +232XXXXXXXX, got: ${options.to}`,
      };
    }

    const normalizedPhone = phoneValidation.normalized;

    try {
      // Verify credentials are available
      if (!this.username || !this.apiKey) {
        console.error("Africa's Talking credentials missing:", {
          hasUsername: !!this.username,
          hasApiKey: !!this.apiKey,
        });
        return {
          success: false,
          error: "Africa's Talking credentials not configured",
        };
      }

      // Create Basic Auth header (username:apiKey)
      // Africa's Talking uses Basic Authentication with username:apiKey
      const authString = `${this.username}:${this.apiKey}`;
      const authHeader = Buffer.from(authString).toString("base64");

      // Log authentication details (without exposing full credentials)
      console.log("Africa's Talking API request:", {
        url: `${this.apiUrl}/version1/messaging`,
        username: this.username,
        apiKeyPrefix: this.apiKey?.substring(0, 10) + "...",
        phoneNumber: normalizedPhone,
        hasAuthHeader: !!authHeader,
        authHeaderLength: authHeader?.length,
      });
      
      // Log the actual headers being sent (for debugging)
      const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "Authorization": `Basic ${authHeader}`,
      };
      console.log("Request headers:", {
        ...headers,
        Authorization: `Basic ${authHeader.substring(0, 20)}...` // Only show first 20 chars
      });

      // Prepare request body parameters
      const params = new URLSearchParams({
        username: this.username,
        to: normalizedPhone,
        message: options.message,
      });

      // Add 'from' parameter only if provided (optional for sandbox)
      const fromValue = options.from || this.senderId;
      if (fromValue) {
        params.append("from", fromValue);
      }

      // Make API request to Africa's Talking
      // API endpoint: POST /version1/messaging
      // Authentication: Basic Auth with username:apiKey
      const response = await fetch(`${this.apiUrl}/version1/messaging`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "Authorization": `Basic ${authHeader}`,
        },
        body: params,
      });

      // Parse response
      const responseText = await response.text();
      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // If response is not JSON, log the raw response
        console.error("Africa's Talking API returned non-JSON response:", responseText);
        return {
          success: false,
          error: `Invalid response from Africa's Talking API: ${responseText}`,
          details: { rawResponse: responseText },
        };
      }

      // Check if request was successful
      if (!response.ok) {
        console.error("Africa's Talking SMS API error:", {
          status: response.status,
          statusText: response.statusText,
          error: data,
          phoneNumber: normalizedPhone,
          message: options.message.substring(0, 50) + "...",
        });

        // Extract error message
        let errorMessage = "Failed to send SMS";
        if (data.SMSMessageData?.Recipients?.[0]?.statusMessage) {
          errorMessage = data.SMSMessageData.Recipients[0].statusMessage;
        } else if (data.errorMessage) {
          errorMessage = data.errorMessage;
        } else if (typeof data === "string") {
          errorMessage = data;
        }

        return {
          success: false,
          error: errorMessage,
          details: data,
        };
      }

      // Check response structure
      // Success response format:
      // {
      //   "SMSMessageData": {
      //     "Recipients": [
      //       {
      //         "statusCode": 101,
      //         "number": "+232XXXXXXXX",
      //         "status": "Success",
      //         "cost": "KES 0.8000",
      //         "messageId": "ATXid_xxx"
      //       }
      //     ]
      //   }
      // }
      const smsData = data.SMSMessageData;
      const recipients = smsData?.Recipients || smsData?.Recipient || [];
      const recipient = Array.isArray(recipients) ? recipients[0] : recipients;

      if (recipient && (recipient.statusCode === 101 || recipient.status === "Success")) {
        // Success
        console.log("SMS sent successfully via Africa's Talking:", {
          messageId: recipient.messageId,
          phoneNumber: normalizedPhone,
          status: recipient.status,
          statusCode: recipient.statusCode,
          cost: recipient.cost,
        });

        return {
          success: true,
          messageId: recipient.messageId,
          details: recipient,
        };
      } else {
        // Partial success or failure
        const statusMessage = recipient?.statusMessage || recipient?.status || data.errorMessage || "Unknown error";
        console.error("Africa's Talking SMS failed:", {
          phoneNumber: normalizedPhone,
          statusMessage,
          statusCode: recipient?.statusCode,
          recipient,
          fullResponse: data,
        });

        return {
          success: false,
          error: statusMessage,
          details: { recipient, fullResponse: data },
        };
      }
    } catch (error) {
      console.error("Error sending SMS via Africa's Talking:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: { error },
      };
    }
  }

  /**
   * Check if service is enabled and configured
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const africasTalkingSMSService = new AfricasTalkingSMSService();
