# Complete Testing Guide - Production Readiness

This guide provides step-by-step testing instructions for all production readiness tasks.

---

## 🧪 Testing Overview

### Prerequisites

1. **Server Running:**
   ```bash
   npm run dev
   ```

2. **Environment Variables Configured:**
   - Check `.env.local` has all required variables
   - See `PRODUCTION_SETUP_GUIDE.md` for complete list

3. **Database Access:**
   - Supabase SQL Editor access
   - Or database client

---

## 1. Test Flutterwave Webhooks

### Step 1: Start ngrok

```bash
ngrok http 3000
# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

### Step 2: Configure Webhook

1. Go to Flutterwave Dashboard → Settings → Webhooks (Test)
2. Add URL: `https://abc123.ngrok.io/api/webhooks/flutterwave`
3. Set secret: `f49519c58093accf9994e9824dde9148f064dbf930c631dec09981638a4c0381`
4. Save

### Step 3: Test Webhook

**Option A: Flutterwave Test Tool**
1. Dashboard → Webhooks → Test Webhook
2. Select `charge.completed`
3. Click **Send Test**

**Option B: Complete Test Payment**
1. Create payment in app
2. Use test card: `5531886652142950`
3. Complete payment

### Step 4: Verify

**Check Server Logs:**
```bash
# Should see:
📥 Flutterwave webhook received
✅ Webhook signature verified
✅ Payment status updated
✅ Consultation status updated to 'scheduled'
```

**Check Database:**
```sql
SELECT 
  id,
  transaction_id,
  payment_status,
  updated_at
FROM payments
WHERE payment_status = 'completed'
ORDER BY updated_at DESC
LIMIT 1;
```

**Expected Result:**
- Payment status: `completed`
- Consultation status: `scheduled`
- Notification sent

---

## 2. Test Consultation Reminders

### Step 1: Create Test Consultation

```sql
-- Create consultation scheduled 1 hour from now
INSERT INTO consultations (
  user_id,
  consultation_type,
  status,
  scheduled_at,
  cost_leone
)
SELECT 
  (SELECT id FROM users WHERE role = 'Patient' LIMIT 1),
  'voice',
  'scheduled',
  NOW() + INTERVAL '1 hour',
  10000
RETURNING id, scheduled_at;
```

### Step 2: Trigger Reminder Job

**Option A: Manual Trigger**
```bash
curl http://localhost:3000/api/jobs/send-reminders

# With authentication:
curl -H "Authorization: Bearer your-cron-secret" \
  http://localhost:3000/api/jobs/send-reminders
```

**Option B: Wait for Cron**
- If cron is set up, wait for next hour
- Or adjust consultation time to trigger sooner

### Step 3: Verify

**Check Server Logs:**
```bash
# Should see:
🔍 Searching for consultations scheduled between...
📋 Found 1 consultation(s) to remind
✅ Patient reminder sent for consultation {id}
✅ Provider reminder sent for consultation {id}
✅ Reminder job completed
```

**Check SMS:**
- Patient should receive SMS
- Provider should receive SMS
- Check Twilio Console → Monitor → Logs

**Check Email:**
- Patient should receive email
- Provider should receive email
- Check SendGrid Dashboard → Activity

---

## 3. Test SMS Verification

### Step 1: Edit Test Script

Edit `scripts/test-sms-verification.ts`:
```typescript
const TEST_PHONE_NUMBERS = [
  "+232123456789",  // Add your test numbers
  "+232987654321",
];
```

### Step 2: Run Script

```bash
npx tsx scripts/test-sms-verification.ts
```

### Step 3: Verify Results

**Check Output:**
```
✅ Successful: +232123456789 (Message ID: SM...)
❌ Failed: +232987654321
   Error: Phone number not verified (trial account restriction)
```

**Check Twilio Console:**
- Go to: https://console.twilio.com/us1/monitor/logs/messaging
- Verify delivery status
- Check for errors

**Fix Trial Restrictions:**
- Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
- Add failed phone numbers
- Re-run script

---

## 4. Test Email Service

### Step 1: Configure SendGrid

1. Sign up: https://sendgrid.com
2. Get API key: Dashboard → Settings → API Keys
3. Verify sender: Settings → Sender Authentication

### Step 2: Add to .env.local

```bash
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_EMAIL=your-verified-email@domain.com
SENDGRID_FROM_NAME=HealthConnect
```

### Step 3: Test Email

**Create Test API Route:**

Create `app/api/test/email/route.ts`:
```typescript
import { sendEmail } from '@/lib/notifications/email-helper';

export async function GET() {
  const result = await sendEmail({
    to: 'your-email@example.com',
    subject: 'Test Email',
    body: '<h1>Test</h1><p>This is a test email.</p>'
  });
  
  return Response.json(result);
}
```

**Test:**
```bash
curl http://localhost:3000/api/test/email
```

### Step 4: Verify

**Check SendGrid Dashboard:**
- Activity → Verify email sent
- Check delivery status

