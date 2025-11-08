# RankSmart 2.0 - Architecture Documentation

## Overview

RankSmart 2.0 is a multi-agent AI system built with Google's Agent Development Kit (ADK) and Gemini 2.5 Flash. It provides comprehensive SEO auditing, content optimization, and automated fixes for web content.

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │  API Server  │  │  CLI Tools   │      │
│  │  (Streamlit) │  │  (FastAPI)   │  │  (Click)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Agent Orchestrator                       │   │
│  │  (Coordinates multi-agent workflows)                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│     ┌──────────────┬───────┴────────┬──────────────┐        │
│     ▼              ▼                ▼              ▼        │
│  ┌─────┐      ┌─────┐          ┌─────┐        ┌─────┐      │
│  │Audit│      │SERP │          │ Fix │        │Check│      │
│  │Agent│      │Agent│          │Agent│        │Agent│      │
│  └─────┘      └─────┘          └─────┘        └─────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data & Integration Layer                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Database │  │Firecrawl │  │  Google  │  │   Flux   │   │
│  │(SQLite/  │  │   MCP    │  │  Search  │  │    AI    │   │
│  │Postgres) │  │          │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent System

### Agent Hierarchy

**1. Page Auditor Agent**
- **Purpose**: Analyze webpage structure and content
- **Tools**: Firecrawl MCP
- **Output**: PageAuditResult with E-E-A-T score
- **Key Functions**:
  - Extract metadata (title, description, OG tags)
  - Analyze headings structure
  - Count words, paragraphs, sentences
  - Calculate readability scores
  - Identify technical issues
  - Infer target keywords

**2. SERP Analyst Agent**
- **Purpose**: Analyze search engine results
- **Tools**: Google Search API
- **Output**: SERPAnalysis with competitor insights
- **Key Functions**:
  - Fetch top 10 results for target keyword
  - Identify title patterns
  - Extract content themes
  - Find differentiation opportunities
  - Analyze competitor strategies

**3. E-E-A-T Scoring Agent**
- **Purpose**: Evaluate content quality signals
- **Tools**: NLP analysis, pattern matching
- **Output**: EEATScore (0-100 for each component)
- **Key Functions**:
  - **Experience**: Author credentials, first-hand accounts
  - **Expertise**: Technical accuracy, depth of knowledge
  - **Authoritativeness**: Citations, external links, brand mentions
  - **Trustworthiness**: HTTPS, privacy policy, contact info

**4. Content Optimizer Agent (Mode A: Fix)**
- **Purpose**: Apply surgical fixes to existing content
- **Tools**: Gemini 2.5 Flash, NLP
- **Output**: OptimizationResult with fixes
- **Key Functions**:
  - Fix title tags and meta descriptions
  - Improve heading structure
  - Add missing alt text
  - Correct typos and grammar
  - Enhance readability
  - Preserve original voice (90%+ content retained)

**5. Content Rewriter Agent (Mode B: Rewrite)**
- **Purpose**: Complete content rewrite with SEO optimization
- **Tools**: Gemini 2.5 Flash, Flux AI
- **Output**: OptimizationResult with new content
- **Key Functions**:
  - Analyze competitor content structure
  - Generate completely new article
  - Optimize for target keywords
  - Create relevant images
  - Ensure 100% uniqueness
  - Achieve higher SEO score than original

**6. Compliance Checker Agent (iGaming)**
- **Purpose**: Verify regulatory compliance
- **Tools**: Regulation database, pattern matching
- **Output**: ComplianceCheck with issues
- **Key Functions**:
  - Check UK Gambling Commission rules
  - Verify Malta Gaming Authority compliance
  - Validate Curacao licensing requirements
  - Flag outdated regulation references
  - Suggest compliant language

**7. Image Generator Agent**
- **Purpose**: Create relevant images for content
- **Tools**: Flux AI, DALL-E
- **Output**: List of image URLs with alt text
- **Key Functions**:
  - Identify image opportunities in content
  - Generate contextually relevant images
  - Create proper alt text for SEO
  - Optimize image dimensions

**8. Site Crawler Agent (Enterprise)**
- **Purpose**: Discover and prioritize pages for bulk scanning
- **Tools**: Custom crawler, sitemap parser
- **Output**: List of URLs with priority scores
- **Key Functions**:
  - Parse XML sitemaps
  - Crawl website structure
  - Prioritize by traffic/importance
  - Queue for batch processing

---

## Data Flow

### Single Page Audit Flow

```
User Input (URL)
    │
    ▼
Page Auditor Agent
    │ (scrapes page)
    ▼
E-E-A-T Scoring Agent
    │ (analyzes quality)
    ▼
SERP Analyst Agent
    │ (researches competitors)
    ▼
Issue Categorization
    │ (P0/P1/P2)
    ▼
Dashboard Display
    │
    ├─► Mode A: Fix My Article
    │       │
    │       ▼
    │   Content Optimizer Agent
    │       │
    │       ▼
    │   Preview Changes
    │       │
    │       ▼
    │   Apply to Website
    │
    └─► Mode B: Rewrite Competitor
            │
            ▼
        Content Rewriter Agent
            │
            ▼
        Image Generator Agent
            │
            ▼
        Preview New Article
            │
            ▼
        Export/Publish
```

### Bulk Scanning Flow (Enterprise)

