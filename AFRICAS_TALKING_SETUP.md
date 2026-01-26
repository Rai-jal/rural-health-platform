# Africa's Talking SMS Setup Guide

This guide explains how to set up Africa's Talking SMS for Sierra Leone phone numbers (+232) in HealthConnect.

## Overview

Africa's Talking is integrated to handle SMS notifications for Sierra Leone phone numbers. The system automatically routes:
- **Sierra Leone numbers (+232)** → Africa's Talking
- **Other numbers** → Twilio (if configured)

## Why Africa's Talking?

- ✅ **Supports Sierra Leone** (+232) without geographic restrictions
- ✅ **Reliable delivery** in African markets
- ✅ **Cost-effective** pricing for African countries
- ✅ **Easy integration** with simple API

## Setup Steps

### Step 1: Create Africa's Talking Account

1. Go to: https://account.africastalking.com
2. Click "Sign Up" and create an account
3. Verify your email address

### Step 2: Create an Application

1. Log in to your Africa's Talking dashboard
2. Go to "Apps" → "Create App"
3. Fill in:
   - **App Name**: HealthConnect (or your preferred name)
   - **Environment**: Sandbox (for testing) or Production
4. Click "Create App"

### Step 3: Get API Credentials

1. In your app dashboard, go to "Settings"
2. Find your credentials:
   - **Username**: Your app username (e.g., `sandbox` for sandbox)
   - **API Key**: Your API key (starts with `...`)

### Step 4: Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Africa's Talking SMS Configuration
AFRICAS_TALKING_USERNAME=your_username_here
AFRICAS_TALKING_API_KEY=your_api_key_here
AFRICAS_TALKING_MODE=sandbox  # or 'production' for production
SMS_SENDER_ID=HealthConnect  # Optional: Your sender ID (max 11 characters)
```

**Important Notes:**
- For **testing**: Use `AFRICAS_TALKING_MODE=sandbox`
- For **production**: Use `AFRICAS_TALKING_MODE=production`
- `SMS_SENDER_ID` is optional. If not set, defaults to "HealthConnect"
- Sender ID must be alphanumeric, max 11 characters

### Step 5: Restart Development Server

After adding environment variables:

```bash
# Stop your dev server (Ctrl+C)
# Then restart
npm run dev
```

## Testing

### Test via API Endpoint

1. **Check service status:**
   ```bash
   curl http://localhost:3000/api/test/africas-talking-sms
   ```

2. **Send test SMS:**
   ```bash
   curl -X POST http://localhost:3000/api/test/africas-talking-sms \
     -H "Content-Type: application/json" \
     -d '{
       "phoneNumber": "+23272860043",
       "message": "Test SMS from HealthConnect"
     }'
   ```

3. **Expected response (success):**
   ```json
   {
     "success": true,
     "message": "SMS sent successfully",
     "data": {
       "messageId": "ATXid_xxx",
       "phoneNumber": "+23272860043",
       "provider": "africas-talking"
     }
   }
   ```

### Test Phone Numbers (Sandbox)

In sandbox mode, you can test with:
- Your verified phone number (add it in Africa's Talking dashboard)
- Test numbers provided by Africa's Talking

**Note:** In sandbox mode, SMS will only be delivered to verified numbers.

## Phone Number Format

The system automatically normalizes phone numbers to E.164 format:

**Accepted formats:**
- `+23272860043` ✅ (E.164 format)
- `23272860043` ✅ (will add +)
- `072860043` ✅ (will add +232)
- `0 728 600 43` ✅ (spaces removed, +232 added)

**Sierra Leone format:**
- Country code: `+232`
- Number format: `+232XXXXXXXX` (8 digits after country code)
- Example: `+23272860043`

## Integration Points

The SMS service is automatically used for:

1. **Payment Confirmations**
   - Triggered after successful payment webhook
   - Sends confirmation SMS to patient

2. **Consultation Booking Confirmations**
   - Triggered when consultation is booked
   - Sends confirmation to patient and provider

3. **Consultation Reminders**
   - Triggered 1 hour before scheduled consultation
   - Sent via cron job (`/api/jobs/send-reminders`)

## Error Handling

The system gracefully handles errors:

- **Invalid phone number**: Returns error, doesn't crash
- **API failure**: Logs error, continues processing
- **Service not configured**: Logs warning, skips SMS

All errors are logged with:
- Phone number (masked for privacy)
- Error message
- Message type (payment, booking, reminder)

## Production Checklist

Before going to production:

- [ ] Switch `AFRICAS_TALKING_MODE=production`
- [ ] Verify sender ID is approved (if using custom sender ID)
- [ ] Test with real Sierra Leone phone numbers
- [ ] Monitor SMS delivery rates
- [ ] Set up billing alerts in Africa's Talking dashboard

## Troubleshooting

### SMS Not Sending

1. **Check credentials:**
   ```bash
   curl http://localhost:3000/api/test/africas-talking-sms
   ```
   Verify `enabled: true` and all configuration is correct

2. **Check phone number format:**
   - Must start with `+232`
   - Must have 8 digits after country code
   - Example: `+23272860043`

3. **Check sandbox restrictions:**
   - In sandbox mode, only verified numbers receive SMS
   - Add your test number in Africa's Talking dashboard

4. **Check API response:**
   - Look at server logs for detailed error messages
   - Check Africa's Talking dashboard for delivery status

### Common Errors

**Error: "Africa's Talking SMS service not configured"**
- Solution: Add `AFRICAS_TALKING_USERNAME` and `AFRICAS_TALKING_API_KEY` to `.env.local`

**Error: "Invalid phone number format"**
- Solution: Ensure phone number is in E.164 format: `+232XXXXXXXX`

**Error: "Phone number is not a Sierra Leone number"**
- Solution: Phone number must start with `+232`

**Error: "Invalid response from Africa's Talking API"**
- Solution: Check API credentials and network connectivity

## Cost Information

- **Sandbox**: Free (limited to verified numbers)
- **Production**: Pay-as-you-go pricing
  - Check current rates: https://africastalking.com/pricing
  - Typically ~$0.01-0.02 per SMS in Sierra Leone

## Support

- **Africa's Talking Docs**: https://developers.africastalking.com/docs/sms
- **API Reference**: https://developers.africastalking.com/docs/sms/sending
- **Support**: support@africastalking.com

## Next Steps

1. ✅ Set up Africa's Talking account
2. ✅ Add credentials to `.env.local`
3. ✅ Test SMS sending
4. ✅ Verify SMS delivery
5. ✅ Monitor in production

---

**Ready to test?** Run:
```bash
curl -X POST http://localhost:3000/api/test/africas-talking-sms \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+23272860043", "message": "Test SMS"}'
```
