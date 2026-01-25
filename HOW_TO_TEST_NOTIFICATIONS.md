# How to Test SMS Notifications

## 🧪 Step-by-Step Testing Guide

---

## Step 1: Get a Consultation ID

You need a consultation ID to test. Get one from your database:

### Option A: Use Supabase SQL Editor

```sql
-- Get a consultation ID for testing
SELECT 
  id as consultation_id,
  user_id,
  status,
  consultation_type,
  created_at
FROM consultations
WHERE user_id = '92cbf80c-97a3-4470-aac0-f359b98accd1'
ORDER BY created_at DESC
LIMIT 1;
```

**Copy the `consultation_id` value** (it's a UUID like `abc123-def456-...`)

### Option B: Create a New Consultation

1. Log in to your app
2. Book a consultation
3. After booking, check the URL or database for the consultation ID

---

## Step 2: Make Sure Your Server is Running

```bash
# In your terminal, make sure the server is running:
cd health-connect
npm run dev
```

**Wait for:**
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

---

## Step 3: Run the Test Command

### Replace `CONSULTATION_ID` with the actual ID from Step 1

```bash
curl "http://localhost:3000/api/test/notify?userId=92cbf80c-97a3-4470-aac0-f359b98accd1&consultationId=YOUR_CONSULTATION_ID_HERE&amount=10000"
```

**Example:**
```bash
curl "http://localhost:3000/api/test/notify?userId=92cbf80c-97a3-4470-aac0-f359b98accd1&consultationId=abc123-def456-ghi789&amount=10000"
```

---

## Step 4: Check the Response

### ✅ Success Response

You should see JSON like this:

```json
{
  "success": true,
  "message": "Notification sent",
  "diagnostics": {
    "user": {
      "id": "92cbf80c-97a3-4470-aac0-f359b98accd1",
      "name": "Rai Jay",
      "phoneNumber": "+23272860043",
      "email": "jallohraihanna123@gmail.com",
      "notificationPreferences": "sms"
    },
    "phoneNumberValid": true,
    "canSendSMS": true,
    "canSendEmail": false
  },
  "note": "Check server logs for detailed SMS/Email delivery status"
}
```

### ❌ Error Response

If you see an error, check:
- Is the server running?
- Is the consultation ID correct?
- Is the user ID correct?

---

## Step 5: Check Server Logs

After running the command, check your server terminal. You should see:

```
✅ Payment confirmation notification sent
SMS notification sent successfully (payment confirmation): {
  consultationId: "...",
  amount: 10000,
  messageId: "SM..."
}
```

**If you see:**
```
SMS not sent for payment confirmation: {
  reason: "..."
}
```

Then check the reason and fix it.

---

## Step 6: Check Twilio Console

1. Go to: https://console.twilio.com/us1/monitor/logs/messaging
2. Look for the most recent message
3. Check:
   - **To:** Should be `+23272860043`
   - **Status:** Should be "delivered" or "sent"
   - **Message SID:** Should start with `SM...`

---

## Step 7: Check Your Phone

**Check your phone** (`+23272860043`) for the SMS message!

You should receive:
```
Payment Confirmed

Amount: 10000 SLL
Consultation: [consultation type]

Your consultation is now confirmed.
```

---

## 🐛 Troubleshooting

### Issue: "Consultation not found"

**Fix:** Make sure the consultation ID exists:
```sql
SELECT id FROM consultations WHERE id = 'YOUR_CONSULTATION_ID';
```

### Issue: "User not found"

**Fix:** Check the user ID:
```sql
SELECT id, email FROM users WHERE id = '92cbf80c-97a3-4470-aac0-f359b98accd1';
```

### Issue: SMS not sent

**Check:**
1. Phone number format (should be `+23272860043`)
2. Twilio credentials in `.env.local`
3. Server logs for error messages

### Issue: Server not responding

**Fix:**
1. Make sure server is running: `npm run dev`
2. Check if port 3000 is available
3. Try: `curl http://localhost:3000/api/whoami`

---

## 🎯 Quick Test (All in One)

### 1. Get Consultation ID
```sql
SELECT id FROM consultations 
WHERE user_id = '92cbf80c-97a3-4470-aac0-f359b98accd1' 
ORDER BY created_at DESC LIMIT 1;
```

### 2. Run Test
```bash
curl "http://localhost:3000/api/test/notify?userId=92cbf80c-97a3-4470-aac0-f359b98accd1&consultationId=PASTE_CONSULTATION_ID_HERE&amount=10000"
```

### 3. Check Results
- ✅ Response shows `"success": true`
- ✅ Server logs show "SMS notification sent successfully"
- ✅ Twilio Console shows message sent
- ✅ Phone receives SMS

---

## 📱 Alternative: Test with Real Payment

Instead of using the test endpoint, you can test with a real payment:

1. **Create a payment** in your app
2. **Complete the payment**
3. **Check server logs** for notification
4. **Check Twilio Console** for SMS
5. **Check your phone** for the message

This tests the complete flow!

---

**Ready to test?** Follow the steps above! 🚀
