# Rural Health Platform

A comprehensive digital health solution designed for underserved rural women in Sierra Leone and sub-Saharan Africa.

## 🌟 Features

- **Virtual Consultations** - Video, voice, and SMS consultations with healthcare providers
- **Health Education** - Audio and visual content in local languages
- **Mobile Payments** - Integration with mobile money services
- **Community Support** - Support groups and health advocates
- **Offline Access** - Works with limited internet connectivity
- **Multi-platform** - Smartphone app, USSD, SMS, and voice calls

## 🚀 Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Icons**: Lucide React

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (optional for demo)

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/rural-health-platform.git
cd rural-health-platform
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables (optional):
\`\`\`bash
cp .env.example .env.local
\`\`\`

Add your Supabase credentials:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Platform Access Methods

### Smartphone App
- Full-featured web application
- Video consultations
- Interactive health content
- Community features

### Feature Phone (USSD)
- Dial `*123#` for main menu
- SMS consultations
- Health tips via SMS
- Appointment booking

### Voice Calls (IVR)
- Interactive voice response
- Audio health education
- Voice consultations
- Local language support

## 🗄️ Database Setup

If using Supabase:

1. Create a new Supabase project
2. Run the SQL scripts in the `scripts/` folder:
   - `01-create-tables.sql` - Creates database schema
   - `02-seed-data.sql` - Adds sample data

## 🌍 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/rural-health-platform)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Designed for rural women in Sierra Leone and sub-Saharan Africa
- Built with accessibility and low-bandwidth connectivity in mind
- Supports multiple local languages and cultural contexts

## 📞 Support

For support and questions:
- Email: support@healthconnect.sl
- Phone: +232 XX XXX XXXX
- Emergency: 117

---

**Empowering rural women through accessible healthcare technology.**
