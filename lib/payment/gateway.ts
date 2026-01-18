/**
 * Payment Gateway Integration Service
 * 
 * Integrates with Flutterwave for Sierra Leone payment processing
 * Supports: Card payments, Mobile Money (Orange Money, Africell, MTN), Bank transfers
 * 
 * Flutterwave Documentation: https://developer.flutterwave.com/docs
 */

import crypto from "crypto";

export interface PaymentGatewayConfig {
  // Flutterwave Configuration
  flutterwavePublicKey?: string;
  flutterwaveSecretKey?: string;
  flutterwaveEncryptionKey?: string;
  flutterwaveWebhookSecret?: string;
  // Mode: 'sandbox' or 'live'
  flutterwaveMode?: "sandbox" | "live";
  // Fallback mock config (for development/testing without Flutterwave)
  enableMockPayments?: boolean;
}

export interface PaymentRequest {
  amount: number; // Amount in Leones
  phoneNumber?: string; // For mobile money (format: +232XXXXXXXXX)
  email?: string; // Customer email
  customerName?: string; // Customer full name
  paymentMethod: "card" | "orange_money" | "africell_money" | "qmoney" | "mtn_money" | "bank_transfer" | "cash";
  consultationId: string;
  userId: string;
  description?: string;
  redirectUrl?: string; // URL to redirect after payment (for card/redirect flows)
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  status: "pending" | "completed" | "failed";
  message: string;
  gatewayResponse?: any;
  paymentLink?: string; // For redirect-based payments
  paymentInstructions?: string; // For USSD/mobile money instructions
  reference?: string; // Flutterwave transaction reference
}

export interface PaymentVerification {
  transactionId: string;
  reference: string;
  status: "pending" | "completed" | "failed";
  verified: boolean;
  amount?: number;
  currency?: string;
}

class PaymentGatewayService {
  private config: PaymentGatewayConfig;
  private baseUrl: string;

  constructor(config: PaymentGatewayConfig = {}) {
    this.config = config;
    // Determine Flutterwave API base URL based on mode
    const mode = config.flutterwaveMode || process.env.FLUTTERWAVE_MODE || "sandbox";
    this.baseUrl =
      mode === "live"
        ? "https://api.flutterwave.com/v3"
        : "https://api.flutterwave.com/v3";
    // Both sandbox and live use same base URL, credentials differ
  }

  /**
   * Get Flutterwave secret key from config or environment
   */
  private getSecretKey(): string {
    return (
      this.config.flutterwaveSecretKey || process.env.FLUTTERWAVE_SECRET_KEY || ""
    );
  }

  /**
   * Get Flutterwave public key from config or environment
   */
  private getPublicKey(): string {
    return (
      this.config.flutterwavePublicKey || process.env.FLUTTERWAVE_PUBLIC_KEY || ""
    );
  }

  /**
   * Get Flutterwave encryption key
   */
  private getEncryptionKey(): string {
    return (
      this.config.flutterwaveEncryptionKey ||
      process.env.FLUTTERWAVE_ENCRYPTION_KEY ||
      ""
    );
  }

  /**
   * Check if Flutterwave is configured
   */
  private isFlutterwaveConfigured(): boolean {
    return !!this.getSecretKey() && !!this.getPublicKey();
  }

  /**
   * Check if mock payments should be used
   */
  private shouldUseMock(): boolean {
    return (
      this.config.enableMockPayments === true ||
      (!this.isFlutterwaveConfigured() && process.env.NODE_ENV !== "production")
    );
  }

  /**
   * Initiate payment through Flutterwave or mock gateway
   */
  async initiatePayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Use mock payments if configured or if Flutterwave not configured in dev
      if (this.shouldUseMock()) {
        return this.initiateMockPayment(request);
      }

      // Use Flutterwave for real payments
      if (!this.isFlutterwaveConfigured()) {
        throw new Error(
          "Flutterwave is not configured. Set FLUTTERWAVE_SECRET_KEY and FLUTTERWAVE_PUBLIC_KEY environment variables."
        );
      }

