# Africa's Talking SMS - Quick Start

## ✅ Integration Complete!

Africa's Talking SMS has been integrated into HealthConnect. The system automatically routes:
- **Sierra Leone numbers (+232)** → Africa's Talking ✅
- **Other numbers** → Twilio (if configured)

## 🚀 Quick Setup (5 minutes)

### 1. Get Credentials

1. Sign up: https://account.africastalking.com
2. Create an app
3. Get your **Username** and **API Key**

### 2. Add to `.env.local`

```bash
AFRICAS_TALKING_USERNAME=your_username_here
AFRICAS_TALKING_API_KEY=your_api_key_here
AFRICAS_TALKING_MODE=sandbox  # Use 'production' for production
SMS_SENDER_ID=HealthConnect  # Optional
```

### 3. Restart Server

```bash
npm run dev
```

### 4. Test

```bash
# Check status
curl http://localhost:3000/api/test/africas-talking-sms

# Send test SMS
curl -X POST http://localhost:3000/api/test/africas-talking-sms \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+23272860043", "message": "Test SMS"}'
```

## 📋 What's Integrated

The SMS service automatically uses Africa's Talking for:

1. ✅ **Payment Confirmations** - After successful payment
2. ✅ **Consultation Bookings** - When consultation is booked
3. ✅ **Consultation Reminders** - 1 hour before scheduled time

## 📞 Phone Number Format

**Accepted formats:**
- `+23272860043` ✅
- `23272860043` ✅ (auto-adds +)
- `072860043` ✅ (auto-adds +232)
- `0 728 600 43` ✅ (spaces removed)

**Sierra Leone format:** `+232XXXXXXXX` (8 digits after +232)

## 🔍 Testing

### Test Endpoint

**GET** `/api/test/africas-talking-sms` - Check service status

**POST** `/api/test/africas-talking-sms` - Send test SMS
```json
{
  "phoneNumber": "+23272860043",
  "message": "Test SMS from HealthConnect"
}
```

### In Your Code

The existing SMS service automatically routes to Africa's Talking:

```typescript
import { smsService } from "@/lib/notifications/sms";

// Automatically uses Africa's Talking for +232 numbers
await smsService.sendSMS({
  to: "+23272860043",
  message: "Your consultation is confirmed!"
});
```

## 📚 Full Documentation

See `AFRICAS_TALKING_SETUP.md` for complete setup guide.

## 🐛 Troubleshooting

**SMS not sending?**
1. Check credentials are set in `.env.local`
2. Verify phone number format: `+232XXXXXXXX`
3. In sandbox mode, verify your test number in Africa's Talking dashboard

**Check service status:**
```bash
curl http://localhost:3000/api/test/africas-talking-sms
```

---

**Ready to go!** Add your credentials and start sending SMS to Sierra Leone! 🇸🇱
