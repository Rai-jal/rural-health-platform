# How to Enable Sierra Leone in Twilio

## 🎯 The Issue

**Error:** `21408 - Permission to send an SMS has not been enabled for the region indicated by the 'To' number: 2327286XXXX`

**Translation:** Twilio cannot send SMS to Sierra Leone (country code 232) with your current account settings.

---

## ✅ Step-by-Step Fix

### Step 1: Check Your Twilio Account Type

1. Go to: https://console.twilio.com/us1/billing
2. Check if you see:
   - **"Trial Account"** - Has geographic restrictions
   - **"Paid Account"** - Fewer restrictions

### Step 2: Check Geographic Permissions

1. Go to: https://console.twilio.com/us1/account/settings
2. Scroll to **"Geographic Permissions"** or **"SMS Geographic Permissions"**
3. Look for:
   - List of countries/regions
   - Sierra Leone or country code 232
   - Enable/disable toggle

**If you see Sierra Leone:**
- Enable it
- Save changes
- Test again

**If you don't see Sierra Leone:**
- It may not be available for trial accounts
- You may need to upgrade

### Step 3: Upgrade Account (Recommended)

**Why upgrade:**
- Removes geographic restrictions
- Enables all supported countries
- Pay-as-you-go (only pay for messages sent)
- Better for production

**How to upgrade:**
1. Go to: https://console.twilio.com/us1/billing
2. Click **"Upgrade Account"** or **"Add Payment Method"**
3. Add credit card (won't be charged unless you use services)
4. Complete upgrade
5. Sierra Leone should be enabled automatically

**Cost:** 
- No monthly fee
- Pay per SMS: ~$0.0075 per message
- Very affordable for healthcare app

### Step 4: Contact Twilio Support (If Needed)

**If Sierra Leone still not available:**

1. Go to: https://support.twilio.com
2. Click **"Submit a Ticket"**
3. Subject: "Enable SMS to Sierra Leone (country code 232)"
4. Message:
   ```
   Hello,
   
   I'm developing a healthcare application for Sierra Leone and need 
   to send SMS notifications to users with phone numbers starting with +232.
   
   Currently getting error 21408: "Permission to send an SMS has not 
   been enabled for the region indicated by the 'To' number: 232"
   
   Please enable SMS sending to Sierra Leone for my account.
   
   Account SID: AC652925971c981ff1f00868a05cd1b2f0
   
   Thank you!
   ```
5. Submit ticket
6. Wait for response (usually 24-48 hours)

---

## 🔍 Check if Twilio Supports Sierra Leone

**Check Twilio's documentation:**
1. Go to: https://www.twilio.com/docs/sms/countries
2. Search for "Sierra Leone"
3. Check if it's listed as supported
4. Check requirements (may need account upgrade)

**If supported:**
- Should work after account upgrade
- Or after contacting support

**If not supported:**
- Consider alternative SMS provider
- See alternatives below

---

## 🔄 Alternative SMS Providers for Sierra Leone

**If Twilio doesn't support Sierra Leone:**

### Option 1: Africa's Talking
- **Best for:** African countries
- **Supports:** Sierra Leone ✅
- **Website:** https://africastalking.com
- **API:** Similar to Twilio

### Option 2: MessageBird
- **Best for:** Global coverage
- **Supports:** Sierra Leone ✅
- **Website:** https://messagebird.com
- **API:** REST API similar to Twilio

### Option 3: Vonage (Nexmo)
- **Best for:** International SMS
- **Supports:** Sierra Leone ✅
- **Website:** https://vonage.com
- **API:** Similar to Twilio

---

## 🧪 Test After Fix

**Once Sierra Leone is enabled:**

```bash
curl -X POST \
  https://api.twilio.com/2010-04-01/Accounts/AC652925971c981ff1f00868a05cd1b2f0/Messages.json \
  -u AC652925971c981ff1f00868a05cd1b2f0:eeb9b28036905abf168e37ae53b18349 \
  -d "From=+18339091249" \
  -d "To=+23272860043" \
  -d "Body=Test after enabling Sierra Leone"
```

**Success response:**
```json
{
  "sid": "SM...",
  "status": "queued",
  "to": "+23272860043"
}
```

**Then check:**
- Twilio Console for delivery status
- Your phone for the SMS

---

## 📋 Action Checklist

- [ ] Check Twilio account type (trial vs paid)
- [ ] Check geographic permissions in settings
- [ ] Enable Sierra Leone if available
- [ ] Upgrade account if needed
- [ ] Contact support if still not working
- [ ] Test SMS after fix
- [ ] Verify SMS received on phone

---

## 🎯 Quick Decision Tree

**Is your account Trial?**
- ✅ Yes → Upgrade account (recommended)
- ❌ No → Check geographic permissions

**Can you enable Sierra Leone in settings?**
- ✅ Yes → Enable it and test
- ❌ No → Contact support or upgrade

**Does Twilio support Sierra Leone?**
- ✅ Yes → Enable/upgrade and use Twilio
- ❌ No → Use alternative provider (Africa's Talking, etc.)

---

**Next Step:** Check your Twilio account settings and billing page! 🔍
