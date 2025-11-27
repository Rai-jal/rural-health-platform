-- ============================================================================
-- COMPLETE SQL SETUP FOR HEALTHCONNECT
-- Run these scripts in Supabase SQL Editor IN ORDER
-- ============================================================================

-- ============================================================================
-- SCRIPT 1: CREATE BASE TABLES
-- Run this FIRST
-- ============================================================================

-- Create healthcare providers table
CREATE TABLE IF NOT EXISTS healthcare_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  languages TEXT[] DEFAULT ARRAY['English'],
  experience_years INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_consultations INTEGER DEFAULT 0,
  location VARCHAR(100),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create consultations table (will reference users after auth setup)
CREATE TABLE IF NOT EXISTS consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  provider_id UUID REFERENCES healthcare_providers(id) ON DELETE CASCADE,
  consultation_type VARCHAR(20) NOT NULL CHECK (consultation_type IN ('video', 'voice', 'sms')),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 0,
  cost_leone INTEGER NOT NULL,
  reason_for_consultation TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  user_id UUID,
  amount_leone INTEGER NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_id VARCHAR(100) UNIQUE,
  payment_provider VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health_content table
CREATE TABLE IF NOT EXISTS health_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  content_type VARCHAR(20) DEFAULT 'article' CHECK (content_type IN ('article', 'audio', 'video')),
  language VARCHAR(20) NOT NULL,
  content_text TEXT,
  audio_url VARCHAR(500),
  video_url VARCHAR(500),
  duration_minutes INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.0,
  is_offline_available BOOLEAN DEFAULT false,
  topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create community_groups table
CREATE TABLE IF NOT EXISTS community_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  language VARCHAR(50) NOT NULL,
  location VARCHAR(100),
  moderator_id UUID REFERENCES healthcare_providers(id),
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id UUID,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(group_id, user_id)
);

-- Create discussions table
CREATE TABLE IF NOT EXISTS discussions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id UUID,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create discussion_replies table
CREATE TABLE IF NOT EXISTS discussion_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  user_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL,
  location VARCHAR(200),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  organizer_id UUID REFERENCES healthcare_providers(id),
  is_virtual BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attended BOOLEAN DEFAULT false,
  UNIQUE(event_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_consultations_user ON consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_provider ON consultations(provider_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_payments_consultation ON payments(consultation_id);
CREATE INDEX IF NOT EXISTS idx_health_content_category ON health_content(category);
CREATE INDEX IF NOT EXISTS idx_health_content_language ON health_content(language);
CREATE INDEX IF NOT EXISTS idx_discussions_group ON discussions(group_id);
CREATE INDEX IF NOT EXISTS idx_events_scheduled ON events(scheduled_at);

-- ============================================================================
-- SCRIPT 2: AUTH SETUP (CRITICAL - Run this SECOND)
-- This sets up authentication and role-based access
-- ============================================================================

-- Drop existing users table if it exists (will recreate with auth link)
DROP TABLE IF EXISTS users CASCADE;

-- Create users table linked to Supabase Auth
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20) UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  age INTEGER,
  preferred_language VARCHAR(20) DEFAULT 'English',
  location VARCHAR(100),
  role VARCHAR(20) DEFAULT 'Patient' CHECK (role IN ('Patient', 'Doctor', 'Admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes on users table
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'Patient' -- Default role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except role)
-- Note: Role changes are prevented by a database trigger (see below)
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Admins can update any user (including role changes)
CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'Admin'
    )
  );

-- Add foreign key constraints to consultations and payments
ALTER TABLE consultations 
  ADD CONSTRAINT consultations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE payments 
  ADD CONSTRAINT payments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE group_members 
  ADD CONSTRAINT group_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE discussions 
  ADD CONSTRAINT discussions_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE discussion_replies 
  ADD CONSTRAINT discussion_replies_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE event_attendees 
  ADD CONSTRAINT event_attendees_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Function to prevent users from changing their own role
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If user is not an admin, prevent role changes
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'Admin'
  ) THEN
    -- Non-admins cannot change roles
    IF OLD.role != NEW.role THEN
      RAISE EXCEPTION 'Only admins can change user roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce role change restriction
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON users;
CREATE TRIGGER prevent_role_change_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_change();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;

