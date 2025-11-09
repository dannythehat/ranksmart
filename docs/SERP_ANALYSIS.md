# 🎯 SERP Analysis Feature

## Overview

The SERP (Search Engine Results Page) Analysis feature is a powerful competitor intelligence tool that helps you understand what's ranking on Google and identify content gaps in your own content.

## What It Does

### 1. **Competitor Scraping**
- Fetches top 10 Google search results for any keyword
- Scrapes each competitor page for detailed analysis
- Extracts comprehensive metrics from each page

### 2. **Metrics Extracted**

For each competitor, we extract:

#### Content Metrics
- **Word Count**: Total words in the article
- **Headings**: H1-H6 structure breakdown
- **Keywords**: Top 20 most frequent keywords
- **Content Structure**: Paragraphs, lists, code blocks, blockquotes

#### Technical SEO
- **Meta Tags**: Title and description presence/length
- **Images**: Total count, alt text coverage percentage
- **Links**: Internal vs external link counts
- **URL Structure**: Domain and page path

### 3. **Gap Analysis**

The system performs intelligent gap analysis:

#### Averages Calculation
- Average word count across competitors
- Average number of headings
- Average images per page
- Average internal/external links

#### Keyword Analysis
- **Common Keywords**: Keywords appearing in 50%+ of competitors
- **Missing Keywords**: Keywords your content lacks (if target URL provided)
- **Keyword Frequency**: How often each keyword appears

#### Content Comparison
If you provide your URL:
- Word count difference vs average
- Percentage difference calculation
- Heading structure comparison
- Image usage comparison

### 4. **AI Recommendations**

Powered by Google Gemini 2.0, the system generates:

#### Priority Actions
- High/medium/low impact recommendations
- Specific actions to take
- Reasoning behind each recommendation

#### Content Recommendations
- Specific content improvements
- Implementation details
- Examples and best practices

#### Keyword Opportunities
- New keywords to target
- Reasoning for each keyword
- Search intent analysis

#### Structural Improvements
- Page structure enhancements
- Technical SEO fixes
- User experience improvements

## How to Use

### Basic Usage

1. **Navigate to SERP Analysis**
   - Go to `https://ranksmart.vercel.app/serp-analysis.html`
   - Or click "SERP Analysis" in the dashboard sidebar

2. **Enter Your Keyword**
   - Type the keyword you want to analyze
   - Example: "best seo tools 2024"

3. **Optional: Add Your URL**
   - If you have existing content, add your URL
   - This enables gap analysis and personalized recommendations

4. **Click "Analyze SERP"**
   - The system will scrape top 10 results
   - Analysis takes 30-60 seconds

### API Usage

```javascript
// POST request to /api/audit/serp
const response = await fetch('https://ranksmart.vercel.app/api/audit/serp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    keyword: 'best seo tools 2024',
    targetUrl: 'https://yoursite.com/article', // Optional
    limit: 10, // Number of competitors (default: 10)
  }),
});

const data = await response.json();
```

### Response Structure

```json
{
  "success": true,
  "keyword": "best seo tools 2024",
  "targetUrl": "https://yoursite.com/article",
  "analyzedAt": "2025-11-09T05:15:00.000Z",
  "summary": {
    "totalCompetitors": 10,
    "avgWordCount": 2847,
    "avgHeadings": 18,
    "commonKeywords": [
      { "keyword": "seo", "frequency": 10 },
      { "keyword": "tools", "frequency": 10 }
    ]
  },
  "competitors": [
    {
      "rank": 1,
      "url": "https://competitor.com/article",
      "domain": "competitor.com",
      "title": "Best SEO Tools 2024",
      "description": "...",
      "wordCount": 3200,
      "headings": {
        "h1": 1,
        "h2": 8,
        "h3": 12,
        "total": 21
      },
      "keywords": [
        { "keyword": "seo", "count": 45 },
        { "keyword": "tools", "count": 38 }
      ],
      "images": {
        "total": 15,
        "withAlt": 12,
        "altCoverage": 80
      },
      "links": {
        "total": 45,
        "internal": 30,
        "external": 15
      }
    }
  ],
  "targetAnalysis": {
    // Same structure as competitors
  },
  "gapAnalysis": {
    "averages": {
      "wordCount": 2847,
      "headings": 18,
      "images": 12,
      "internalLinks": 25,
      "externalLinks": 10
    },
    "commonKeywords": [...],
    "missingKeywords": ["keyword1", "keyword2"],
    "contentLengthComparison": {
      "target": 2100,
      "average": 2847,
      "difference": -747,
      "percentDiff": -26
    }
  },
  "recommendations": {
    "priority_actions": [
      {
        "action": "Increase content length",
        "impact": "high",
        "reason": "Your content is 26% shorter than competitors"
      }
    ],
    "content_recommendations": [...],
    "keyword_opportunities": [...],
    "structural_improvements": [...]
  }
}
```

