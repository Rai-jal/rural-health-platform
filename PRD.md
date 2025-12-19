# Product Requirements Document (PRD)
## HealthConnect - Health for Women

**Version:** 1.0  
**Last Updated:** 2025  
**Status:** Production

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [User Roles & Personas](#user-roles--personas)
4. [Core Features](#core-features)
5. [User Workflows](#user-workflows)
6. [Technical Architecture](#technical-architecture)
7. [Success Metrics](#success-metrics)
8. [Future Enhancements](#future-enhancements)

---

## Executive Summary

**HealthConnect** is a comprehensive digital health platform designed to bridge healthcare gaps for women in Sierra Leone and sub-Saharan Africa. The platform enables virtual consultations, health education, community support, and mobile payments, accessible via smartphones, feature phones (USSD), and voice calls.

### Problem Statement

Women in Sierra Leone face significant barriers to healthcare access:
- Limited physical access to healthcare facilities
- High costs of transportation and consultation fees
- Language barriers (multiple local languages)
- Low literacy rates
- Limited internet connectivity
- Cultural and social barriers

### Solution

A multi-channel healthcare platform that:
- Provides virtual consultations via video, voice, or SMS
- Delivers health education in local languages
- Facilitates community support groups
- Enables affordable mobile payments
- Works with limited internet connectivity
- Supports multiple access methods (smartphone, USSD, voice)

---

## Product Overview

### Vision

To make quality healthcare accessible to every woman, regardless of location, language, or device.

### Mission

Empower women with accessible, affordable, and culturally appropriate healthcare services through technology.

### Target Users

1. **Primary:** Women in Sierra Leone (ages 15-50)
2. **Secondary:** Healthcare providers serving communities
3. **Tertiary:** Healthcare administrators and content creators

### Key Value Propositions

- **Accessibility:** Multiple access channels (web, USSD, voice)
- **Affordability:** Low-cost consultations and mobile payments
- **Localization:** Multi-language support (English, Krio, Mende, Temne, Limba)
- **Offline Capability:** Works with limited connectivity
- **Community:** Peer support and health advocacy

---

## User Roles & Personas

### 1. Patient (Woman)

**Demographics:**
- Age: 15-50 years
- Location: Sierra Leone
- Education: Varies (some illiterate)
- Device: Smartphone or feature phone
- Language: Prefers local languages (Krio, Mende, Temne, Limba)

**Goals:**
- Access healthcare without traveling long distances
- Learn about maternal and child health
- Connect with other women facing similar challenges
- Make affordable payments

**Pain Points:**
- Limited internet connectivity
- Language barriers
- Low digital literacy
- Financial constraints

### 2. Healthcare Provider (Doctor/Nurse)

**Demographics:**
- Medical professionals (doctors, nurses, midwives)
- Serving communities
- May work in clinics or mobile units

**Goals:**
- Provide quality care remotely
- Manage patient consultations efficiently
- Track patient history
- Access professional resources

**Pain Points:**
- Limited time
- Need for patient history access
- Payment processing

### 3. Administrator

**Demographics:**
- Platform administrators
- Healthcare system managers
- Content managers

**Goals:**
- Manage platform users and providers
- Monitor system performance
- Manage health content
- Process payments and refunds
- Generate reports

**Pain Points:**
- Need for comprehensive oversight
- Data management
- User support

---

## Core Features

### 1. Virtual Consultations

**Description:** Patients can book and attend consultations with healthcare providers via video, voice, or SMS.

**Key Capabilities:**
- Browse available healthcare providers
- Filter by specialty, language, availability
- Select consultation type (video/voice/SMS)
- Book appointments
- View consultation history
- Access consultation details

**User Stories:**
- As a patient, I want to book a video consultation so I can see my doctor face-to-face
- As a patient, I want to book an SMS consultation so I can use my basic phone
- As a doctor, I want to see my upcoming consultations so I can prepare
- As a doctor, I want to update consultation status so patients know what's happening

### 2. Health Education

**Description:** Audio and visual health content in multiple languages covering maternal health, childcare, nutrition, and hygiene.

**Key Capabilities:**
- Browse health content by category
- Filter by language
- Search content
- Download for offline access
- Track download counts
- Rate content

**User Stories:**
- As a patient, I want to learn about prenatal care in my language
- As a patient, I want to download content for offline viewing
- As an admin, I want to manage health content so users have up-to-date information

### 3. Community Support

**Description:** Support groups and health events connecting women with peers and health advocates.

**Key Capabilities:**
- Browse community groups
- View group details and moderators
- Browse upcoming health events
- Filter by category and language
- Join groups (future feature)

**User Stories:**
- As a patient, I want to find support groups for new mothers
- As a patient, I want to see upcoming health workshops
- As an admin, I want to create community groups

### 4. Mobile Payments

**Description:** Secure payment processing via mobile money (Orange Money, Africell Money, QMoney) and bank transfers.

**Key Capabilities:**
- Make payments for consultations
- View payment history
- Receive payment instructions
- Process refunds (admin)
- Track payment status

**User Stories:**
- As a patient, I want to pay for my consultation using mobile money
- As a patient, I want to see my payment history
- As an admin, I want to process refunds when needed

### 5. User Management

**Description:** Comprehensive user and provider management system.

**Key Capabilities:**
- User registration and authentication
- Role-based access control
- Profile management
- Provider onboarding with login credentials
- User search and filtering

**User Stories:**
- As an admin, I want to add healthcare providers with login credentials
- As an admin, I want to manage user roles
- As a user, I want to update my profile information

---

## User Workflows

### Workflow 1: Patient Registration & First Consultation

```
1. Patient visits homepage
   ↓
2. Clicks "Sign Up" or "Book Consultation"
   ↓
3. If not registered:
   - Redirected to signup page
   - Enters: email, password, full name, phone, location, age, preferred language
   - Account created
   ↓
4. Redirected to login page
   ↓
5. Logs in with credentials
   ↓
6. Redirected to consultation booking page
   ↓
7. Views available healthcare providers
   - Sees provider name, specialty, languages, rating, availability
   - Can filter by specialty, language
   ↓
8. Selects a provider
   ↓
9. Chooses consultation type:
   - Video Call (Le 15,000)
   - Voice Call (Le 10,000)
   - SMS Consultation (Le 5,000)
   ↓
10. Fills consultation form:
    - Symptoms/reason for consultation
    - Preferred language
    - Scheduled date/time
   ↓
11. Submits booking
   ↓
12. Payment flow initiated:
    - Payment instructions displayed
    - Transaction ID generated
    - Payment gateway integration (mock/real)
   ↓
13. Consultation created (status: "scheduled")
   ↓
14. Confirmation message displayed
   ↓
15. Patient can:
    - View consultation in dashboard
    - Complete payment
    - Receive SMS confirmation (future)
```

### Workflow 2: Healthcare Provider Daily Operations

```
1. Provider logs in to doctor dashboard
   ↓
2. Views dashboard overview:
   - Total consultations
   - Upcoming consultations
   - Total patients
   - Recent activity
   ↓
3. Navigates to "My Consultations"
   ↓
4. Views consultation list:
   - Scheduled consultations
   - In-progress consultations
   - Completed consultations
   - Can filter by status
   ↓
5. Opens a consultation:
   - Views patient details
   - Views consultation type and scheduled time
   - Views symptoms/reason
   ↓
6. Updates consultation:
   - Changes status (scheduled → in_progress → completed)
   - Adds notes
   - Updates duration
   ↓
7. Navigates to "My Patients"
   ↓
8. Views patient list:
   - Patients who have consulted with them
   - Patient details
   - Consultation history per patient
   ↓
9. Updates professional profile:
   - Specialty
   - Languages
   - Experience
   - Availability status
   ↓
10. Logs out
```

### Workflow 3: Admin Provider Management

```
1. Admin logs in to admin dashboard
   ↓
2. Navigates to "Healthcare Providers"
   ↓
3. Views provider list:
   - All providers in system
   - Can search by name or specialty
   - Sees availability status
   ↓
4. Clicks "Add Provider"
   ↓
5. Fills provider form:
   - Basic Info:
     * Full Name (required)
     * Specialty (required)
     * Languages (comma-separated)
     * Experience Years
     * Location
     * Availability checkbox
   - Login Credentials (optional):
     * Email (required if creating account)
     * Password (required if creating account)
     * Confirm Password
   ↓
6. Client-side validation:
   - Password strength checked
   - Password match verified
   - Email format validated
   ↓
7. Submits form
   ↓
8. Server processes:
   - If email/password provided:
     a. Creates Supabase Auth user
     b. Creates user profile (role: Doctor)
     c. Creates healthcare provider profile
     d. Links provider to user via user_id
     e. Sends welcome email
   - If no credentials:
     a. Creates healthcare provider profile only
   ↓
9. Success message displayed
   ↓
10. Provider appears in list
    ↓
11. If credentials provided:
    - Provider can log in immediately
    - Has access to doctor dashboard
```

### Workflow 4: Patient Health Education Access

```
1. Patient navigates to "Education" page
   ↓
2. Views health content:
   - Categories: Maternal, Childcare, Nutrition, Hygiene, Family Planning
   - Can filter by category
   - Can filter by language
   - Can search by keyword
   ↓
3. Selects a content item
   ↓
4. Views content details:
   - Title and description
   - Category and language
   - Duration
   - Rating and download count
   - Topics covered
   - Offline availability
   ↓
5. Clicks "Download" or "Play"
   ↓
6. If download:
   - Download count incremented
   - Content available offline
   ↓
7. If play:
   - Content plays in browser/player
   ↓
8. Can rate content (future)
```

### Workflow 5: Payment Processing

```
1. Patient books consultation
   ↓
2. Payment required
   ↓
3. Payment instructions displayed:
   - Amount in Leones
   - Payment method options
   - Transaction ID
   ↓
4. Patient selects payment method:
   - Orange Money
   - Africell Money
   - QMoney
   - Bank Transfer
   - Cash
   ↓
5. Payment gateway processes:
   - For mobile money: USSD instructions
   - For bank: Account details
   - For cash: Payment location
   ↓
6. Payment status updated:
   - Pending → Processing → Completed/Failed
   ↓
7. If successful:
   - Consultation confirmed
   - Receipt generated
   - SMS confirmation sent (future)
   ↓
8. Patient can view payment in "Payment History"
```

### Workflow 6: Admin Content Management

```
1. Admin navigates to "Health Content"
   ↓
2. Views all health content:
   - Can search by title/description
   - Can filter by category
   - Can filter by language
   ↓
3. Clicks "Add Content"
   ↓
4. Fills content form:
   - Title (required)
   - Description
   - Category (required)
   - Content Type (audio/video/text)
   - Language (required)
   - Duration (minutes)
   - Topics (array)
   - Offline Available (checkbox)
   ↓
5. Uploads content file (if applicable)
   ↓
6. Submits form
   ↓
7. Content created and appears in list
   ↓
8. Can edit or delete content
```

### Workflow 7: Consultation Details View

```
1. Patient/Doctor clicks on a consultation
   ↓
2. Views consultation details page:
   - Consultation ID
   - Status badge
   - Provider information (if patient)
   - Patient information (if doctor)
   - Consultation type
   - Scheduled date/time
   - Duration (if completed)
   - Cost
   - Payment status
   - Symptoms/reason
   - Notes (if doctor added)
   ↓
3. Actions available:
   - Patient: Complete payment, Cancel consultation
   - Doctor: Update status, Add notes, Mark complete
   - Admin: View all details, Process refund
```

---

## Technical Architecture

### Technology Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Lucide React icons

**Backend:**
- Next.js API Routes
- Supabase (PostgreSQL database)
- Supabase Auth
- Row Level Security (RLS)

**Payment:**
- Payment Gateway Service (Orange Money, Africell Money, QMoney)
- Mock implementation (ready for production integration)

**Deployment:**
- Vercel (recommended)
- Environment variables via `.env.local`

### Database Schema

**Core Tables:**
- `users` - User profiles linked to auth.users
- `healthcare_providers` - Provider profiles (linked to users via user_id)
- `consultations` - Consultation records
- `payments` - Payment transactions
- `health_content` - Health education content
- `community_groups` - Support groups
- `events` - Health events

**Key Relationships:**
- `users.id` ← `healthcare_providers.user_id` (one-to-one)
- `users.id` ← `consultations.user_id` (one-to-many)
- `healthcare_providers.id` ← `consultations.provider_id` (one-to-many)
- `consultations.id` ← `payments.consultation_id` (one-to-many)

### Authentication & Authorization

**Authentication:**
- Supabase Auth (email/password)
- Session-based authentication
- Auto-profile creation on signup

**Authorization:**
- Role-based access control (RBAC)
- Three roles: Patient, Doctor, Admin
- Route protection via middleware
- API route protection via `authGuard`

**Security:**
- Row Level Security (RLS) policies
- Service role key for admin operations (server-side only)
- Password validation (client + server)
- Input sanitization

### API Structure

**Public Endpoints:**
- `GET /api/healthcare-providers` - List providers
- `GET /api/health-content` - List health content
- `GET /api/community/groups` - List community groups
- `GET /api/community/events` - List events

**Authenticated Endpoints:**
- `GET /api/user/profile` - Get own profile
- `PATCH /api/user/profile` - Update own profile
- `GET /api/patient/consultations` - Patient's consultations
- `GET /api/patient/stats` - Patient statistics

**Doctor Endpoints:**
- `GET /api/doctor/stats` - Doctor statistics
- `GET /api/doctor/consultations` - Doctor's consultations
- `GET /api/doctor/patients` - Doctor's patients
- `GET /api/doctor/profile` - Doctor profile
- `PATCH /api/doctor/profile` - Update doctor profile

**Admin Endpoints:**
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `GET /api/admin/providers` - List all providers
- `POST /api/admin/providers` - Create provider (with auth)
- `GET /api/admin/consultations` - List all consultations
- `GET /api/admin/payments` - List all payments
- `POST /api/admin/payments/[id]/refund` - Process refund

---

## Success Metrics

### User Engagement

- **Monthly Active Users (MAU)**
- **Consultation Booking Rate** - % of registered users who book consultations
- **Content Download Rate** - % of users who download health content
- **Return User Rate** - % of users who return within 30 days

### Healthcare Delivery

- **Consultations Completed** - Total consultations per month
- **Average Consultation Duration** - Time per consultation
- **Provider Utilization Rate** - % of providers with active consultations
- **Patient Satisfaction** - Average rating (future feature)

### Financial

- **Payment Success Rate** - % of successful payments
- **Revenue per User** - Average payment per user
- **Refund Rate** - % of consultations refunded

### Technical

- **API Response Time** - Average response time < 500ms
- **Uptime** - System availability > 99.5%
- **Error Rate** - < 1% of requests

### Accessibility

- **Multi-language Usage** - Distribution across languages
- **Device Type Distribution** - Smartphone vs feature phone usage
- **Offline Content Downloads** - Number of offline downloads

---

## Future Enhancements

### Phase 2 Features

1. **Real-time Consultations**
   - WebRTC integration for video calls
   - Voice call integration
   - SMS gateway integration

2. **Notifications**
   - Email notifications
   - SMS notifications
   - Push notifications (PWA)

3. **Advanced Search**
   - Full-text search
   - Provider recommendations
   - Content recommendations

4. **Community Features**
   - Group joining
   - Discussion forums
   - Event registration

5. **Analytics Dashboard**
   - Patient analytics
   - Provider analytics
   - Content performance
   - Financial reports

### Phase 3 Features

1. **AI-Powered Features**
   - Symptom checker
   - Health recommendations
   - Content personalization

2. **Telemedicine Integration**
   - Prescription management
   - Lab result integration
   - Referral system

3. **Mobile App**
   - Native iOS/Android apps
   - Offline-first architecture
   - Background sync

4. **USSD Integration**
   - Feature phone support
   - SMS consultations via USSD
   - Payment via USSD

5. **Voice Integration (IVR)**
   - Interactive voice response
   - Voice-based navigation
   - Audio content playback

---

## Appendix

### User Flow Diagrams

**Patient Journey:**
```
Homepage → Sign Up → Login → Dashboard → Book Consultation → 
Select Provider → Choose Type → Fill Form → Payment → 
Consultation Scheduled → Attend Consultation → View History
```

**Provider Journey:**
```
Login → Dashboard → View Consultations → Update Status → 
Add Notes → View Patients → Update Profile
```

**Admin Journey:**
```
Login → Dashboard → Manage Users → Manage Providers → 
Manage Content → View Reports → Process Payments
```

### Key Definitions

- **Consultation:** A healthcare interaction between a patient and provider
- **Provider:** A healthcare professional (doctor, nurse, midwife)
- **Health Content:** Educational materials (audio, video, text)
- **Community Group:** A support group for patients
- **Event:** A health workshop or seminar
- **Payment Gateway:** Service for processing mobile money payments

### Support & Contact

For technical support or questions about this PRD, please contact the development team.

---

**Document Status:** ✅ Complete  
**Next Review Date:** Quarterly  
**Owner:** Product Team

