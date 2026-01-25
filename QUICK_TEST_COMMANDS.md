# Quick Test Commands

## 🚀 Fastest Way to Test

### Step 1: Get Consultation ID

Run in Supabase SQL Editor:

```sql
SELECT id 
FROM consultations 
WHERE user_id = '92cbf80c-97a3-4470-aac0-f359b98accd1' 
ORDER BY created_at DESC 
LIMIT 1;
```

**Copy the ID** (it's a UUID)

---

### Step 2: Test Notification

Replace `YOUR_CONSULTATION_ID` with the ID from Step 1:

```bash
curl "http://localhost:3000/api/test/notify?userId=92cbf80c-97a3-4470-aac0-f359b98accd1&consultationId=YOUR_CONSULTATION_ID&amount=10000"
```

---

### Step 3: Check Results

**In Terminal:**
- Should see JSON response with `"success": true`

**In Server Logs:**
- Should see: `✅ SMS notification sent successfully`

**In Twilio Console:**
- Go to: https://console.twilio.com/us1/monitor/logs/messaging
- Should see message to `+23272860043`

**On Your Phone:**
- Should receive SMS message

---

## 🎯 One-Liner (After Getting Consultation ID)

```bash
# Replace CONSULTATION_ID with actual ID
curl "http://localhost:3000/api/test/notify?userId=92cbf80c-97a3-4470-aac0-f359b98accd1&consultationId=CONSULTATION_ID&amount=10000" && echo "" && echo "✅ Check server logs and Twilio Console!"
```

---

## 📋 What to Look For

### ✅ Success Indicators:
- Response: `"success": true`
- Server logs: `SMS notification sent successfully`
- Twilio: Message shows as "sent" or "delivered"
- Phone: SMS received

### ❌ Failure Indicators:
- Response: `"success": false` or error message
- Server logs: `SMS not sent` or error
- Twilio: No message or error status

---

**That's it!** Simple 3-step process. 🚀
