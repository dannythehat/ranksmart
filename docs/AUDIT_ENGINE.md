# 🔍 RankSmart Audit Engine Documentation

## Overview

The RankSmart Audit Engine is a comprehensive SEO analysis system that evaluates web pages using Google's E-E-A-T principles and technical SEO best practices.

---

## Architecture

### Components

1. **Firecrawl Integration** (`api/audit/firecrawl.js`)
   - Web scraping and content extraction
   - Metadata parsing
   - Link and image analysis

2. **E-E-A-T Scorer** (`api/audit/eeat-scorer.js`)
   - Experience scoring
   - Expertise evaluation
   - Authoritativeness assessment
   - Trustworthiness analysis

3. **Technical SEO Checker** (`api/audit/technical-seo.js`)
   - Meta tags validation
   - Heading structure analysis
   - Image optimization checks
   - Internal linking evaluation
   - Content quality metrics

4. **Main Audit Endpoint** (`api/audit/scan.js`)
   - Orchestrates all components
   - Generates comprehensive reports
   - Calculates overall scores

---

## API Usage

### Endpoint

```
POST /api/audit/scan
```

### Request

```json
{
  "url": "https://example.com/article"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "url": "https://example.com/article",
    "scannedAt": "2025-11-09T04:25:00Z",
    
    "overall": {
      "score": 75,
      "grade": "B+",
      "status": "good"
    },
    
    "eeat": {
      "overall": 72,
      "grade": "B",
      "breakdown": {
        "experience": 68,
        "expertise": 75,
        "authoritativeness": 70,
        "trustworthiness": 76
      },
      "recommendations": [
        {
          "category": "Experience",
          "priority": "high",
          "issue": "Low experience signals detected",
          "fix": "Add more first-hand experiences and personal anecdotes"
        }
      ]
    },
    
    "technicalSEO": {
      "overall": 78,
      "grade": "B+",
      "breakdown": {
        "metaTags": { "score": 85, "issues": [...] },
        "headings": { "score": 90, "issues": [...] },
        "images": { "score": 70, "issues": [...] },
        "internalLinks": { "score": 75, "issues": [...] },
        "contentQuality": { "score": 80, "issues": [...] }
      },
      "issuesByPriority": {
        "P0": [...],
        "P1": [...],
        "P2": [...]
      },
      "totalIssues": 8,
      "criticalIssues": 2
    },
    
    "page": {
      "title": "Example Article Title",
      "description": "Article description...",
      "wordCount": 1500,
      "readingTime": 8,
      "headingCount": 12,
      "imageCount": 5,
      "linkCount": 25
    },
    
    "stats": {
      "totalIssues": 10,
      "criticalIssues": 2,
      "eeatScore": 72,
      "technicalScore": 78
    }
  }
}
```

---

## Scoring System

### Overall Score Calculation

```
Overall Score = (E-E-A-T Score × 0.5) + (Technical SEO Score × 0.5)
```

### E-E-A-T Score (0-100)

Weighted average of four components:

1. **Experience (25%)**: 0-100 points
   - First-person narratives (20 pts)
   - Personal anecdotes (20 pts)
   - Specific details (20 pts)
   - Time-based experience (20 pts)
   - Results and outcomes (20 pts)

2. **Expertise (25%)**: 0-100 points
   - Author credentials (25 pts)
   - Technical depth (20 pts)
   - Citations and references (25 pts)
   - Comprehensive coverage (15 pts)
   - Structured content (15 pts)

3. **Authoritativeness (25%)**: 0-100 points
   - Author bio (20 pts)
   - Awards and recognition (20 pts)
   - High-quality backlinks (20 pts)
   - Social proof (20 pts)
   - Publication freshness (20 pts)

4. **Trustworthiness (25%)**: 0-100 points
   - HTTPS connection (15 pts)
   - Contact information (15 pts)
   - Privacy policy (15 pts)
   - Fact-checking (20 pts)
   - Transparency (15 pts)
   - Image alt text (10 pts)
   - No broken links (10 pts)

