# Next Steps After Phone Numbers Are Fixed

## ✅ What We've Fixed

1. ✅ Database trigger now copies phone numbers from signup
2. ✅ Consultation booking saves phone numbers automatically
3. ✅ Phone number formatting (E.164 format)
4. ✅ Duplicate handling in migrations

---

## 🧪 Step 1: Verify Phone Numbers Are Working

### Test 1: Check Database

```sql
-- Verify phone numbers are in correct format
SELECT 
  id,
  email,
  phone_number,
  CASE 
    WHEN phone_number IS NULL THEN '❌ Missing'
    WHEN phone_number NOT LIKE '+%' THEN '⚠️ Invalid format (needs +232...)'
    WHEN phone_number !~ '^\+232[0-9]{9}$' THEN '⚠️ Wrong format'
    ELSE '✅ Valid'
  END as status
FROM users
WHERE phone_number IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:** All should show `✅ Valid`

---

## 🧪 Step 2: Test Complete Payment Flow

### Test End-to-End Payment with SMS

1. **Create a Test Payment:**
   - Log in as a user with a valid phone number
   - Create a consultation
   - Initiate payment

2. **Complete Payment:**
   - Use Flutterwave test card: `5531886652142950`
   - Complete payment

3. **Check Server Logs:**
   ```bash
   # Look for:
   ✅ Payment confirmation notification sent on payment creation
   SMS notification sent successfully (payment confirmation): { messageId: "SM..." }
   ```

4. **Verify SMS Sent:**
   - Check Twilio Console: https://console.twilio.com/us1/monitor/logs/messaging
   - Should see SMS delivery status

5. **Check Database:**
   ```sql
   -- Verify payment was created
   SELECT 
     id,
     payment_status,
     amount_leone,
     created_at
   FROM payments
   ORDER BY created_at DESC
   LIMIT 1;
   ```

---

## 🧪 Step 3: Test SMS Notifications

### Test 1: Manual Notification Test

```bash
# Test notification for specific user
curl "http://localhost:3000/api/test/notify?userId=YOUR_USER_ID&consultationId=CONSULTATION_ID&amount=10000"
```

**Check response:**
- Should show `"success": true`
- Should show diagnostic info about phone number

### Test 2: Run Diagnostic Script

```bash
# Check system configuration and user setup
npx tsx scripts/diagnose-notifications.ts YOUR_USER_ID
```

**Expected output:**
- ✅ SMS Configuration: Configured
- ✅ User Phone Number: Valid E.164
- ✅ Notification Preferences: SMS enabled
- ✅ SMS Service: Working

---

## 🧪 Step 4: Test Consultation Booking

### Test That Phone Number Is Saved

1. **Book a Consultation:**
   - Log in as user
   - Go to consultation booking page
   - Enter phone number in form
   - Submit

2. **Verify Phone Number Saved:**
   ```sql
   -- Check if phone number was updated
   SELECT 
     id,
     email,
     phone_number,
     updated_at
   FROM users
   WHERE id = 'YOUR_USER_ID';
   ```

3. **Check Server Logs:**
   ```bash
   # Should see:
   ✅ User profile updated from consultation form: { phoneUpdated: true, nameUpdated: true }
   ```

---

## 🧪 Step 5: Test Webhook (If Configured)

### Test Flutterwave Webhook

1. **Complete Test Payment:**
   - Create payment
   - Complete on Flutterwave

2. **Check Webhook Received:**
   ```bash
   # Server logs should show:
   📥 Flutterwave webhook received
   ✅ Webhook signature verified
   ✅ Payment status updated
   ✅ Consultation status updated to 'scheduled'
   ✅ Payment confirmation notification sent
   ```

3. **Verify Database:**
   ```sql
   -- Payment should be completed
   SELECT 
     id,
     payment_status,
     updated_at
   FROM payments
   ORDER BY updated_at DESC
   LIMIT 1;
   -- Should show: payment_status = 'completed'
   ```

---

## 📋 Step 6: Production Readiness Checklist

### SMS/Notifications
- [ ] Phone numbers are in E.164 format (+232XXXXXXXXX)
- [ ] SMS test notifications work
- [ ] Payment confirmation SMS sent successfully
- [ ] Twilio account configured (not trial restrictions)
- [ ] Phone numbers verified in Twilio (if trial account)

### Payments
- [ ] Flutterwave webhook configured
- [ ] Webhook signature verification working
- [ ] Payment status updates correctly
- [ ] Payment confirmations sent

### Database
- [ ] All users have phone numbers (or can add them)
- [ ] Phone numbers are unique (no duplicates)
- [ ] Database trigger working for new signups

### Testing
- [ ] End-to-end payment flow tested
- [ ] SMS notifications tested
- [ ] Consultation booking saves phone numbers
- [ ] Webhook processing tested

---

## 🚀 Step 7: What to Do Next

### Immediate Next Steps

1. **Test Everything:**
   - Run all tests above
   - Verify SMS notifications work
   - Test payment flow end-to-end

2. **Fix Any Issues:**
   - If SMS not sending, check Twilio configuration
   - If webhook not working, check Flutterwave setup
   - If phone numbers missing, users can add via profile

3. **Monitor:**
   - Check server logs for errors
   - Monitor Twilio delivery status
   - Check Flutterwave webhook logs

### Production Deployment

1. **Environment Variables:**
   - Set all production environment variables
   - Use production Flutterwave keys
   - Use production Twilio account

2. **Webhook Configuration:**
   - Update Flutterwave webhook URL to production domain
   - Test webhook in production

3. **Cron Jobs:**
   - Set up consultation reminders cron
   - Set up payment reconciliation cron

4. **Monitoring:**
   - Set up error tracking (Sentry)
   - Monitor SMS delivery rates
   - Monitor payment success rates

---

## 📊 Step 8: Verify System Health

### Run Complete System Check

```bash
# Check all components
npx tsx scripts/diagnose-notifications.ts

# Test webhook endpoint
curl https://your-domain.com/api/webhooks/flutterwave

# Test reminder job
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.com/api/jobs/send-reminders
```

---

## 🎯 Summary: What's Next

### ✅ Completed
- Phone number storage fixed
- Database trigger updated
- Consultation booking saves phone numbers
- Payment confirmation notifications implemented

### 🔄 Next Actions
1. **Test SMS notifications** - Verify they're being sent
2. **Test payment flow** - Complete end-to-end test
3. **Test webhook** - Verify Flutterwave webhook works
4. **Production setup** - Configure production environment
5. **Monitor** - Set up monitoring and alerts

---

## 🆘 If Something's Not Working

### SMS Not Sending?
- Check: `MESSAGE_DIAGNOSIS_FIX.md`
- Run: `npx tsx scripts/diagnose-notifications.ts USER_ID`

### Webhook Not Working?
- Check: `QUICK_WEBHOOK_TEST.md`
- Verify: ngrok URL and Flutterwave configuration

### Phone Numbers Still Missing?
- Check: `FIX_MISSING_PHONE_NUMBERS.md`
- Users can add via profile or consultation booking

---

**Status:** Ready to test! Run the tests above to verify everything works. 🚀
