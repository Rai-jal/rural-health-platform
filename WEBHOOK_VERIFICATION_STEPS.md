# Flutterwave Webhook Verification Steps

## ✅ Step 1: Verify Configuration

### Check Your .env.local

Make sure you have the webhook secret configured:

```bash
FLUTTERWAVE_WEBHOOK_SECRET=f49519c58093accf9994e9824dde9148f064dbf930c631dec09981638a4c0381
```

**Or alternatively:**
```bash
FLUTTERWAVE_SECRET_HASH=f49519c58093accf9994e9824dde9148f064dbf930c631dec09981638a4c0381
```

### Verify in Flutterwave Dashboard

1. Go to: https://dashboard.flutterwave.com
2. Settings → Webhooks
3. Find your webhook: `https://systematically-subspatulate-enrico.ngrok-free.app/api/webhooks/flutterwave`
4. Verify:
   - ✅ URL is correct
   - ✅ Secret Hash matches your `.env.local`
   - ✅ Events: `charge.completed` and `charge.successful` are selected
   - ✅ Status: Active/Enabled

---

## 🧪 Step 2: Test the Webhook Endpoint

### Test 1: Health Check (GET Request)

Open in browser or use curl:
```
https://systematically-subspatulate-enrico.ngrok-free.app/api/webhooks/flutterwave
```

**Expected Response:**
```json
{
  "message": "Flutterwave webhook endpoint is active",
  "endpoint": "/api/webhooks/flutterwave",
  "method": "POST",
  "requiredHeaders": ["verif-hash"],
  "environment": {
    "hasWebhookSecret": true,
    "hasSecretHash": true,
    "nodeEnv": "development"
  }
}
```

If you see this, the endpoint is working! ✅

---

## 🧪 Step 3: Test with Flutterwave Test Tool

### Option A: Use Flutterwave Dashboard Test Tool

1. Go to Flutterwave Dashboard → Settings → Webhooks
2. Find your webhook
3. Click **Test Webhook** or **Send Test** button
4. Select event: `charge.completed`
5. Click **Send** or **Test**

### What to Check:

**In Flutterwave Dashboard:**
- Check webhook delivery status
- Look for "Success" or "200 OK" response

**In Your Server Logs:**
You should see:
```
📥 Flutterwave webhook received: {
  event: 'charge.completed',
  hasSignature: true,
  timestamp: '2026-01-23T...'
}
✅ Webhook signature verified
✅ Payment status updated
```

**If you see errors:**
- Check signature verification
- Verify secret hash matches
- Check server logs for details

---

## 🧪 Step 4: Test with Real Payment Flow

### Complete Test Payment

1. **Start Your Server:**
   ```bash
   npm run dev
   # Make sure it's running on port 3000
   ```

2. **Keep ngrok Running:**
   ```bash
   # In another terminal, keep ngrok running:
   ngrok http 3000
   ```

3. **Create a Test Payment:**
   - Go to your app
   - Create a consultation
   - Initiate payment
   - Use Flutterwave test card:
     - **Card Number:** `5531886652142950`
     - **CVV:** `123`
     - **Expiry:** Any future date (e.g., `12/25`)
     - **Pin:** `3310`
     - **OTP:** `123456`

4. **Complete the Payment:**
   - Complete the payment flow
   - Payment should process

5. **Check Webhook Received:**
   - Watch your server logs
   - You should see webhook received immediately after payment

---

## ✅ Step 5: Verify Everything Works

### Check Server Logs

After webhook is triggered, you should see:

```
📥 Flutterwave webhook received: {
  event: 'charge.completed',
  hasSignature: true,
  ...
}
✅ Webhook signature verified
📊 Processing payment update: {
  txRef: 'HC-...',
  status: 'completed',
  ...
}
✅ Payment status updated: {
  paymentId: '...',
  oldStatus: 'pending',
  newStatus: 'completed',
  ...
}
✅ Consultation status updated to 'scheduled': {
  consultationId: '...'
}
✅ Payment confirmation notification sent
✅ Webhook processed successfully in XXXms
```

### Check Database

Run this SQL in Supabase:

```sql
-- Check recent payments
SELECT 
  id,
  transaction_id,
  payment_status,
  amount_leone,
  updated_at
FROM payments
ORDER BY updated_at DESC
LIMIT 5;

-- Should show payment_status = 'completed' for recent payment
```

```sql
-- Check consultation status
SELECT 
  id,
  status,
  scheduled_at,
  updated_at
FROM consultations
WHERE id IN (
  SELECT consultation_id 
  FROM payments 
  WHERE payment_status = 'completed'
  ORDER BY updated_at DESC
  LIMIT 1
);

-- Should show status = 'scheduled'
```

---

## 🐛 Troubleshooting

### Issue: Webhook Not Received

**Check:**
1. ✅ ngrok is running (`Session Status: online`)
2. ✅ Server is running (`npm run dev`)
3. ✅ URL in Flutterwave matches ngrok URL exactly
4. ✅ No typos in webhook URL

**Solution:**
- Restart ngrok if needed
- Verify URL in Flutterwave dashboard
- Check Flutterwave webhook logs for delivery status

### Issue: Signature Verification Failed

**Check:**
1. ✅ `FLUTTERWAVE_WEBHOOK_SECRET` in `.env.local`
2. ✅ Matches Secret Hash in Flutterwave dashboard
3. ✅ No extra spaces or characters

**Solution:**
- Copy secret hash from Flutterwave dashboard
- Paste into `.env.local`
- Restart server: `npm run dev`

### Issue: Payment Not Found

**Check:**
1. ✅ Payment exists in database
2. ✅ `transaction_id` in database matches Flutterwave `tx_ref`
3. ✅ Payment was created before webhook

**Solution:**
- Check server logs for "Payment not found" error
- Verify `transaction_id` matches
- Check similar payments in logs

### Issue: 404 Not Found

**Check:**
1. ✅ Server is running
2. ✅ Endpoint path is correct: `/api/webhooks/flutterwave`
3. ✅ No trailing slash

**Solution:**
- Verify server is running
- Test health check endpoint (GET request)
- Check route file exists: `app/api/webhooks/flutterwave/route.ts`

---

## 🎯 Success Indicators

You'll know it's working when:

1. ✅ Health check returns JSON (GET request works)
2. ✅ Flutterwave test webhook shows "Success"
3. ✅ Server logs show "Webhook signature verified"
4. ✅ Payment status updates to `completed` in database
5. ✅ Consultation status updates to `scheduled`
6. ✅ SMS/Email confirmation sent (if configured)

---

## 📝 Next Steps After Verification

Once webhook is working:

1. ✅ **Test Reminders:** Set up consultation reminders cron job
2. ✅ **Test Refunds:** Test payment refund functionality
3. ✅ **Test Reconciliation:** Run payment reconciliation job
4. ✅ **Production Setup:** Configure production webhook URL

---

**Status:** Ready to test! 🚀
