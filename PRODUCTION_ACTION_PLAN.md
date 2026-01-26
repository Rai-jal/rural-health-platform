# Production Action Plan - Quick Reference

## 🎯 Status: 80% Production Ready

**Estimated Time to Production:** 3-4 hours

---

## 🔴 CRITICAL (Must Fix - 2-3 hours)

### 1. Fix SMS Geographic Restriction ⏱️ 1-2 hours
**Issue:** Twilio cannot send SMS to Sierra Leone (country code 232)

**Options:**
- **Option A:** Upgrade Twilio account (removes restrictions)
  - Go to: https://console.twilio.com/us1/billing
  - Click "Upgrade Account"
  - Add payment method
  - Cost: Pay-as-you-go (~$0.0075 per SMS)

- **Option B:** Use Alternative Provider
  - **Africa's Talking** (recommended for Africa)
    - Website: https://africastalking.com
    - Supports Sierra Leone ✅
    - Similar API to Twilio
  - **MessageBird**
    - Website: https://messagebird.com
    - Global coverage including Sierra Leone ✅

**Action:**
1. Choose option (upgrade Twilio OR switch provider)
2. Update SMS service code if switching
3. Test SMS delivery
4. Update `.env.local` with new credentials

---

### 2. Verify SendGrid Email ⏱️ 5 minutes
**Issue:** Sender email not verified (400 error)

**Action:**
1. Go to: https://app.sendgrid.com/settings/sender_auth/senders
2. Verify `prinaldacjsmith@gmail.com`
3. Check email inbox and click verification link
4. Test email sending:
   ```bash
   curl "http://localhost:3000/api/test/email"
   ```

---

### 3. Configure Production Webhook ⏱️ 30 minutes
**Issue:** Using ngrok (not production-ready)

**Action:**
1. Deploy to Vercel (or your hosting)
2. Get production URL (e.g., `https://yourdomain.com`)
3. Update Flutterwave webhook URL:
   - Go to: Flutterwave Dashboard → Settings → Webhooks
   - Update URL: `https://yourdomain.com/api/webhooks/flutterwave`
4. Test webhook in production

---

### 4. Update Production Environment Variables ⏱️ 15 minutes
**Issue:** Using development/localhost URLs

**Action:**
1. Set in production environment (Vercel):
   ```bash
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   FLUTTERWAVE_MODE=live
   CRON_SECRET=your-generated-secret
   ```
2. Keep all other variables (they're already correct)
3. Verify all variables are set

---

## 🟡 HIGH PRIORITY (Should Fix - 1 hour)

### 5. Set CRON_SECRET ⏱️ 5 minutes
**Action:**
```bash
# Generate secret
openssl rand -hex 32

# Add to .env.local and Vercel
CRON_SECRET=generated-secret-here
```

**Why:** Prevents unauthorized access to cron endpoints

---

### 6. Run Database Migration ⏱️ 5 minutes
**Action:**
1. Go to Supabase SQL Editor
2. Run: `migrations/fix_phone_number_trigger_v2.sql`
3. Verify trigger is working
4. Test new user signup

**Why:** Ensures phone numbers are saved on signup

---

### 7. Configure Error Monitoring (Optional) ⏱️ 30 minutes
**Action:**
1. Sign up: https://sentry.io
2. Create project
3. Get DSN
4. Add to environment: `NEXT_PUBLIC_SENTRY_DSN=...`
5. Test error tracking

**Why:** Helps debug production issues

---

## ✅ VERIFICATION CHECKLIST

After fixing critical issues, verify:

- [ ] SMS notifications work (test with real payment)
- [ ] Email notifications work (test with real payment)
- [ ] Payment webhook works (complete test payment)
- [ ] Cron jobs work (trigger manually and verify)
- [ ] Admin alerts work (test payment failure)
- [ ] New user signup saves phone number
- [ ] Consultation booking saves phone number
- [ ] All environment variables set in production

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Fix Critical Issues (2-3 hours)
1. Fix SMS (upgrade Twilio or switch provider)
2. Verify SendGrid email
3. Prepare production environment variables

### Step 2: Deploy to Vercel (30 minutes)
1. Connect GitHub repo to Vercel
2. Set all environment variables
3. Deploy
4. Configure custom domain

### Step 3: Configure External Services (30 minutes)
1. Update Flutterwave webhook URL
2. Test webhook in production
3. Verify cron jobs are running

### Step 4: Final Testing (1 hour)
1. Test complete payment flow
2. Test SMS/Email notifications
3. Test admin alerts
4. Monitor for errors

---

## 📊 Current Configuration Status

### ✅ Configured
- Supabase (database, auth)
- Flutterwave (sandbox mode)
- Twilio (credentials set, but geographic restriction)
- SendGrid (API key set, email needs verification)
- Database migrations (code ready)

### ⚠️ Needs Configuration
- SendGrid email verification
- Twilio geographic permission
- Production webhook URL
- Production environment variables
- CRON_SECRET
- Error monitoring (optional)

---

## 🎯 Quick Wins (Do First)

1. **Verify SendGrid email** (5 min) - Easiest fix
2. **Set CRON_SECRET** (5 min) - Quick security improvement
3. **Run database migration** (5 min) - Fixes phone number storage

**Then tackle:**
4. **SMS geographic restriction** (1-2 hours) - Biggest blocker
5. **Production deployment** (30 min) - Required for webhooks

---

## 📝 Files to Review

### Before Production:
- `.env.local` - Check all variables
- `vercel.json` - Cron configuration
- `migrations/fix_phone_number_trigger_v2.sql` - Run this
- `lib/notifications/sms.ts` - May need update if switching provider
- `app/api/webhooks/flutterwave/route.ts` - Webhook handler

### After Production:
- Monitor error logs
- Check payment processing
- Verify notification delivery
- Monitor cron job execution

---

## 🎉 Success Criteria

**System is production-ready when:**
- ✅ SMS notifications work for Sierra Leone numbers
- ✅ Email notifications work (SendGrid verified)
- ✅ Payment webhooks work in production
- ✅ All environment variables configured
- ✅ Cron jobs secured with CRON_SECRET
- ✅ Database migrations applied
- ✅ Error monitoring configured (optional)

---

**Next:** Start with the 4 critical issues, then move to high priority items! 🚀
