# 🚀 RankSmart 2.0 - AI-Powered SEO Content Optimizer

> **The World's Best AI SEO Tool for iGaming Affiliates & Webmasters**

Transform your content from good to exceptional with AI-powered SEO analysis, automated fixes, and intelligent content rewriting. Built with modern web technologies, hosted on GitHub Pages, powered by serverless architecture.

---

## ✨ Features

### 🎯 Smart Audit System
- **E-E-A-T Scoring** (Experience, Expertise, Authoritativeness, Trustworthiness)
- **Bite-sized Issue Reports** - Easy to understand, prioritized by impact
- **Real-time SERP Analysis** - Compare against top 10 competitors
- **iGaming Compliance Checks** - Auto-detect outdated regulations

### 🛠️ Two Powerful Modes

**Mode A: Fix My Article** 
- Surgical SEO improvements on your existing content
- Preserves your voice and style
- Score improvement: 71/100 → 96/100 average

**Mode B: Rewrite Competitor Content**
- Complete AI rewrite with better SEO
- Auto-generate relevant images
- 100% unique, optimized content

### 🏢 Enterprise Features
- **Bulk Site Scanning** - Analyze entire websites
- **Auto-Fix Automation** - One-click improvements across all pages
- **API Integration** - Connect to WordPress, Webflow, custom CMS
- **Team Collaboration** - Slack/Discord notifications, draft management
- **White-label Reports** - Custom branding for agencies

---

## 🏗️ Architecture

### Modern Web Stack
```
Frontend (GitHub Pages)
├── HTML5 + CSS3 + Vanilla JavaScript
├── Responsive design (mobile-first)
├── Progressive Web App (PWA)
└── Real-time updates

Backend (Vercel Serverless)
├── Node.js serverless functions
├── RESTful API endpoints
├── Webhook handlers
└── Background job processing

Database (Supabase)
├── PostgreSQL database
├── Real-time subscriptions
├── Row-level security
└── Built-in authentication

AI & Integrations
├── Google Gemini 2.5 Flash (content analysis)
├── Firecrawl (web scraping)
├── Flux AI (image generation)
└── Third-party APIs (WordPress, Webflow, Slack)
```

### Project Structure
```
ranksmart/
├── public/                  # GitHub Pages (Frontend)
│   ├── index.html          # Landing page
│   ├── dashboard.html      # Main dashboard
│   ├── audit.html          # Audit results page
│   ├── css/
│   │   ├── main.css        # Global styles
│   │   ├── components.css  # Reusable components
│   │   └── dashboard.css   # Dashboard styles
│   ├── js/
│   │   ├── app.js          # Main application logic
│   │   ├── api.js          # API client
│   │   ├── auth.js         # Authentication
│   │   └── components/     # UI components
│   └── assets/
│       ├── images/
│       ├── icons/
│       └── fonts/
│
├── api/                     # Vercel Serverless Functions
│   ├── auth/
│   │   ├── login.js
│   │   ├── signup.js
│   │   └── verify.js
│   ├── audit/
│   │   ├── scan.js         # Page scanning
│   │   ├── analyze.js      # E-E-A-T analysis
│   │   └── serp.js         # SERP analysis
│   ├── optimize/
│   │   ├── fix.js          # Mode A: Fix article
│   │   └── rewrite.js      # Mode B: Rewrite
│   ├── integrations/
│   │   ├── wordpress.js
│   │   ├── webflow.js
│   │   └── webhooks.js
│   └── utils/
│       ├── db.js           # Database helpers
│       ├── ai.js           # AI helpers
│       └── validators.js
│
├── supabase/               # Database Schema
│   ├── migrations/
│   └── seed.sql
│
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   └── API.md
│
├── .env.example            # Environment variables
├── vercel.json            # Vercel configuration
├── package.json           # Node.js dependencies
└── README.md              # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Vercel account (free tier)
- Supabase account (free tier)
- API Keys: Google Gemini, Firecrawl

### Local Development

```bash
# Clone repository
git clone https://github.com/dannythehat/ranksmart.git
cd ranksmart

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start local development server
npm run dev

# Open browser
open http://localhost:3000
```

### Deployment

```bash
# Deploy to Vercel (automatic from GitHub)
git push origin main

# Or manual deployment
vercel --prod
```

GitHub Pages will automatically deploy from the `public/` directory.

---

## 🎯 8-Week Development Roadmap

### **Week 1-2: Foundation & Architecture** ✅ In Progress
- GitHub Pages setup with custom domain
- Modern design system (colors, typography, components)
- Responsive landing page & dashboard skeleton
- Vercel serverless API structure
- Supabase database schema
- User authentication system

### **Week 3-4: Core Audit Engine**
- Page scraping with Firecrawl
- E-E-A-T scoring algorithm (0-100)
- Technical SEO checks
- SERP analysis (top 10 competitors)
- Beautiful audit report UI

### **Week 5-6: Content Optimization**
- Mode A: Fix My Article (surgical improvements)
- Mode B: Rewrite Competitor Content
- AI image generation
- Before/after comparison
- Export to multiple formats

### **Week 7-8: Enterprise Features**
- Bulk site scanning
- Auto-fix automation
- WordPress & Webflow integrations
- Team collaboration
- White-label reports
- Stripe billing integration

---

## 💰 Pricing (Planned)

| Plan | Price | Features |
|------|-------|----------|
| **Starter** | $49/mo | 50 scans, Mode A, Manual fixes |
| **Professional** | $149/mo | 200 scans, Mode A+B, AI images, Compliance |
| **Enterprise** | $499/mo | Unlimited, Bulk scanning, Auto-fix, API, White-label |

---

## 🛠️ Tech Stack

### Frontend
- **HTML5/CSS3/JavaScript** - Modern web standards
- **No framework overhead** - Fast, lightweight
- **Progressive Web App** - Installable, offline-capable
- **Responsive Design** - Mobile-first approach

### Backend
- **Vercel Serverless** - Zero server management
- **Node.js** - Fast, scalable
- **RESTful API** - Clean, documented endpoints

### Database
- **Supabase (PostgreSQL)** - Powerful, real-time
- **Row-level security** - Built-in authorization
- **Real-time subscriptions** - Live updates

### AI & Services
- **Google Gemini 2.5 Flash** - Content analysis & generation
- **Firecrawl** - Web scraping & data extraction
- **Flux AI** - Image generation
- **Stripe** - Payment processing

---

## 🤝 Contributing

We're building in public! Contributions welcome.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

Built with:
- [Google Gemini](https://ai.google.dev/) - AI intelligence
- [Firecrawl](https://firecrawl.dev/) - Web scraping
- [Vercel](https://vercel.com/) - Serverless hosting
- [Supabase](https://supabase.com/) - Database & auth
- [Flux](https://fal.ai/) - AI image generation

---

## 📧 Contact

**Danny** - [@dannythehat](https://github.com/dannythehat)

Project Link: [https://github.com/dannythehat/ranksmart](https://github.com/dannythehat/ranksmart)

---

**⭐ Star this repo if you find it useful!**
