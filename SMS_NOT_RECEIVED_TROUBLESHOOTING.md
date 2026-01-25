# SMS Not Received - Troubleshooting Guide

## 🔍 Step-by-Step Diagnosis

---

## Step 1: Check Server Logs

**Look at your server terminal** (where `npm run dev` is running).

### ✅ What You Should See (Success):
```
✅ Payment confirmation notification sent
SMS notification sent successfully (payment confirmation): {
  consultationId: "...",
  amount: 10000,
  messageId: "SM..."
}
```

### ❌ What You Might See (Failure):
```
SMS not sent for payment confirmation: {
  reason: "User preference does not allow SMS"
  // OR
  reason: "Patient has no phone number"
}
```

**OR:**
```
SMS notification failed for payment confirmation: {
  error: "Phone number not verified (trial account restriction)"
  // OR
  error: "Invalid phone number format"
}
```

**What to do:**
- Copy the exact error message
- This will tell us what's wrong

---

## Step 2: Check Twilio Console

1. **Go to:** https://console.twilio.com/us1/monitor/logs/messaging
2. **Look for messages to:** `+23272860043`
3. **Check the Status column:**

### Status Meanings:

**✅ "delivered"** - SMS was delivered
- If you see this but didn't receive it:
  - Check phone signal
  - Check if number is correct
  - Check spam/junk folder

**⚠️ "sent"** - SMS was sent but not yet delivered
- Wait a few minutes
- Check again

**❌ "failed"** - SMS failed to send
- Check the error code
- Common codes:
  - `21211` - Invalid phone number
  - `21408` - Phone number not verified (trial account)
  - `21608` - Unsubscribed recipient

**❌ "undelivered"** - SMS couldn't be delivered
- Phone number might be wrong
- Carrier might have blocked it

**❌ No message at all** - SMS was never sent
- Check server logs for errors
- Check Twilio credentials

---

## Step 3: Check Twilio Account Type

### Trial Account Restrictions

**If you're on a Twilio Trial account:**
- You can **only** send to **verified phone numbers**
- Your phone number (`+23272860043`) must be verified

**How to verify:**
1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click **"Add a new number"**
3. Enter: `+23272860043`
4. Verify via SMS or call
5. Try sending again

**Or upgrade your Twilio account** to send to any number.

---

## Step 4: Verify Phone Number Format

**Your phone number should be:** `+23272860043`

**Check in database:**
```sql
SELECT 
  id,
  email,
  phone_number,
  CASE 
    WHEN phone_number = '+23272860043' THEN '✅ Correct'
    WHEN phone_number IS NULL THEN '❌ Missing'
    ELSE '⚠️ Different: ' || phone_number
  END as status
FROM users
WHERE id = '92cbf80c-97a3-4470-aac0-f359b98accd1';
```

---

## Step 5: Check Twilio Credentials

**Verify in `.env.local`:**
```bash
TWILIO_ACCOUNT_SID=AC652925971c981ff1f00868a05cd1b2f0
TWILIO_AUTH_TOKEN=eeb9b28036905abf168e37ae53b18349
TWILIO_PHONE_NUMBER=+18339091249
```

**Test credentials:**
```bash
# Test if credentials work
curl -X POST \
  https://api.twilio.com/2010-04-01/Accounts/AC652925971c981ff1f00868a05cd1b2f0/Messages.json \
  -u AC652925971c981ff1f00868a05cd1b2f0:eeb9b28036905abf168e37ae53b18349 \
  -d "From=+18339091249" \
  -d "To=+23272860043" \
  -d "Body=Test message"
```

**If this fails:**
- Credentials might be wrong
- Account might be suspended
- Check Twilio Console for account status

---

## Step 6: Check Server Logs for Detailed Errors

**Look for these specific errors:**

### Error 21408: Phone Number Not Verified
```
Error: Phone number not verified (trial account restriction)
```
**Fix:** Verify phone number in Twilio Console

### Error 21211: Invalid Phone Number
```
Error: Invalid phone number format
```
**Fix:** Check phone number format is `+23272860043`

### Error: Authentication Failed
```
Error: Authentication failed
```
**Fix:** Check Twilio credentials in `.env.local`

### No Error, But No SMS
- Check if SMS service is actually being called
- Check server logs for "SMS notification sent successfully"
- If you don't see this, SMS wasn't sent

---

## 🎯 Quick Diagnostic Commands

### 1. Check Server Logs
```bash
# Look at your server terminal
# Search for "SMS" in the logs
```

### 2. Check Twilio Console
- Go to: https://console.twilio.com/us1/monitor/logs/messaging
- Filter by: `+23272860043`
- Check status

### 3. Test Direct Twilio API
```bash
curl -X POST \
  https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json \
  -u YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN \
  -d "From=+18339091249" \
  -d "To=+23272860043" \
  -d "Body=Direct test from Twilio"
```

**If this works:**
- Twilio is working
- Problem is in your app code

**If this fails:**
- Problem is with Twilio account/credentials

---

## 🔧 Common Fixes

### Fix 1: Verify Phone Number (Trial Account)

1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Add: `+23272860043`
3. Verify via SMS or call
4. Try again

### Fix 2: Check Phone Number Format

Make sure it's exactly: `+23272860043`
- ✅ Starts with `+`
- ✅ Country code: `232`
- ✅ 9 digits after country code
- ✅ No spaces or dashes

### Fix 3: Check Server Logs

**If you see:**
```
SMS not sent for payment confirmation: {
  reason: "User preference does not allow SMS"
}
```

**Fix:** Check notification preferences:
```sql
SELECT notification_preferences 
FROM users 
WHERE id = '92cbf80c-97a3-4470-aac0-f359b98accd1';
```

Should be: `sms` or `both` (not `email` only)

---

## 📋 Diagnostic Checklist

Run through these:

- [ ] Server logs show "SMS notification sent successfully"
- [ ] Twilio Console shows message (check status)
- [ ] Phone number is verified in Twilio (if trial account)
- [ ] Phone number format is correct (`+23272860043`)
- [ ] Twilio credentials are correct
- [ ] User notification preferences allow SMS
- [ ] Phone has signal/reception
- [ ] Checked spam/junk folder

---

## 🆘 What to Share for Help

If still not working, share:

1. **Server logs** - What does it say when SMS is sent?
2. **Twilio Console** - What status shows for the message?
3. **Error messages** - Any errors in server logs?
4. **Phone number** - Is it exactly `+23272860043`?

---

**Next:** Check your server logs first - that will tell us exactly what's happening! 🔍
