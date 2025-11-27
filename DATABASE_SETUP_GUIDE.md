# Database Setup Guide
## Connecting Your HealthConnect App to Supabase

This guide will walk you through setting up your Supabase database and connecting it to your Next.js application.

---

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in the details:
   - **Name:** `health-connect` (or your preferred name)
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to your users (e.g., `West US` for Sierra Leone)
   - **Pricing Plan:** Start with Free tier
5. Click "Create new project"
6. Wait 2-3 minutes for project to initialize

---

## Step 2: Get Your Supabase Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

---

## Step 3: Create Environment Variables

1. In your project root (`health-connect/`), create a file named `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

2. **Important:** Add `.env.local` to `.gitignore` (it should already be there)

3. Create `.env.example` for your team:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 4: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the contents of `scripts/01-create-tables.sql`
4. Click "Run" (or press Cmd/Ctrl + Enter)
5. Wait for success message
6. Repeat for `scripts/02-seed-data.sql` to add sample data

**Alternative:** You can also run these via Supabase CLI:
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link your project
supabase link --project-ref your-project-id

# Run migrations
supabase db push
```

---

## Step 5: Configure Row Level Security (RLS)

For security, you need to set up RLS policies. In Supabase SQL Editor, run:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Example: Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Example: Anyone can view healthcare providers
CREATE POLICY "Anyone can view healthcare providers" ON healthcare_providers
  FOR SELECT USING (true);

-- Example: Users can create their own consultations
CREATE POLICY "Users can create own consultations" ON consultations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add more policies as needed for your use case
```

---

## Step 6: Test Database Connection

1. Make sure your `.env.local` file is set up correctly
2. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```
3. Check the console - you should see:
   - No "Using mock data" messages
   - Database queries working

4. Test in your app:
   - Go to `/consultation` page
   - Try booking a consultation
   - Check Supabase dashboard → **Table Editor** to see if data was created

---

## Step 7: Verify Connection

Create a test file `app/api/test-db/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: 'Missing Supabase credentials' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { data, error } = await supabase
      .from('healthcare_providers')
      .select('count')
      .limit(1)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Database connected successfully!',
      data
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Database connection failed'
      },
      { status: 500 }
    )
  }
}
```

Visit `http://localhost:3000/api/test-db` - you should see a success message.

---

## Step 8: Update Your Code

Your current code already has database functions in `lib/database.ts`, but you need to ensure:

1. **Environment variables are loaded:**
   - Check that `lib/supabase.ts` is reading from `process.env`
   - The code already does this correctly ✅

2. **Remove mock data fallback for production:**
   - In production, you should fail if database is not connected
   - Consider adding environment validation

---

## Troubleshooting

### Issue: "Cannot find module 'autoprefixer'"
**Solution:**
```bash
npm install autoprefixer postcss --save-dev
```

### Issue: "Using mock data" messages
**Solution:**
- Check `.env.local` file exists and has correct values
- Restart dev server after creating `.env.local`
- Verify environment variables are loaded: `console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)`

### Issue: "Invalid API key"
**Solution:**
- Double-check you copied the correct keys
- Make sure there are no extra spaces
- Verify keys in Supabase dashboard → Settings → API

### Issue: "Permission denied" errors
**Solution:**
- Check RLS policies are set up correctly
- Verify you're using the correct key (anon key for client, service role for server)
- Check table permissions in Supabase

### Issue: Tables don't exist
**Solution:**
- Run `scripts/01-create-tables.sql` in Supabase SQL Editor
- Check Supabase dashboard → Table Editor to verify tables were created

---

## Next Steps

After database is connected:

1. ✅ Set up authentication (see PRODUCTION_READINESS_REPORT.md)
2. ✅ Create API routes (move database operations from client to server)
3. ✅ Implement proper error handling
4. ✅ Add input validation
5. ✅ Set up monitoring

---

## Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use anon key for client-side** - It has RLS protection
3. **Use service_role key only server-side** - Never expose to client
4. **Enable RLS on all tables** - Critical for security
5. **Use parameterized queries** - Supabase does this automatically
6. **Validate all inputs** - Both client and server-side

---

## Production Deployment

When deploying to production (Vercel, etc.):

1. Add environment variables in your hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Add all variables from `.env.local`
   - Set them for "Production" environment

2. Update `NEXT_PUBLIC_APP_URL` to your production URL

3. Test database connection in production

4. Monitor Supabase dashboard for:
   - API usage
   - Database size
   - Connection limits

---

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Need Help?** Check the PRODUCTION_READINESS_REPORT.md for comprehensive next steps.

