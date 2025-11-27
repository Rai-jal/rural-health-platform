#!/bin/bash

# Setup script for environment variables
# Run this script to create your .env.local file

echo "Setting up environment variables..."

cat > .env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://mkrrzggetqnsxnenkvht.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rcnJ6Z2dldHFuc3huZW5rdmh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDM0NDksImV4cCI6MjA3OTQ3OTQ0OX0.ThB6nRcv_-PgM_cZzmF_17nCeCgRetzyVxzKub80_JQ

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Service Role Key (get this from Supabase Dashboard -> Settings -> API)
# Keep this secret - only use server-side!
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
EOF

echo "✅ .env.local file created successfully!"
echo ""
echo "Next steps:"
echo "1. Get your Service Role Key from Supabase Dashboard"
echo "2. Add it to .env.local (uncomment and set SUPABASE_SERVICE_ROLE_KEY)"
echo "3. Restart your dev server: npm run dev"

