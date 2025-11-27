-- Insert sample healthcare providers
INSERT INTO healthcare_providers (full_name, specialty, languages, experience_years, rating, total_consultations, location) VALUES
('Dr. Fatima Kamara', 'Maternal Health', ARRAY['English', 'Krio', 'Mende'], 8, 4.9, 150, 'Freetown'),
('Dr. Aminata Sesay', 'General Practice', ARRAY['English', 'Krio', 'Temne'], 12, 4.8, 200, 'Bo'),
('Dr. Mariama Bangura', 'Women''s Health', ARRAY['English', 'Krio', 'Limba'], 6, 4.9, 120, 'Makeni'),
('Nurse Sarah Kamara', 'Community Health', ARRAY['English', 'Krio'], 5, 4.7, 180, 'Kenema'),
('Midwife Fatima Sesay', 'Maternal Care', ARRAY['Mende', 'English'], 10, 4.8, 250, 'Bo'),
('Nutritionist Adama Bangura', 'Child Nutrition', ARRAY['Temne', 'English'], 4, 4.9, 90, 'Port Loko');

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
('Counseling for Couples', 'Family planning counseling and communication for couples', 'family', 'audio', 'English/Krio', 16, 4.7, true, ARRAY['Couples Counseling', 'Communication', 'Family Planning']);

-- Insert sample community groups
INSERT INTO community_groups (name, description, category, language, location, moderator_id, member_count) VALUES
('New Mothers Support', 'Support group for new mothers sharing experiences and advice', 'Maternal Health', 'English/Krio', 'Freetown & Rural Areas', (SELECT id FROM healthcare_providers WHERE full_name = 'Nurse Sarah Kamara'), 245),
('Pregnancy Journey', 'Expecting mothers sharing their pregnancy experiences', 'Pregnancy', 'Mende/English', 'Bo District', (SELECT id FROM healthcare_providers WHERE full_name = 'Midwife Fatima Sesay'), 189),
('Child Nutrition Circle', 'Discussing healthy nutrition for children using local foods', 'Child Health', 'Temne/English', 'Port Loko District', (SELECT id FROM healthcare_providers WHERE full_name = 'Nutritionist Adama Bangura'), 156),
('Women''s Wellness', 'General health and wellness discussions for rural women', 'General Health', 'English/Krio/Limba', 'Nationwide', (SELECT id FROM healthcare_providers WHERE full_name = 'Dr. Aminata Sesay'), 312);

-- Insert sample events
INSERT INTO events (title, description, event_type, location, scheduled_at, duration_minutes, max_attendees, organizer_id, is_virtual) VALUES
('Maternal Health Workshop', 'Learn about prenatal care and safe delivery practices', 'Workshop', 'Community Center, Freetown', NOW() + INTERVAL '1 day', 120, 50, (SELECT id FROM healthcare_providers WHERE full_name = 'Dr. Fatima Kamara'), true),
('Breastfeeding Support Circle', 'Support group for breastfeeding mothers', 'Support Group', 'Health Post, Bo', NOW() + INTERVAL '3 days', 90, 30, (SELECT id FROM healthcare_providers WHERE full_name = 'Midwife Fatima Sesay'), false),
('Child Vaccination Drive', 'Free vaccinations for children under 5', 'Health Service', 'Mobile Clinic, Makeni', NOW() + INTERVAL '5 days', 240, 100, (SELECT id FROM healthcare_providers WHERE full_name = 'Dr. Mariama Bangura'), false);

-- Insert sample users
INSERT INTO users (phone_number, full_name, age, preferred_language, location) VALUES
('+23276123456', 'Aminata Koroma', 28, 'Krio', 'Freetown'),
('+23277234567', 'Fatima Bangura', 32, 'Mende', 'Bo'),
('+23278345678', 'Mariama Sesay', 25, 'Temne', 'Makeni'),
('+23279456789', 'Adama Kamara', 30, 'English', 'Kenema');

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
