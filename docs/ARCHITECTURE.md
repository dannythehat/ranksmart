# 🏗️ RankSmart 2.0 - Technical Architecture

**Last Updated**: November 8, 2025  
**Architecture**: Modern Web (GitHub Pages + Vercel Serverless + Supabase)  
**Philosophy**: Simple, scalable, serverless

---

## 🎯 Architecture Overview

RankSmart 2.0 is built with a **modern serverless architecture** that eliminates server management while providing enterprise-grade performance and scalability.

```
┌─────────────────────────────────────────────────────────────┐
│                         USER BROWSER                         │
│                    (Progressive Web App)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    GITHUB PAGES (CDN)                        │
│              Static Frontend (HTML/CSS/JS)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Landing │  │Dashboard │  │  Audit   │  │ Optimize │   │
│  │   Page   │  │   UI     │  │  Report  │  │   UI     │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ REST API
                         │
┌────────────────────────▼────────────────────────────────────┐
│              VERCEL SERVERLESS FUNCTIONS                     │
│                    (Node.js Runtime)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │  Audit   │  │ Optimize │  │Integrate │   │
│  │   API    │  │   API    │  │   API    │  │   API    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────┬────────────┬────────────┬────────────┬───────────────┘
      │            │            │            │
      │            │            │            │
┌─────▼────┐  ┌───▼─────┐  ┌──▼──────┐  ┌─▼──────────┐
│ Supabase │  │ Gemini  │  │Firecrawl│  │  External  │
│   (DB)   │  │   AI    │  │ Scraper │  │    APIs    │
└──────────┘  └─────────┘  └─────────┘  └────────────┘
```

---

## 🎨 Frontend Architecture (GitHub Pages)

### Technology Stack
- **HTML5**: Semantic markup, accessibility
- **CSS3**: Modern layouts (Grid, Flexbox), animations
- **Vanilla JavaScript**: No framework overhead, fast loading
- **Progressive Web App**: Installable, offline-capable

### Directory Structure
```
public/
├── index.html              # Landing page
├── dashboard.html          # Main dashboard
├── audit.html             # Audit results page
├── optimize.html          # Content optimization
├── settings.html          # User settings
├── pricing.html           # Pricing page
│
├── css/
│   ├── main.css           # Global styles & CSS variables
│   ├── components.css     # Reusable UI components
│   ├── dashboard.css      # Dashboard-specific styles
│   ├── audit.css          # Audit page styles
│   └── responsive.css     # Media queries
│
├── js/
│   ├── app.js             # Main application logic
│   ├── api.js             # API client & HTTP requests
│   ├── auth.js            # Authentication & session
│   ├── router.js          # Client-side routing
│   ├── audit.js           # Audit functionality
│   ├── optimize.js        # Optimization features
│   ├── components/
│   │   ├── navbar.js      # Navigation component
│   │   ├── modal.js       # Modal dialogs
│   │   ├── toast.js       # Notifications
│   │   └── charts.js      # Data visualization
│   └── utils/
│       ├── validators.js  # Input validation
│       ├── formatters.js  # Data formatting
│       └── helpers.js     # Utility functions
│
└── assets/
    ├── images/
    │   ├── logo.svg
    │   ├── hero.png
    │   └── icons/
    ├── fonts/
    │   └── inter/         # Modern sans-serif
    └── manifest.json      # PWA manifest
```

### Design System

#### Color Palette
```css
:root {
  /* Primary Colors */
  --primary-50: #f0f9ff;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  
  /* Semantic Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Neutral Colors */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-500: #6b7280;
  --gray-900: #111827;
  
  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  
  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```

#### Component Library
- **Buttons**: Primary, secondary, ghost, danger
- **Forms**: Input, textarea, select, checkbox, radio
- **Cards**: Content containers with shadows
- **Modals**: Overlay dialogs
- **Toasts**: Notification messages
- **Tables**: Data display with sorting
- **Charts**: Score visualization
- **Badges**: Status indicators
- **Loaders**: Loading states

### State Management
```javascript
// Simple global state (no framework needed)
const AppState = {
  user: null,
  currentAudit: null,
  audits: [],
  settings: {},
  
  // State updates trigger UI re-renders
  setState(key, value) {
    this[key] = value;
    this.notify(key);
  },
  
  // Observer pattern for reactivity
  observers: {},
  subscribe(key, callback) {
    if (!this.observers[key]) this.observers[key] = [];
    this.observers[key].push(callback);
  },
  notify(key) {
    if (this.observers[key]) {
      this.observers[key].forEach(cb => cb(this[key]));
    }
  }
};
```

