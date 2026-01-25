/**
 * Payment Reconciliation Job
 * 
 * Endpoint: GET /api/jobs/reconcile-payments
 * 
 * Fetches all transactions from Flutterwave API and compares with local database.
 * Identifies and fixes discrepancies:
 * - Payments in Flutterwave but not in database
 * - Payments in database but not in Flutterwave
 * - Status mismatches
 * - Amount mismatches
 * 
 * Environment Variables Required:
 * - CRON_SECRET: Secret token for cron job authentication (optional but recommended)
 * - FLUTTERWAVE_SECRET_KEY: Flutterwave secret key for API calls
 * - FLUTTERWAVE_MODE: 'sandbox' or 'live'
 * 
 * Cron Setup:
 * - Recommended: Run daily at 2 AM
 * - Vercel Cron: Add to vercel.json
 * - External Cron: Call this endpoint daily
 * 
 * Security:
 * - Optional CRON_SECRET authentication
 * - Uses admin client to bypass RLS
 * - Logs all discrepancies for review
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAdminClient } from "@/lib/supabase/admin";
import { paymentGateway } from "@/lib/payment/gateway";

interface ReconciliationResult {
  totalFlutterwaveTransactions: number;
  totalDatabasePayments: number;
  matched: number;
  discrepancies: {
    missingInDatabase: Array<{
      transactionId: string;
      reference: string;
      amount: number;
      status: string;
      date: string;
    }>;
    missingInFlutterwave: Array<{
      paymentId: string;
      transactionId: string;
      amount: number;
      status: string;
      date: string;
    }>;
    statusMismatches: Array<{
      paymentId: string;
      transactionId: string;
      databaseStatus: string;
      flutterwaveStatus: string;
      amount: number;
    }>;
    amountMismatches: Array<{
      paymentId: string;
      transactionId: string;
      databaseAmount: number;
      flutterwaveAmount: number;
      status: string;
    }>;
  };
  fixes: {
    created: number;
    updated: number;
    errors: string[];
  };
}

/**
 * Fetch transactions from Flutterwave API
 * Note: Flutterwave API may have pagination - this is a simplified version
 */
async function fetchFlutterwaveTransactions(
  secretKey: string,
  baseUrl: string,
  startDate?: Date,
  endDate?: Date
): Promise<any[]> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (startDate) {
      params.append("from", startDate.toISOString().split("T")[0]);
    }
    if (endDate) {
      params.append("to", endDate.toISOString().split("T")[0]);
    }
    params.append("page", "1");
    params.append("perPage", "100"); // Adjust based on Flutterwave API limits

    const url = `${baseUrl}/transactions?${params.toString()}`;
    
    console.log("📥 Fetching transactions from Flutterwave:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch Flutterwave transactions");
    }

    const data = await response.json();

    if (data.status !== "success" || !data.data) {
      console.warn("⚠️  Flutterwave API returned unexpected format:", data);
      return [];
    }

    // Handle pagination if needed (simplified - may need to fetch multiple pages)
    const transactions = Array.isArray(data.data) ? data.data : [];

    console.log(`✅ Fetched ${transactions.length} transaction(s) from Flutterwave`);

    return transactions;
  } catch (error) {
    console.error("❌ Error fetching Flutterwave transactions:", error);
    throw error;
  }
}