**Check Email Inbox:**
- Verify email received
- Check formatting

**Check Server Logs:**
```bash
📧 Sending email: { to: '...', subject: '...' }
✅ Email sent successfully: { messageId: '...' }
```

---

## 5. Test Payment Refunds

### Step 1: Create Test Payment

1. Create a consultation
2. Create payment for consultation
3. Mark payment as `completed` (or wait for webhook)

### Step 2: Process Refund

**Via Admin Dashboard:**
1. Go to `/admin/payments`
2. Find completed payment
3. Click **View** (eye icon)
4. Click **Process Refund**
5. Confirm

**Via API:**
```bash
curl -X POST \
  -H "Authorization: Bearer {admin_token}" \
  http://localhost:3000/api/admin/payments/{payment_id}/refund
```

### Step 3: Verify

**Check Server Logs:**
```bash
🔄 Processing refund via Flutterwave
✅ Refund processed successfully
✅ Refund processed successfully: { refundId: '...' }
```

**Check Database:**
```sql
SELECT 
  id,
  payment_status,
  updated_at
FROM payments
WHERE id = '{payment_id}';
-- Should show: payment_status = 'refunded'
```

**Check Flutterwave Dashboard:**
- Transactions → Find transaction
- Verify refund status

---

## 6. Test Payment Reconciliation

### Step 1: Trigger Reconciliation

```bash
# Without auto-fix (review only)
curl http://localhost:3000/api/jobs/reconcile-payments

# With auto-fix (applies fixes)
curl -H "x-auto-fix: true" \
  http://localhost:3000/api/jobs/reconcile-payments
```

### Step 2: Review Results

**Check Response:**
```json
{
  "result": {
    "totalFlutterwaveTransactions": 10,
    "totalDatabasePayments": 8,
    "matched": 7,
    "discrepancies": {
      "missingInDatabase": [...],
      "statusMismatches": [...]
    }
  }
}
```

### Step 3: Verify Fixes

**If auto-fix enabled:**
```sql
-- Check if status mismatches were fixed
SELECT 
  id,
  transaction_id,
  payment_status,
  updated_at
FROM payments
WHERE updated_at > NOW() - INTERVAL '5 minutes';
```

---

## 🔍 End-to-End Test Flow

### Complete Payment Flow Test

1. **Create Consultation:**
   - Patient creates consultation
   - Admin assigns provider
   - Patient confirms

2. **Create Payment:**
   - Patient initiates payment
   - Payment created (status: `pending`)
   - SMS/Email confirmation sent

3. **Complete Payment:**
   - Complete payment on Flutterwave
   - Webhook received
   - Payment status: `completed`
   - Consultation status: `scheduled`
   - SMS/Email confirmation sent

4. **Send Reminder:**
   - Wait for reminder job (or trigger manually)
   - SMS reminder sent
   - Email reminder sent

5. **Process Refund (if needed):**
   - Admin processes refund
   - Refund completed
   - Payment status: `refunded`

6. **Reconcile Payments:**
   - Run reconciliation
   - Verify all payments match

---

## ✅ Verification Checklist

### Webhooks
- [ ] Webhook URL configured in Flutterwave
- [ ] Webhook secret matches
- [ ] Test webhook received
- [ ] Payment status updated
- [ ] Consultation status updated
- [ ] Notifications sent

### Reminders
- [ ] Cron job configured
- [ ] Reminder job runs
- [ ] SMS reminders sent
- [ ] Email reminders sent
- [ ] Logs show success

### SMS
- [ ] Test script runs
- [ ] SMS delivered
- [ ] No trial restrictions (or numbers verified)
- [ ] Twilio logs show delivery

### Email
- [ ] SendGrid configured
- [ ] Test email sent
- [ ] Email received
- [ ] SendGrid shows delivery

### Refunds
- [ ] Refund processed
- [ ] Database updated
- [ ] Flutterwave shows refund
- [ ] No errors in logs

### Reconciliation
- [ ] Reconciliation runs
- [ ] Discrepancies identified
- [ ] Fixes applied (if auto-fix)
- [ ] Logs show results

---

## 🐛 Troubleshooting

### Webhook Issues

**Not receiving webhooks:**
- Check ngrok is running
- Verify URL in Flutterwave
- Check server logs for errors

**Signature verification fails:**
- Verify `FLUTTERWAVE_WEBHOOK_SECRET` matches Flutterwave
- Check `verif-hash` header present

### Reminder Issues

**Reminders not sending:**
- Check cron job is running
- Verify consultations exist
- Check user phone numbers/emails
- Review notification preferences

### SMS Issues

**SMS not delivering:**
- Verify phone numbers in Twilio
- Check trial account restrictions
- Review Twilio error codes

### Email Issues

**Email not sending:**
- Verify SendGrid API key
- Check sender email verified
- Review SendGrid activity logs

---

**Status:** ✅ **ALL TESTING GUIDES PROVIDED**  
**Next:** Follow testing steps for each component
