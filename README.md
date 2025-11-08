# 🚀 RankSmart 2.0 - AI-Powered SEO Content Optimizer

> **The Ultimate AI SEO Tool for iGaming Affiliates & Webmasters**

Transform your content from good to exceptional with AI-powered SEO analysis, automated fixes, and intelligent content rewriting.

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

```
ranksmart/
├── src/
│   ├── agents/              # AI Agent System
│   │   ├── audit/           # Page auditing agents
│   │   ├── analysis/        # SERP & competitor analysis
│   │   ├── optimization/    # Content optimization agents
│   │   ├── compliance/      # iGaming regulation checks
│   │   └── orchestrator/    # Multi-agent coordination
│   │
│   ├── api/                 # REST API & Webhooks
│   │   ├── routes/          # API endpoints
│   │   ├── integrations/    # CMS connectors (WordPress, Webflow)
│   │   └── webhooks/        # Slack, Discord notifications
│   │
│   ├── core/                # Business Logic
│   │   ├── scoring/         # E-E-A-T & SEO scoring
│   │   ├── content/         # Content processing
│   │   └── database/        # Data models & storage
│   │
│   ├── ui/                  # Web Interface
│   │   ├── dashboard/       # Main dashboard
│   │   ├── components/      # Reusable UI components
│   │   └── assets/          # Static files
│   │
│   └── utils/               # Shared utilities
│       ├── scrapers/        # Web scraping tools
│       ├── validators/      # Input validation
│       └── helpers/         # Common functions
│
├── tests/                   # Test suite
├── docs/                    # Documentation
├── config/                  # Configuration files
├── scripts/                 # Deployment & maintenance scripts
├── .env.example             # Environment variables template
├── requirements.txt         # Python dependencies
├── docker-compose.yml       # Docker setup
└── pyproject.toml          # Project metadata
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ (for Firecrawl MCP)
- API Keys: Google Gemini, Firecrawl, (optional) Flux for images

### Installation

```bash
# Clone repository
git clone https://github.com/dannythehat/ranksmart.git
cd ranksmart

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Run database migrations
python scripts/setup_db.py

# Start the application
python src/main.py
```

Visit `http://localhost:8000` to access the dashboard.

---

## 🎯 Roadmap

### Phase 1: Foundation (Weeks 1-2) ✅
- [x] Clean project structure
- [ ] E-E-A-T scoring system
- [ ] Issue categorization (P0/P1/P2)
- [ ] Basic web UI

### Phase 2: Core Features (Weeks 3-4)
- [ ] Mode A: Fix My Article
- [ ] Before/after comparison
- [ ] Export updated content
- [ ] Database storage

### Phase 3: Advanced Features (Weeks 5-6)
- [ ] Mode B: Rewrite Competitor Content
- [ ] AI image generation
- [ ] iGaming compliance checker
- [ ] Regulation database

### Phase 4: Enterprise (Weeks 7-8)
- [ ] Bulk site scanning
- [ ] Auto-fix automation
- [ ] API endpoints
- [ ] CMS integrations

### Phase 5: Integrations (Weeks 9-10)
- [ ] WordPress plugin
- [ ] Webflow integration
- [ ] Slack/Discord notifications
- [ ] Team collaboration features

---

## 💰 Pricing (Planned)

| Plan | Price | Features |
|------|-------|----------|
| **Starter** | $49/mo | 50 scans, Mode A, Manual fixes |
| **Professional** | $149/mo | 200 scans, Mode A+B, AI images, Compliance |
| **Enterprise** | $499/mo | Unlimited, Bulk scanning, Auto-fix, API, White-label |

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
- [Google ADK](https://github.com/google/adk) - Multi-agent framework
- [Gemini 2.5 Flash](https://ai.google.dev/) - AI intelligence
- [Firecrawl](https://firecrawl.dev/) - Web scraping
- [Flux](https://fal.ai/) - AI image generation

---

## 📧 Contact

**Danny** - [@dannythehat](https://github.com/dannythehat)

Project Link: [https://github.com/dannythehat/ranksmart](https://github.com/dannythehat/ranksmart)

---

**⭐ Star this repo if you find it useful!**
