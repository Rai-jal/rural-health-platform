import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required').optional(),
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL').optional(),
  // Twilio SMS Configuration (optional)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  // Twilio Video/Voice Configuration (optional)
  TWILIO_API_KEY: z.string().optional(),
  TWILIO_API_SECRET: z.string().optional(),
  // Email Configuration (optional - SendGrid or AWS SES)
  // SendGrid
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email('Invalid SendGrid from email').optional(),
  SENDGRID_FROM_NAME: z.string().optional(),
  // AWS SES
  AWS_SES_REGION: z.string().optional(),
  AWS_SES_ACCESS_KEY_ID: z.string().optional(),
  AWS_SES_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_SES_FROM_EMAIL: z.string().email('Invalid AWS SES from email').optional(),
  // Default email configuration
  EMAIL_FROM: z.string().email('Invalid default email').optional(),
  EMAIL_FROM_NAME: z.string().optional(),
  // Flutterwave Payment Gateway Configuration (optional)
  FLUTTERWAVE_PUBLIC_KEY: z.string().optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),
  FLUTTERWAVE_ENCRYPTION_KEY: z.string().optional(),
  FLUTTERWAVE_WEBHOOK_SECRET: z.string().optional(),
  FLUTTERWAVE_SECRET_HASH: z.string().optional(), // Alias for FLUTTERWAVE_WEBHOOK_SECRET
  FLUTTERWAVE_MODE: z.enum(['sandbox', 'live']).optional(),
  ENABLE_MOCK_PAYMENTS: z.string().optional(),
  // Cron job security (optional but recommended)
  CRON_SECRET: z.string().optional(),
  // Sentry Error Monitoring Configuration (optional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional(),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
})

// Parse and validate environment variables
function getEnv() {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
      TWILIO_API_KEY: process.env.TWILIO_API_KEY,
      TWILIO_API_SECRET: process.env.TWILIO_API_SECRET,
      // Email configuration
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
      SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
      SENDGRID_FROM_NAME: process.env.SENDGRID_FROM_NAME,
      AWS_SES_REGION: process.env.AWS_SES_REGION,
      AWS_SES_ACCESS_KEY_ID: process.env.AWS_SES_ACCESS_KEY_ID,
      AWS_SES_SECRET_ACCESS_KEY: process.env.AWS_SES_SECRET_ACCESS_KEY,
      AWS_SES_FROM_EMAIL: process.env.AWS_SES_FROM_EMAIL,
      EMAIL_FROM: process.env.EMAIL_FROM,
      EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
      // Flutterwave Payment Gateway Configuration (optional)
      FLUTTERWAVE_PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY,
      FLUTTERWAVE_SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY,
      FLUTTERWAVE_ENCRYPTION_KEY: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
      FLUTTERWAVE_WEBHOOK_SECRET: process.env.FLUTTERWAVE_WEBHOOK_SECRET || process.env.FLUTTERWAVE_SECRET_HASH, // Support both names
      FLUTTERWAVE_SECRET_HASH: process.env.FLUTTERWAVE_SECRET_HASH || process.env.FLUTTERWAVE_WEBHOOK_SECRET, // Alias
      FLUTTERWAVE_MODE: process.env.FLUTTERWAVE_MODE,
      ENABLE_MOCK_PAYMENTS: process.env.ENABLE_MOCK_PAYMENTS,
      // Cron job security
      CRON_SECRET: process.env.CRON_SECRET,
      // Sentry configuration
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
      NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((e) => e.path.join('.')).join(', ')
      throw new Error(
        `Missing or invalid environment variables: ${missingVars}\n` +
          'Please check your .env.local file and ensure all required variables are set.'
      )
    }
    throw error
  }
}

export const env = getEnv()