```
User Input (Domain/Sitemap)
    │
    ▼
Site Crawler Agent
    │ (discovers pages)
    ▼
Priority Queue
    │
    ▼
Parallel Processing
    │ (5 concurrent scans)
    ├─► Page 1 → Audit → Store
    ├─► Page 2 → Audit → Store
    ├─► Page 3 → Audit → Store
    ├─► Page 4 → Audit → Store
    └─► Page 5 → Audit → Store
    │
    ▼
Aggregate Results
    │
    ▼
Auto-Fix Orchestrator
    │ (applies approved fixes)
    ▼
Change Tracking
    │
    ▼
Notification (Slack/Discord)
```

---

## Database Schema

### Tables

**1. audits**
- id (UUID, primary key)
- url (TEXT)
- audit_result (JSON)
- created_at (TIMESTAMP)
- user_id (UUID, foreign key)

**2. optimizations**
- id (UUID, primary key)
- audit_id (UUID, foreign key)
- mode (ENUM: fix/rewrite)
- optimization_result (JSON)
- applied (BOOLEAN)
- created_at (TIMESTAMP)

**3. bulk_jobs**
- id (UUID, primary key)
- user_id (UUID, foreign key)
- status (ENUM: pending/running/completed/failed)
- urls (JSON array)
- results (JSON array)
- created_at (TIMESTAMP)
- completed_at (TIMESTAMP)

**4. users**
- id (UUID, primary key)
- email (TEXT, unique)
- password_hash (TEXT)
- plan (ENUM: starter/professional/enterprise)
- created_at (TIMESTAMP)

**5. compliance_rules**
- id (UUID, primary key)
- jurisdiction (TEXT)
- regulation_name (TEXT)
- rule_text (TEXT)
- effective_date (DATE)
- updated_at (TIMESTAMP)

---

## API Endpoints

### Core Endpoints

**POST /api/v1/audit**
- Audit a single page
- Input: `{ "url": "https://example.com" }`
- Output: `PageAuditResult`

**POST /api/v1/optimize**
- Optimize content
- Input: `{ "audit_id": "uuid", "mode": "fix|rewrite" }`
- Output: `OptimizationResult`

**POST /api/v1/bulk-scan**
- Start bulk scanning job
- Input: `{ "urls": ["url1", "url2", ...] }`
- Output: `{ "job_id": "uuid" }`

**GET /api/v1/bulk-scan/{job_id}**
- Get bulk scan status
- Output: `BulkScanJob`

**POST /api/v1/apply-fixes**
- Apply fixes to website
- Input: `{ "optimization_id": "uuid", "target": "wordpress|webflow|draft" }`
- Output: `{ "success": true, "url": "..." }`

### Integration Endpoints

**POST /api/v1/integrations/wordpress**
- Publish to WordPress
- Input: `{ "content": "...", "title": "...", "status": "draft|publish" }`

**POST /api/v1/integrations/slack**
- Send Slack notification
- Input: `{ "message": "...", "channel": "..." }`

---

## Technology Stack

### Core Technologies
- **Python 3.11+**: Main programming language
- **Google ADK**: Multi-agent framework
- **Gemini 2.5 Flash**: AI intelligence
- **Pydantic**: Data validation
- **SQLAlchemy**: ORM for database

### Web Framework
- **FastAPI**: REST API server
- **Streamlit**: Dashboard UI
- **Uvicorn**: ASGI server

### Integrations
- **Firecrawl MCP**: Web scraping
- **Google Search API**: SERP data
- **Flux AI**: Image generation
- **Slack SDK**: Notifications
- **WordPress REST API**: Publishing

### Development Tools
- **pytest**: Testing
- **black**: Code formatting
- **mypy**: Type checking
- **loguru**: Logging

---

## Deployment

### Development
```bash
python src/main.py
```

### Production (Docker)
```bash
docker-compose up -d
```

### Environment Variables
See `.env.example` for required configuration.

---

## Security Considerations

1. **API Keys**: Stored in environment variables, never committed
2. **User Authentication**: JWT tokens with bcrypt password hashing
3. **Rate Limiting**: 60 requests/minute per user
4. **Input Validation**: Pydantic schemas for all inputs
5. **SQL Injection**: SQLAlchemy ORM prevents direct SQL
6. **XSS Protection**: Content sanitization before display

---

## Performance Optimization

1. **Concurrent Scanning**: Up to 5 parallel audits
2. **Caching**: Redis for SERP results (1 hour TTL)
3. **Database Indexing**: On url, user_id, created_at
4. **Lazy Loading**: Dashboard loads data on demand
5. **Background Jobs**: Celery for bulk scanning

---

## Monitoring & Logging

- **Loguru**: Structured logging to files
- **Sentry**: Error tracking (optional)
- **Metrics**: Request count, response time, error rate
- **Health Checks**: `/health` endpoint for uptime monitoring

---

## Future Enhancements

1. **Multi-language Support**: Analyze content in any language
2. **Video SEO**: Optimize video content and transcripts
3. **Local SEO**: Google My Business optimization
4. **Schema Markup**: Auto-generate structured data
5. **A/B Testing**: Test different optimizations
6. **Predictive Analytics**: Forecast ranking improvements

---

**Last Updated**: November 2025
**Version**: 2.0.0