---

## ⚡ Backend Architecture (Vercel Serverless)

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Vercel Serverless Functions
- **API Style**: RESTful
- **Authentication**: JWT tokens
- **Rate Limiting**: Vercel Edge Config

### API Structure
```
api/
├── auth/
│   ├── login.js           # POST /api/auth/login
│   ├── signup.js          # POST /api/auth/signup
│   ├── verify.js          # POST /api/auth/verify
│   └── refresh.js         # POST /api/auth/refresh
│
├── audit/
│   ├── scan.js            # POST /api/audit/scan
│   ├── analyze.js         # POST /api/audit/analyze
│   ├── serp.js            # POST /api/audit/serp
│   ├── report.js          # GET /api/audit/report/:id
│   └── list.js            # GET /api/audit/list
│
├── optimize/
│   ├── fix.js             # POST /api/optimize/fix
│   ├── rewrite.js         # POST /api/optimize/rewrite
│   ├── images.js          # POST /api/optimize/images
│   └── export.js          # GET /api/optimize/export/:id
│
├── integrations/
│   ├── wordpress.js       # POST /api/integrations/wordpress
│   ├── webflow.js         # POST /api/integrations/webflow
│   └── webhooks.js        # POST /api/integrations/webhooks
│
├── billing/
│   ├── checkout.js        # POST /api/billing/checkout
│   ├── webhook.js         # POST /api/billing/webhook
│   └── usage.js           # GET /api/billing/usage
│
└── utils/
    ├── db.js              # Database helpers
    ├── ai.js              # AI service wrappers
    ├── validators.js      # Input validation
    └── middleware.js      # Auth, rate limiting
```

### API Endpoint Examples

#### Authentication
```javascript
// api/auth/login.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }
  
  // Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  return res.status(200).json({
    user: data.user,
    token: data.session.access_token
  });
}
```

#### Audit Scan
```javascript
// api/audit/scan.js
export default async function handler(req, res) {
  // Verify authentication
  const user = await verifyToken(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Check rate limits
  const canProceed = await checkRateLimit(user.id);
  if (!canProceed) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  
  const { url } = req.body;
  
  // Scrape page with Firecrawl
  const pageData = await firecrawl.scrape(url);
  
  // Analyze with Gemini
  const analysis = await gemini.analyze(pageData);
  
  // Calculate E-E-A-T scores
  const scores = calculateEEATScores(analysis);
  
  // Save to database
  const audit = await db.audits.create({
    user_id: user.id,
    url,
    scores,
    analysis,
    created_at: new Date()
  });
  
  return res.status(200).json({ audit });
}
```

### Middleware

#### Authentication Middleware
```javascript
// api/utils/middleware.js
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const { data: user, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  req.user = user;
  next();
}
```

#### Rate Limiting
```javascript
export async function rateLimit(req, res, next) {
  const userId = req.user.id;
  const key = `ratelimit:${userId}`;
  
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, 60); // 1 minute window
  }
  
  if (count > 60) { // 60 requests per minute
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      retryAfter: await redis.ttl(key)
    });
  }
  
  next();
}
```

---

## 🗄️ Database Architecture (Supabase)

### Schema Design

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'starter',
  api_key VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Audits table
CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  
  -- E-E-A-T Scores
  experience_score INTEGER,
  expertise_score INTEGER,
  authoritativeness_score INTEGER,
  trustworthiness_score INTEGER,
  overall_score INTEGER,
  
  -- Analysis data
  issues JSONB,
  serp_data JSONB,
  metadata JSONB,
  
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Optimized content table
CREATE TABLE optimized_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  original_content TEXT,
  optimized_content TEXT,
  mode VARCHAR(10), -- 'fix' or 'rewrite'
  
  improvements JSONB,
  score_before INTEGER,
  score_after INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- API keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service VARCHAR(50) NOT NULL,
  key_encrypted TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage tracking