-- ============================================================================
-- SCRIPT 3: SEED DATA (Optional - Run this THIRD if you want sample data)
-- ============================================================================

-- Insert sample healthcare providers
INSERT INTO healthcare_providers (full_name, specialty, languages, experience_years, rating, total_consultations, location) VALUES
('Dr. Fatima Kamara', 'Maternal Health', ARRAY['English', 'Krio', 'Mende'], 8, 4.9, 150, 'Freetown'),
('Dr. Aminata Sesay', 'General Practice', ARRAY['English', 'Krio', 'Temne'], 12, 4.8, 200, 'Bo'),
('Dr. Mariama Bangura', 'Women''s Health', ARRAY['English', 'Krio', 'Limba'], 6, 4.9, 120, 'Makeni'),
('Nurse Sarah Kamara', 'Community Health', ARRAY['English', 'Krio'], 5, 4.7, 180, 'Kenema'),
('Midwife Fatima Sesay', 'Maternal Care', ARRAY['Mende', 'English'], 10, 4.8, 250, 'Bo'),
('Nutritionist Adama Bangura', 'Child Nutrition', ARRAY['Temne', 'English'], 4, 4.9, 90, 'Port Loko')
ON CONFLICT DO NOTHING;

-- Insert sample health content
INSERT INTO health_content (title, description, category, content_type, language, duration_minutes, rating, is_offline_available, topics) VALUES
('Prenatal Care Basics', 'Essential care during pregnancy for mother and baby health', 'maternal', 'audio', 'English', 8, 4.9, true, ARRAY['Pregnancy', 'Nutrition', 'Doctor Visits']),
('Safe Delivery Practices', 'What to expect during delivery and how to prepare', 'maternal', 'audio', 'Mende', 12, 4.8, true, ARRAY['Delivery', 'Birth Plan', 'Emergency Signs']),
('Breastfeeding Guide', 'Complete guide to successful breastfeeding', 'childcare', 'audio', 'Temne', 10, 4.9, true, ARRAY['Breastfeeding', 'Nutrition', 'Baby Health']),
('Childhood Vaccinations', 'Important vaccines for children and when to get them', 'childcare', 'audio', 'English', 6, 4.7, true, ARRAY['Vaccines', 'Child Health', 'Prevention']),
('Healthy Eating During Pregnancy', 'Nutritious foods for pregnant mothers with local ingredients', 'nutrition', 'audio', 'Limba', 9, 4.8, true, ARRAY['Pregnancy Nutrition', 'Local Foods', 'Healthy Diet']),
('Hand Washing and Hygiene', 'Proper hand washing techniques to prevent disease', 'hygiene', 'audio', 'English', 5, 4.6, true, ARRAY['Hygiene', 'Disease Prevention', 'Health Habits']),
('Family Planning Methods', 'Overview of safe and effective family planning methods available in Sierra Leone', 'family', 'audio', 'English/Krio', 15, 4.8, true, ARRAY['Contraception', 'Family Planning', 'Reproductive Health']),
('Natural Family Planning', 'Natural methods for spacing pregnancies and family planning', 'family', 'audio', 'Mende/English', 12, 4.6, true, ARRAY['Natural Methods', 'Fertility Awareness', 'Family Planning']),
('Birth Spacing Benefits', 'Health benefits of spacing births for mother and child wellbeing', 'family', 'audio', 'Temne/English', 10, 4.7, true, ARRAY['Birth Spacing', 'Maternal Health', 'Child Health']),
('Contraceptive Options', 'Safe contraceptive options available at local health centers', 'family', 'audio', 'English/Krio', 18, 4.9, true, ARRAY['Contraception', 'Health Centers', 'Women''s Health']),
('Reproductive Health Education', 'Understanding reproductive health and making informed decisions', 'family', 'audio', 'Limba/English', 14, 4.8, true, ARRAY['Reproductive Health', 'Education', 'Women''s Rights']),
('Counseling for Couples', 'Family planning counseling and communication for couples', 'family', 'audio', 'English/Krio', 16, 4.7, true, ARRAY['Couples Counseling', 'Communication', 'Family Planning'])
ON CONFLICT DO NOTHING;