### Technical SEO Score (0-100)

Weighted average of five components:

1. **Meta Tags (25%)**
   - Title tag presence and length
   - Meta description presence and length
   - Open Graph tags

2. **Headings (20%)**
   - H1 presence and uniqueness
   - Heading hierarchy
   - Empty headings

3. **Images (15%)**
   - Alt text presence
   - Alt text quality
   - Image format optimization

4. **Internal Links (20%)**
   - Link count
   - Anchor text quality
   - Internal vs external ratio

5. **Content Quality (20%)**
   - Word count
   - Reading time
   - Duplicate content

### Grade System

| Score | Grade |
|-------|-------|
| 90-100 | A+ |
| 85-89 | A |
| 80-84 | A- |
| 75-79 | B+ |
| 70-74 | B |
| 65-69 | B- |
| 60-64 | C+ |
| 55-59 | C |
| 50-54 | C- |
| 0-49 | F |

---

## Issue Priority System

### P0 - Critical Issues
- Missing title tag
- Missing meta description
- Missing H1 tag
- Content too short (<300 words)
- No links found

**Impact**: Severe SEO penalties, immediate action required

### P1 - High Priority Issues
- Title/description length issues
- Multiple H1 tags
- Missing image alt text
- No internal links
- Empty headings

**Impact**: Significant SEO impact, should be fixed soon

### P2 - Medium Priority Issues
- Heading hierarchy skips
- Generic alt text
- Generic anchor text
- Image format optimization
- Short reading time

**Impact**: Minor SEO impact, fix when possible

---

## Recommendations System

Each low-scoring component generates actionable recommendations:

```json
{
  "category": "Experience",
  "priority": "high",
  "issue": "Low experience signals detected",
  "fix": "Add more first-hand experiences, personal anecdotes, and specific examples from your own work."
}
```

### Recommendation Triggers

- **Experience < 70**: Add first-hand experiences
- **Expertise < 70**: Include credentials and citations
- **Authoritativeness < 70**: Add author bio and recognition
- **Trustworthiness < 70**: Add contact info and fact-checking

---

## Environment Variables

Required in `.env`:

```bash
# Firecrawl API Key
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```

---

## Testing

### Test URLs

Test the audit engine with various content types:

1. **Blog Posts**: Personal blogs, company blogs
2. **E-commerce**: Product pages, category pages
3. **News Articles**: News sites, magazines
4. **Landing Pages**: Marketing pages, sales pages
5. **Documentation**: Technical docs, guides

### Example Test

```bash
curl -X POST https://your-domain.com/api/audit/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'
```

---

## Performance

- **Average Scan Time**: 3-5 seconds
- **Firecrawl Scraping**: 2-3 seconds
- **E-E-A-T Analysis**: 0.5-1 second
- **Technical SEO**: 0.5-1 second

---

## Future Enhancements

### Week 4 Additions
- SERP analysis integration
- Competitor comparison
- Keyword gap analysis
- Backlink quality checking

### Planned Features
- Audit caching for performance
- Batch URL scanning
- Historical audit tracking
- Score trend analysis
- Custom scoring weights
- Industry-specific scoring

---

## Error Handling

### Common Errors

1. **Invalid URL**
   ```json
   {
     "error": "Invalid URL format"
   }
   ```

2. **Scraping Failed**
   ```json
   {
     "error": "Failed to scrape URL",
     "details": "Firecrawl API error: 400"
   }
   ```

3. **Rate Limit**
   ```json
   {
     "error": "Rate limit exceeded",
     "retryAfter": 60
   }
   ```

---

## Support

For issues or questions:
- **GitHub Issues**: https://github.com/dannythehat/ranksmart/issues
- **Documentation**: https://github.com/dannythehat/ranksmart/tree/main/docs

---

**Last Updated**: November 9, 2025  
**Version**: 1.0.0 (Week 3)  
**Status**: Beta - Testing in progress
