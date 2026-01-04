# Setup Guide: Notifications and Calls

This guide explains how to set up SMS notifications, video calls, and voice calls for the HealthConnect platform.

## Overview

The system now includes:
1. **SMS Notifications** - Notify providers and patients about consultations
2. **Video Calls** - Twilio-based video consultations
3. **Voice Calls** - Twilio-based voice consultations

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com)
2. Node.js 18+ installed
3. Access to your Supabase project

## Step 1: Install Required Packages

```bash
cd health-connect
npm install twilio
```

## Step 2: Get Twilio Credentials

1. Log in to your Twilio Console: https://console.twilio.com
2. Navigate to **Account** → **API Keys & Tokens**
3. Note down:
   - **Account SID** (starts with `AC...`)
   - **Auth Token**
4. Navigate to **Phone Numbers** → **Manage** → **Buy a number** (or use existing)
   - Note down your **Twilio Phone Number** (format: +1234567890)
5. For video calls, create an API Key:
   - Go to **Account** → **API Keys & Tokens** → **Create API Key**
   - Note down the **API Key SID** and **API Secret**

## Step 3: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Twilio Video/Voice Configuration
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_api_secret_here
```

**Important**: Never commit these credentials to version control!

## Step 4: Verify Database Schema

Ensure your database has the following fields in the `users` and `healthcare_providers` tables:

- `users.phone_number` - Patient phone numbers
- `healthcare_providers.user_id` - Links to users table
- `consultations.consultation_type` - Should be "video", "voice", or "sms"

## Step 5: Test SMS Notifications

### Test Provider Notification

1. As a patient, book a consultation
2. The provider should receive an SMS notification with:
   - Patient name
   - Consultation type
   - Scheduled time

### Test Patient Confirmation

1. As a provider, accept a consultation
2. The patient should receive an SMS confirmation

### Test Payment Confirmation

1. Complete a payment for a consultation
2. The patient should receive an SMS confirmation

## Step 6: Test Voice Calls

1. Create a consultation with type "voice"
2. Call the API endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/calls/initiate \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"consultationId": "consultation-id-here"}'
   ```
3. Twilio will initiate a call connecting the patient and provider

## Step 7: Test Video Calls

1. Create a consultation with type "video"
2. Get an access token:
   ```bash
   curl -X POST http://localhost:3000/api/calls/token \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "identity": "user-id",
       "roomName": "consultation-room-123",
       "consultationId": "consultation-id-here"
     }'
   ```
3. Use the token with Twilio Video SDK in your frontend

## Troubleshooting

### SMS Not Sending

1. **Check Twilio credentials**: Verify all environment variables are set correctly
2. **Check phone numbers**: Ensure phone numbers are in E.164 format (+1234567890)
3. **Check Twilio console**: Look for error messages in Twilio's logs
4. **Check console logs**: Look for "SMS service not configured" warnings

### Voice Calls Not Working

1. **Verify TwiML endpoint**: Ensure `/api/calls/voice-handler` is accessible
2. **Check phone numbers**: Both patient and provider must have valid phone numbers
3. **Check Twilio logs**: Look for call status in Twilio console
4. **Verify webhook URL**: Twilio needs to reach your server (use ngrok for local testing)

### Video Calls Not Working

1. **Install Twilio SDK**: Run `npm install twilio`
2. **Check API keys**: Verify TWILIO_API_KEY and TWILIO_API_SECRET are set
3. **Check token generation**: Test the `/api/calls/token` endpoint
4. **Frontend integration**: Ensure you're using Twilio Video SDK in your frontend

## Local Development with Webhooks

For local development, use ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js server
npm run dev

# In another terminal, expose port 3000
ngrok http 3000

# Use the ngrok URL in Twilio webhook configuration
# Example: https://abc123.ngrok.io/api/calls/voice-handler
```

## Production Deployment

1. **Set environment variables** in your hosting platform (Vercel, etc.)
2. **Configure Twilio webhooks** to point to your production URL
3. **Test all flows** in production environment
4. **Monitor Twilio console** for usage and errors

## Workflow Summary

### Consultation Booking Flow

1. Patient books consultation → **Provider receives SMS notification**
2. Provider accepts consultation → **Patient receives SMS confirmation**
3. Payment completed → **Patient receives SMS payment confirmation**

### Call Flow

1. **Voice Call**: Patient/Provider initiates → Twilio connects both parties
2. **Video Call**: Both parties join Twilio Video room using access tokens

## Security Notes

- Never expose Twilio credentials in client-side code
- Always use server-side API routes for token generation
- Validate user permissions before initiating calls
- Use HTTPS in production for webhook endpoints

## Support

For issues:
1. Check Twilio documentation: https://www.twilio.com/docs
2. Review server logs for error messages
3. Check Twilio console for API errors
4. Verify all environment variables are set correctly