-- Insert sample community groups
INSERT INTO community_groups (name, description, category, language, location, moderator_id, member_count) VALUES
('New Mothers Support', 'Support group for new mothers sharing experiences and advice', 'Maternal Health', 'English/Krio', 'Freetown & Rural Areas', (SELECT id FROM healthcare_providers WHERE full_name = 'Nurse Sarah Kamara' LIMIT 1), 245),
('Pregnancy Journey', 'Expecting mothers sharing their pregnancy experiences', 'Pregnancy', 'Mende/English', 'Bo District', (SELECT id FROM healthcare_providers WHERE full_name = 'Midwife Fatima Sesay' LIMIT 1), 189),
('Child Nutrition Circle', 'Discussing healthy nutrition for children using local foods', 'Child Health', 'Temne/English', 'Port Loko District', (SELECT id FROM healthcare_providers WHERE full_name = 'Nutritionist Adama Bangura' LIMIT 1), 156),
('Women''s Wellness', 'General health and wellness discussions for rural women', 'General Health', 'English/Krio/Limba', 'Nationwide', (SELECT id FROM healthcare_providers WHERE full_name = 'Dr. Aminata Sesay' LIMIT 1), 312)
ON CONFLICT DO NOTHING;

-- Insert sample events
INSERT INTO events (title, description, event_type, location, scheduled_at, duration_minutes, max_attendees, organizer_id, is_virtual) VALUES
('Maternal Health Workshop', 'Learn about prenatal care and safe delivery practices', 'Workshop', 'Community Center, Freetown', NOW() + INTERVAL '1 day', 120, 50, (SELECT id FROM healthcare_providers WHERE full_name = 'Dr. Fatima Kamara' LIMIT 1), true),
('Breastfeeding Support Circle', 'Support group for breastfeeding mothers', 'Support Group', 'Health Post, Bo', NOW() + INTERVAL '3 days', 90, 30, (SELECT id FROM healthcare_providers WHERE full_name = 'Midwife Fatima Sesay' LIMIT 1), false),
('Child Vaccination Drive', 'Free vaccinations for children under 5', 'Health Service', 'Mobile Clinic, Makeni', NOW() + INTERVAL '5 days', 240, 100, (SELECT id FROM healthcare_providers WHERE full_name = 'Dr. Mariama Bangura' LIMIT 1), false)
ON CONFLICT DO NOTHING;

-- Update content download counts
UPDATE health_content SET download_count = 1250 WHERE title = 'Prenatal Care Basics';
UPDATE health_content SET download_count = 980 WHERE title = 'Safe Delivery Practices';
UPDATE health_content SET download_count = 1500 WHERE title = 'Breastfeeding Guide';
UPDATE health_content SET download_count = 850 WHERE title = 'Childhood Vaccinations';
UPDATE health_content SET download_count = 1100 WHERE title = 'Healthy Eating During Pregnancy';
UPDATE health_content SET download_count = 2000 WHERE title = 'Hand Washing and Hygiene';
UPDATE health_content SET download_count = 890 WHERE title = 'Family Planning Methods';
UPDATE health_content SET download_count = 650 WHERE title = 'Natural Family Planning';
UPDATE health_content SET download_count = 720 WHERE title = 'Birth Spacing Benefits';
UPDATE health_content SET download_count = 1050 WHERE title = 'Contraceptive Options';
UPDATE health_content SET download_count = 780 WHERE title = 'Reproductive Health Education';
UPDATE health_content SET download_count = 560 WHERE title = 'Counseling for Couples';

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify setup)
-- ============================================================================

-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