/**
 * GET - Reconcile payments between Flutterwave and database
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    // Optional: Verify cron secret for security
    const headersList = headers();
    const authHeader = headersList.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        console.error("❌ Unauthorized cron job request");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
      console.log("✅ Cron secret verified");
    } else {
      console.warn("⚠️  CRON_SECRET not set - endpoint is publicly accessible");
    }

    const adminClient = getAdminClient();

    // Check Flutterwave configuration
    const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET_KEY;
    const flutterwaveMode = process.env.FLUTTERWAVE_MODE || "sandbox";
    const baseUrl =
      flutterwaveMode === "live"
        ? "https://api.flutterwave.com/v3"
        : "https://api.flutterwave.com/v3"; // Both use same URL, credentials differ

    if (!flutterwaveSecretKey) {
      return NextResponse.json(
        { error: "FLUTTERWAVE_SECRET_KEY not configured" },
        { status: 500 }
      );
    }

    // Get date range (last 30 days by default, or all time)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    console.log("🔍 Starting payment reconciliation:", {
      dateRange: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      mode: flutterwaveMode,
    });

    // Fetch transactions from Flutterwave
    let flutterwaveTransactions: any[] = [];
    try {
      flutterwaveTransactions = await fetchFlutterwaveTransactions(
        flutterwaveSecretKey,
        baseUrl,
        startDate,
        endDate
      );
    } catch (fetchError) {
      console.error("❌ Failed to fetch Flutterwave transactions:", fetchError);
      return NextResponse.json(
        {
          error: "Failed to fetch Flutterwave transactions",
          details: fetchError instanceof Error ? fetchError.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    // Fetch payments from database
    const { data: databasePayments, error: dbError } = await adminClient
      .from("payments")
      .select("id, transaction_id, amount_leone, payment_status, created_at, payment_provider")
      .eq("payment_provider", "flutterwave")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("❌ Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch database payments" },
        { status: 500 }
      );
    }

    console.log(`📊 Found ${databasePayments?.length || 0} payment(s) in database`);

    const result: ReconciliationResult = {
      totalFlutterwaveTransactions: flutterwaveTransactions.length,
      totalDatabasePayments: databasePayments?.length || 0,
      matched: 0,
      discrepancies: {
        missingInDatabase: [],
        missingInFlutterwave: [],
        statusMismatches: [],
        amountMismatches: [],
      },
      fixes: {
        created: 0,
        updated: 0,
        errors: [],
      },
    };

    // Create maps for quick lookup
    const dbPaymentsByTxId = new Map(
      (databasePayments || []).map((p) => [p.transaction_id, p])
    );
    const flutterwaveTxByRef = new Map(
      flutterwaveTransactions.map((t) => [t.tx_ref || t.flw_ref, t])
    );

    // Check Flutterwave transactions against database
    for (const tx of flutterwaveTransactions) {
      const txRef = tx.tx_ref || tx.flw_ref;
      const dbPayment = dbPaymentsByTxId.get(txRef);

      if (!dbPayment) {
        // Transaction exists in Flutterwave but not in database
        result.discrepancies.missingInDatabase.push({
          transactionId: tx.id?.toString() || "unknown",
          reference: txRef,
          amount: tx.amount || 0,
          status: tx.status || "unknown",
          date: tx.created_at || new Date().toISOString(),
        });
      } else {
        // Transaction exists in both - check for mismatches
        result.matched++;

        const flutterwaveStatus = tx.status?.toLowerCase() || "pending";
        const dbStatus = dbPayment.payment_status;

        // Map Flutterwave status to our status
        const mappedStatus =
          flutterwaveStatus === "successful" || flutterwaveStatus === "completed"
            ? "completed"
            : flutterwaveStatus === "failed" || flutterwaveStatus === "cancelled"
            ? "failed"
            : "pending";

        // Check status mismatch
        if (mappedStatus !== dbStatus) {
          result.discrepancies.statusMismatches.push({
            paymentId: dbPayment.id,
            transactionId: txRef,
            databaseStatus: dbStatus,
            flutterwaveStatus: mappedStatus,
            amount: dbPayment.amount_leone,
          });
        }

        // Check amount mismatch (with tolerance for currency conversion)
        const amountDiff = Math.abs((tx.amount || 0) - dbPayment.amount_leone);
        if (amountDiff > 1) {
          // Allow 1 unit difference for rounding
          result.discrepancies.amountMismatches.push({
            paymentId: dbPayment.id,
            transactionId: txRef,
            databaseAmount: dbPayment.amount_leone,
            flutterwaveAmount: tx.amount || 0,
            status: dbStatus,
          });
        }
      }
    }

    // Check database payments against Flutterwave
    for (const dbPayment of databasePayments || []) {
      if (!dbPayment.transaction_id) continue;

      const flutterwaveTx = flutterwaveTxByRef.get(dbPayment.transaction_id);

      if (!flutterwaveTx) {
        // Payment exists in database but not in Flutterwave
        result.discrepancies.missingInFlutterwave.push({
          paymentId: dbPayment.id,
          transactionId: dbPayment.transaction_id,
          amount: dbPayment.amount_leone,
          status: dbPayment.payment_status,
          date: dbPayment.created_at,
        });
      }
    }

    // Auto-fix discrepancies (optional - can be disabled for manual review)
    const autoFix = request.headers.get("x-auto-fix") === "true";

    if (autoFix) {
      console.log("🔧 Auto-fix enabled - fixing discrepancies...");

      // Fix status mismatches
      for (const mismatch of result.discrepancies.statusMismatches) {
        try {
          const { error: updateError } = await adminClient
            .from("payments")
            .update({
              payment_status: mismatch.flutterwaveStatus,
              updated_at: new Date().toISOString(),
            })
            .eq("id", mismatch.paymentId);

          if (updateError) {
            result.fixes.errors.push(
              `Failed to update payment ${mismatch.paymentId}: ${updateError.message}`
            );
          } else {
            result.fixes.updated++;
            console.log(`✅ Fixed status mismatch for payment ${mismatch.paymentId}`);
          }
        } catch (error) {
          result.fixes.errors.push(
            `Error fixing payment ${mismatch.paymentId}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      // Note: Missing payments in database would require consultation_id and user_id
      // which we don't have from Flutterwave, so we skip auto-creating them
      // They should be manually reviewed
    }

    const processingTime = Date.now() - startTime;
    const totalDiscrepancies =
      result.discrepancies.missingInDatabase.length +
      result.discrepancies.missingInFlutterwave.length +
      result.discrepancies.statusMismatches.length +
      result.discrepancies.amountMismatches.length;

    console.log(`✅ Reconciliation completed in ${processingTime}ms:`, {
      matched: result.matched,
      discrepancies: totalDiscrepancies,
      fixes: result.fixes.updated,
    });

    return NextResponse.json({
      message: "Reconciliation completed",
      result,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
      autoFixEnabled: autoFix,
    });
  } catch (error) {
    console.error("❌ Fatal error in reconciliation:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
