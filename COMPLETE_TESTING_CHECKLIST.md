# Complete Testing Checklist - After Phone Number Fix

## 🎯 Goal
Verify that the entire system works end-to-end after phone number fixes.

---

## ✅ Phase 1: Verify Phone Numbers

### Test 1.1: Check Database Format
```sql
SELECT 
  COUNT(*) FILTER (WHERE phone_number IS NOT NULL) as with_phone,
  COUNT(*) FILTER (WHERE phone_number LIKE '+232%') as valid_format,
  COUNT(*) FILTER (WHERE phone_number IS NULL) as missing
FROM users;
```
**Expected:** Most users should have valid format phone numbers

### Test 1.2: Check Specific User
```sql
SELECT 
  id,
  email,
  phone_number,
  notification_preferences
FROM users
WHERE id = 'YOUR_USER_ID';
```
**Expected:** Phone number in format `+232XXXXXXXXX`

---

## ✅ Phase 2: Test SMS Notifications

### Test 2.1: Manual Notification Test
```bash
curl "http://localhost:3000/api/test/notify?userId=USER_ID&consultationId=CONSULTATION_ID&amount=10000"
```

**Check:**
- Response shows `"success": true`
- Diagnostic shows phone number is valid
- Server logs show "SMS notification sent successfully"

### Test 2.2: Diagnostic Script
```bash
npx tsx scripts/diagnose-notifications.ts USER_ID
```

**Expected:**
- ✅ SMS Configuration: Configured
- ✅ User Phone Number: Valid E.164
- ✅ SMS Service: Working

### Test 2.3: Check Twilio Console
- Go to: https://console.twilio.com/us1/monitor/logs/messaging
- Verify SMS was sent
- Check delivery status

---

## ✅ Phase 3: Test Payment Flow

### Test 3.1: Create Payment
1. Log in as user
2. Create consultation
3. Initiate payment
4. Complete payment with test card: `5531886652142950`

### Test 3.2: Verify Payment Confirmation
**Check Server Logs:**
```bash
✅ Payment confirmation notification sent on payment creation
SMS notification sent successfully (payment confirmation)
```

**Check Database:**
```sql
SELECT 
  id,
  payment_status,
  amount_leone,
  created_at
FROM payments
ORDER BY created_at DESC
LIMIT 1;
```

**Check Twilio:**
- SMS should be delivered
- Check delivery status

---

## ✅ Phase 4: Test Consultation Booking

### Test 4.1: Book Consultation with Phone Number
1. Log in as user
2. Go to consultation booking
3. Enter phone number in form
4. Submit

### Test 4.2: Verify Phone Number Saved
```sql
SELECT 
  id,
  email,
  phone_number,
  updated_at
FROM users
WHERE id = 'USER_ID';
```

**Expected:** Phone number should be updated

**Check Server Logs:**
```bash
✅ User profile updated from consultation form
```

---

## ✅ Phase 5: Test Webhook (If Configured)

### Test 5.1: Complete Payment
1. Create payment
2. Complete on Flutterwave

### Test 5.2: Verify Webhook
**Check Server Logs:**
```bash
📥 Flutterwave webhook received
✅ Webhook signature verified
✅ Payment status updated
✅ Consultation status updated
✅ Payment confirmation notification sent
```

**Check Database:**
```sql
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

## ✅ Phase 6: Test New User Signup

### Test 6.1: Create New Account
1. Sign up with phone number
2. Verify account created

### Test 6.2: Check Phone Number Saved
```sql
SELECT 
  id,
  email,
  phone_number
FROM users
WHERE email = 'new-user@example.com';
```

**Expected:** Phone number should be saved automatically

---

## 📊 Final Verification

### Check System Health
```bash
# Run diagnostic
npx tsx scripts/diagnose-notifications.ts

# Test endpoints
curl http://localhost:3000/api/whoami
curl http://localhost:3000/api/webhooks/flutterwave
```

### Check All Components
- [ ] Phone numbers saved correctly
- [ ] SMS notifications working
- [ ] Payment confirmations sent
- [ ] Consultation booking saves phone numbers
- [ ] Webhook processing (if configured)
- [ ] New signups save phone numbers

---

## 🎉 Success Criteria

**Everything is working if:**
1. ✅ Phone numbers are in database (E.164 format)
2. ✅ SMS notifications are sent successfully
3. ✅ Payment confirmations work
4. ✅ Consultation booking saves phone numbers
5. ✅ New signups save phone numbers automatically
6. ✅ No errors in server logs

---

## 🚀 Next: Production Deployment

Once all tests pass:
1. Set production environment variables
2. Configure production webhooks
3. Set up cron jobs
4. Monitor system health

---

**Status:** Ready to test! Follow this checklist step by step. ✅