CREATE TABLE usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  scans_used INTEGER DEFAULT 0,
  scans_limit INTEGER DEFAULT 50,
  
  period_start DATE,
  period_end DATE,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Webhooks table
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  service VARCHAR(50), -- 'slack', 'discord', 'webhook'
  url TEXT NOT NULL,
  events TEXT[], -- ['audit.complete', 'optimize.complete']
  
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audits_user_id ON audits(user_id);
CREATE INDEX idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX idx_content_audit_id ON optimized_content(audit_id);
CREATE INDEX idx_usage_user_id ON usage(user_id);
```

### Row-Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimized_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own audits
CREATE POLICY "Users can view own audits"
  ON audits FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only create their own audits
CREATE POLICY "Users can create own audits"
  ON audits FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 🤖 AI Integration Architecture

### Google Gemini Integration

```javascript
// api/utils/ai.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function analyzeContent(content, url) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const prompt = `
    Analyze this webpage content for SEO and E-E-A-T:
    URL: ${url}
    Content: ${content}
    
    Provide:
    1. E-E-A-T scores (0-100 each)
    2. SEO issues (categorized by priority)
    3. Content quality assessment
    4. Improvement suggestions
    
    Return as JSON.
  `;
  
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return JSON.parse(response.text());
}

export async function fixArticle(content, issues) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const prompt = `
    Fix these SEO issues in the content while preserving voice and style:
    
    Original Content:
    ${content}
    
    Issues to Fix:
    ${JSON.stringify(issues)}
    
    Return improved content.
  `;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function rewriteContent(competitorContent, targetKeywords) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const prompt = `
    Rewrite this competitor content with better SEO:
    
    Competitor Content:
    ${competitorContent}
    
    Target Keywords:
    ${targetKeywords.join(', ')}
    
    Requirements:
    - 100% unique content
    - Better SEO optimization
    - Natural, engaging writing
    - Include target keywords naturally
    
    Return rewritten content.
  `;
  
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

### Firecrawl Integration

```javascript
// api/utils/scraper.js
import FirecrawlApp from '@mendable/firecrawl-js';

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY
});

export async function scrapePage(url) {
  const result = await firecrawl.scrapeUrl(url, {
    formats: ['markdown', 'html'],
    onlyMainContent: true
  });
  
  return {
    url: result.url,
    title: result.metadata.title,
    description: result.metadata.description,
    content: result.markdown,
    html: result.html,
    metadata: result.metadata
  };
}

export async function crawlSite(url, maxPages = 100) {
  const result = await firecrawl.crawlUrl(url, {
    limit: maxPages,
    scrapeOptions: {
      formats: ['markdown'],
      onlyMainContent: true
    }
  });
  
  return result.data;
}
```

---

## 🔒 Security Architecture

### Authentication Flow
1. User signs up/logs in via Supabase Auth
2. Supabase returns JWT token
3. Frontend stores token in localStorage
4. All API requests include token in Authorization header
5. Backend verifies token with Supabase
6. Row-level security enforces data access

### API Key Management
- User API keys encrypted at rest
- Never exposed to frontend
- Stored in Supabase with encryption
- Accessed only by serverless functions

### Rate Limiting
- Per-user limits based on plan
- Vercel Edge Config for fast lookups
- Graceful degradation with retry-after headers

### CORS Configuration
```javascript
// vercel.json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "https://ranksmart.io" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,PUT,DELETE" },
        { "key": "Access-Control-Allow-Headers", "value": "Authorization,Content-Type" }
      ]
    }
  ]
}
```

---

## 📊 Performance Optimization

### Frontend
- **Code splitting**: Load JS on demand
- **Image optimization**: WebP format, lazy loading
- **CSS optimization**: Critical CSS inline
- **Caching**: Service worker for offline support
- **CDN**: GitHub Pages global CDN

### Backend
- **Cold start optimization**: Minimal dependencies
- **Response caching**: Cache audit results
- **Database indexing**: Fast queries
- **Connection pooling**: Supabase connection pool

### Monitoring
- **Vercel Analytics**: Performance metrics
- **Supabase Logs**: Database queries
- **Error tracking**: Sentry integration
- **Uptime monitoring**: UptimeRobot

---

## 🚀 Deployment Architecture

### GitHub Pages (Frontend)
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

### Vercel (Backend)
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "GOOGLE_API_KEY": "@google-api-key",
    "FIRECRAWL_API_KEY": "@firecrawl-api-key",
    "SUPABASE_URL": "@supabase-url",
    "SUPABASE_KEY": "@supabase-key"
  }
}
```

---

## 📈 Scalability

### Current Capacity
- **Frontend**: Unlimited (GitHub Pages CDN)
- **Backend**: Auto-scaling (Vercel)
- **Database**: 500MB free (Supabase)
- **API Calls**: Based on plan limits

### Growth Strategy
- **Month 1-3**: Free tiers sufficient
- **Month 4-6**: Upgrade to paid plans
- **Month 7-12**: Enterprise infrastructure
- **Year 2+**: Custom infrastructure if needed

---

**Architecture designed for simplicity, scalability, and zero server management! 🚀**