## Use Cases

### 1. **Content Planning**
Before writing new content:
- Analyze what's ranking
- Identify content length expectations
- Discover required topics and keywords
- Plan your content structure

### 2. **Content Optimization**
For existing content:
- Compare your content to top rankers
- Identify missing keywords
- Find content gaps
- Get specific improvement recommendations

### 3. **Competitive Research**
- Understand competitor strategies
- Analyze their content structure
- Identify their keyword focus
- Learn from their success

### 4. **SEO Strategy**
- Discover ranking patterns
- Identify SERP features
- Understand search intent
- Plan content improvements

## Technical Details

### Technologies Used
- **Firecrawl**: Web scraping and content extraction
- **Google Gemini 2.0**: AI-powered recommendations
- **Vercel Serverless**: API hosting
- **Vanilla JavaScript**: Frontend implementation

### Performance
- **Analysis Time**: 30-60 seconds for 10 competitors
- **Rate Limiting**: Respects Firecrawl API limits
- **Error Handling**: Graceful fallbacks for failed scrapes
- **Timeout**: 15 seconds per competitor page

### Limitations
- Maximum 10 competitors per analysis
- Requires Firecrawl API key
- Some sites may block scraping
- JavaScript-heavy sites may not render fully

## Best Practices

### 1. **Keyword Selection**
- Use specific, long-tail keywords
- Avoid overly broad terms
- Include year for time-sensitive topics
- Match your target search intent

### 2. **Interpreting Results**
- Focus on patterns, not individual outliers
- Consider your niche and audience
- Don't blindly copy competitors
- Use insights to inform, not dictate

### 3. **Taking Action**
- Prioritize high-impact recommendations
- Implement changes gradually
- Test and measure results
- Iterate based on performance

### 4. **Frequency**
- Analyze before creating new content
- Re-analyze quarterly for existing content
- Monitor when rankings change
- Track competitor updates

## Troubleshooting

### Common Issues

**"No competitor URLs found"**
- Try a more specific keyword
- Check if keyword has search results
- Verify Firecrawl API is working

**"Failed to scrape competitor"**
- Some sites block scraping
- Timeout may have occurred
- Site may require JavaScript rendering

**"Analysis taking too long"**
- Normal for 10 competitors (30-60s)
- Check Firecrawl API status
- Reduce limit to 5 competitors

**"Missing keywords not showing"**
- Requires target URL to be provided
- Target URL must be successfully scraped
- Keywords must appear in 50%+ of competitors

## Future Enhancements

### Planned Features
- [ ] Historical SERP tracking
- [ ] SERP feature detection (featured snippets, PAA)
- [ ] Backlink analysis integration
- [ ] Domain authority comparison
- [ ] Content freshness analysis
- [ ] Mobile vs desktop SERP differences
- [ ] Local SERP analysis
- [ ] Multi-language support

### API Improvements
- [ ] Caching for faster repeat analyses
- [ ] Batch analysis for multiple keywords
- [ ] Export to PDF/CSV
- [ ] Scheduled SERP monitoring
- [ ] Webhook notifications for changes

## Support

For issues or questions:
- GitHub Issues: [dannythehat/ranksmart/issues](https://github.com/dannythehat/ranksmart/issues)
- Documentation: [docs/](https://github.com/dannythehat/ranksmart/tree/main/docs)

## License

Part of RankSmart 2.0 - See main LICENSE file