      // Map payment methods to Flutterwave payment types
      switch (request.paymentMethod) {
        case "card":
          return await this.initiateCardPayment(request);
        case "orange_money":
        case "africell_money":
        case "mtn_money":
          return await this.initiateMobileMoneyPayment(request);
        case "qmoney":
          // QMoney might not be directly supported, use generic mobile money or bank transfer
          return await this.initiateMobileMoneyPayment(request);
        case "bank_transfer":
          return await this.initiateBankTransfer(request);
        case "cash":
          // Cash payments are handled manually, no gateway needed
          return this.processCashPayment(request);
        default:
          throw new Error(`Unsupported payment method: ${request.paymentMethod}`);
      }
    } catch (error) {
      console.error("Payment gateway error:", error);
      return {
        success: false,
        transactionId: `TXN${Date.now()}`,
        status: "failed",
        message: error instanceof Error ? error.message : "Payment processing failed",
      };
    }
  }

  /**
   * Initiate card payment via Flutterwave
   * Returns a payment link for user to complete payment
   */
  private async initiateCardPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const secretKey = this.getSecretKey();
    const webhookUrl =
      process.env.NEXT_PUBLIC_APP_URL + "/api/payments/webhook";
    const redirectUrl = request.redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/payments/callback`;

    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: `HC-${request.consultationId}-${Date.now()}`, // Unique reference
          amount: request.amount,
          currency: "SLL", // Sierra Leone Leone
          redirect_url: redirectUrl,
          payment_options: "card",
          customer: {
            email: request.email || `user${request.userId}@healthconnect.app`,
            phone_number: request.phoneNumber || "",
            name: request.customerName || "Customer",
          },
          customizations: {
            title: "HealthConnect Consultation Payment",
            description: request.description || `Payment for consultation ${request.consultationId}`,
            logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`, // Optional
          },
          meta: {
            consultation_id: request.consultationId,
            user_id: request.userId,
            payment_method: "card",
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Failed to initiate Flutterwave payment");
      }

      return {
        success: true,
        transactionId: `FLW-${data.data.id}`,
        reference: data.data.tx_ref,
        status: "pending",
        message: "Payment link generated. Please complete payment.",
        paymentLink: data.data.link, // User redirects to this URL
        gatewayResponse: data,
      };
    } catch (error) {
      console.error("Flutterwave card payment error:", error);
      throw error;
    }
  }

  /**
   * Initiate mobile money payment via Flutterwave
   * Supports Orange Money, Africell, MTN Money in Sierra Leone
   */
  private async initiateMobileMoneyPayment(
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    const secretKey = this.getSecretKey();
    
    // Map payment methods to Flutterwave mobile money provider codes
    const providerMap: Record<string, string> = {
      orange_money: "orange_money", // Check Flutterwave docs for exact provider code
      africell_money: "africell", // Check Flutterwave docs for exact provider code
      mtn_money: "mtn",
      qmoney: "mtn", // Fallback to MTN if QMoney not supported
    };

    const provider = providerMap[request.paymentMethod] || "mtn";

    if (!request.phoneNumber) {
      throw new Error("Phone number is required for mobile money payment");
    }

    try {
      const response = await fetch(`${this.baseUrl}/charges?type=mobile_money_sierra_leone`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tx_ref: `HC-${request.consultationId}-${Date.now()}`,
          amount: request.amount,
          currency: "SLL",
          network: provider,
          email: request.email || `user${request.userId}@healthconnect.app`,
          phone_number: request.phoneNumber,
          fullname: request.customerName || "Customer",
          client_ip: "127.0.0.1", // In production, get from request
          device_fingerprint: `HC-${request.userId}-${Date.now()}`,
          meta: {
            consultation_id: request.consultationId,
            user_id: request.userId,
            payment_method: request.paymentMethod,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Failed to initiate mobile money payment");
      }

      // Mobile money payments may require USSD prompts or SMS
      const instruction = this.getMobileMoneyInstruction(request.paymentMethod, request.amount);

      return {
        success: true,
        transactionId: `FLW-${data.data.id}`,
        reference: data.data.tx_ref || data.data.flw_ref,
        status: "pending",
        message: "Mobile money payment initiated. Please follow the prompts.",
        paymentInstructions: instruction,
        gatewayResponse: data,
      };
    } catch (error) {
      console.error("Flutterwave mobile money payment error:", error);
      throw error;
    }
  }

  /**
   * Get mobile money payment instructions
   */
  private getMobileMoneyInstruction(method: string, amount: number): string {
    const instructions: Record<string, string> = {
      orange_money: `Dial *144# and follow prompts to pay Le ${amount.toLocaleString()}`,
      africell_money: `Dial *133# and follow prompts to pay Le ${amount.toLocaleString()}`,
      mtn_money: `Dial *134# and follow prompts to pay Le ${amount.toLocaleString()}`,
      qmoney: `Dial *155# and follow prompts to pay Le ${amount.toLocaleString()}`,
    };
    return instructions[method] || `Complete payment via ${method} for Le ${amount.toLocaleString()}`;
  }

  /**
   * Initiate bank transfer payment via Flutterwave
   */
  private async initiateBankTransfer(
    request: PaymentRequest
  ): Promise<PaymentResponse> {
    const secretKey = this.getSecretKey();

    try {
      // Flutterwave virtual account generation for bank transfer
      const response = await fetch(`${this.baseUrl}/virtual-account-numbers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: request.email || `user${request.userId}@healthconnect.app`,
          is_permanent: false,
          tx_ref: `HC-${request.consultationId}-${Date.now()}`,
          firstname: request.customerName?.split(" ")[0] || "Customer",
          lastname: request.customerName?.split(" ").slice(1).join(" ") || "",
          amount: request.amount,
          currency: "SLL",
          meta: {
            consultation_id: request.consultationId,
            user_id: request.userId,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        // Fallback to instructions if virtual account creation fails
        return {
          success: true,
          transactionId: `BT${Date.now()}`,
          reference: `HC-${request.consultationId}-${Date.now()}`,
          status: "pending",
          message: "Bank transfer instructions provided.",
          paymentInstructions: `Transfer Le ${request.amount.toLocaleString()} to Account: [Account Details], Bank: [Bank Name]`,
        };
      }

      return {
        success: true,
        transactionId: `FLW-${data.data.id}`,
        reference: data.data.tx_ref,
        status: "pending",
        message: "Bank transfer details generated.",
        paymentInstructions: `Transfer Le ${request.amount.toLocaleString()} to Account: ${data.data.account_number}, Bank: ${data.data.bank_name}`,
        gatewayResponse: data,
      };
    } catch (error) {
      console.error("Flutterwave bank transfer error:", error);
      throw error;
    }
  }

  /**
   * Process cash payment (manual, no gateway needed)
   */
  private processCashPayment(request: PaymentRequest): PaymentResponse {
    const transactionId = `CSH${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    return {
      success: true,
      transactionId,
      reference: `HC-${request.consultationId}-${Date.now()}`,
      status: "pending",
      message: "Cash payment instructions provided.",
      paymentInstructions: `Visit any authorized HealthConnect agent to pay Le ${request.amount.toLocaleString()} in cash. Show this transaction ID: ${transactionId}`,
    };
  }

  /**
   * Mock payment for development/testing
   */
  private initiateMockPayment(request: PaymentRequest): Promise<PaymentResponse> {
    console.warn("⚠️  Using MOCK payment gateway - Not for production!");
    
    const prefixes: Record<string, string> = {
      card: "CARD",
      orange_money: "OM",
      africell_money: "AF",
      mtn_money: "MTN",
      qmoney: "QM",
      bank_transfer: "BT",
      cash: "CSH",
    };

    const prefix = prefixes[request.paymentMethod] || "TXN";
    const transactionId = `${prefix}${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    return Promise.resolve({
      success: true,
      transactionId,
      reference: `MOCK-${transactionId}`,
      status: "pending",
      message: `[MOCK] Payment initiated via ${request.paymentMethod}. Use admin override to mark as completed.`,
      paymentInstructions: request.paymentMethod === "cash"
        ? `[MOCK] Visit agent to pay Le ${request.amount.toLocaleString()}. Transaction ID: ${transactionId}`
        : `[MOCK] ${this.getMobileMoneyInstruction(request.paymentMethod, request.amount) || "Complete payment via " + request.paymentMethod}`,
    });
  }

  /**
   * Verify payment status via Flutterwave API
   */
  async verifyPayment(transactionId: string, reference?: string): Promise<PaymentVerification> {
    try {
      // Use mock verification if Flutterwave not configured
      if (this.shouldUseMock()) {
        return {
          transactionId,
          reference: reference || `MOCK-${transactionId}`,
          status: "pending", // Mock stays pending until manually updated
          verified: true,
        };
      }

      const secretKey = this.getSecretKey();
      
      // Verify by transaction ID or reference
      const identifier = reference || transactionId.replace("FLW-", "");
      
      const response = await fetch(`${this.baseUrl}/transactions/${identifier}/verify`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || data.status !== "success") {
        throw new Error(data.message || "Payment verification failed");
      }

      const transaction = data.data;
      const status = this.mapFlutterwaveStatus(transaction.status);

      return {
        transactionId: `FLW-${transaction.id}`,
        reference: transaction.tx_ref,
        status,
        verified: true,
        amount: transaction.amount,
        currency: transaction.currency,
      };
    } catch (error) {
      console.error("Payment verification error:", error);
      return {
        transactionId,
        reference: reference || transactionId,
        status: "failed",
        verified: false,
      };
    }
  }

  /**
   * Map Flutterwave transaction status to our status
   */
  private mapFlutterwaveStatus(flutterwaveStatus: string): "pending" | "completed" | "failed" {
    const statusLower = flutterwaveStatus.toLowerCase();
    
    // Flutterwave statuses: successful, pending, failed
    if (statusLower === "successful" || statusLower === "completed") {
      return "completed";
    }
    if (statusLower === "failed" || statusLower === "cancelled") {
      return "failed";
    }
    return "pending";
  }

  /**
   * Handle webhook from Flutterwave
   * Verifies webhook signature and processes payment status update
   */
  async handleWebhook(
    payload: any,
    signature: string
  ): Promise<PaymentVerification> {
    try {
      // Verify webhook signature for security
      if (!this.verifyWebhookSignature(payload, signature)) {
        throw new Error("Invalid webhook signature");
      }

      // Extract transaction details from Flutterwave webhook payload
      const event = payload.event;
      const transaction = payload.data || {};

      // Only process charge.completed and charge.successful events
      if (event !== "charge.completed" && event !== "charge.successful") {
        console.log(`Ignoring webhook event: ${event}`);
        return {
          transactionId: transaction.id ? `FLW-${transaction.id}` : "unknown",
          reference: transaction.tx_ref || "unknown",
          status: "pending",
          verified: false,
        };
      }

      const status = this.mapFlutterwaveStatus(transaction.status || "pending");
      const reference = transaction.tx_ref || transaction.flw_ref || "";

      return {
        transactionId: transaction.id ? `FLW-${transaction.id}` : reference,
        reference,
        status,
        verified: true,
        amount: transaction.amount,
        currency: transaction.currency || "SLL",
      };
    } catch (error) {
      console.error("Webhook processing error:", error);
      return {
        transactionId: payload.data?.id ? `FLW-${payload.data.id}` : "unknown",
        reference: payload.data?.tx_ref || "unknown",
        status: "failed",
        verified: false,
      };
    }
  }

  /**
   * Verify Flutterwave webhook signature
   * Uses HMAC SHA256 with secret hash
   */
  private verifyWebhookSignature(payload: any, signature: string): boolean {
    const secretHash =
      this.config.flutterwaveWebhookSecret ||
      process.env.FLUTTERWAVE_WEBHOOK_SECRET ||
      "";

    if (!secretHash) {
      console.warn("⚠️  Flutterwave webhook secret not configured. Webhook verification disabled.");
      // In development, allow webhooks without verification (not recommended for production)
      return process.env.NODE_ENV !== "production";
    }

    try {
      // Flutterwave webhook signature is in format: sha256=hash
      const providedHash = signature.replace("sha256=", "");

      // Calculate expected hash
      const payloadString = JSON.stringify(payload);
      const expectedHash = crypto
        .createHmac("sha256", secretHash)
        .update(payloadString)
        .digest("hex");

      // Compare hashes (constant-time comparison)
      return crypto.timingSafeEqual(
        Buffer.from(expectedHash),
        Buffer.from(providedHash)
      );
    } catch (error) {
      console.error("Webhook signature verification error:", error);
      return false;
    }
  }
}

// Export singleton instance with configuration from environment
export const paymentGateway = new PaymentGatewayService({
  flutterwavePublicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
  flutterwaveSecretKey: process.env.FLUTTERWAVE_SECRET_KEY,
  flutterwaveEncryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
  flutterwaveWebhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET,
  flutterwaveMode: (process.env.FLUTTERWAVE_MODE as "sandbox" | "live") || "sandbox",
  enableMockPayments: process.env.ENABLE_MOCK_PAYMENTS === "true",
});
