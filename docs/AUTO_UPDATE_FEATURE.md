# 🔄 Auto-Update Feature Documentation

## Overview

The Auto-Update feature monitors your content for changes and helps keep articles up-to-date automatically. Perfect for iGaming affiliates tracking dynamic data like bonuses, regulations, and odds.

## Features

### 1. Content Monitoring
- **Track Any URL**: Monitor competitor pages or your own content
- **Flexible Frequency**: Check hourly, daily, or weekly
- **Smart Detection**: Identifies meaningful content changes
- **Change History**: Complete audit trail of all detected changes

### 2. Change Detection
Monitors multiple content aspects:
- **Content Hash**: Detects any text modifications
- **Word Count**: Tracks significant length changes (>5%)
- **Headings**: Monitors structure changes
- **Links**: Tracks internal/external link additions/removals
- **Images**: Detects image changes

### 3. Severity Levels
- **High**: Content modifications, major word count changes (>20%)
- **Medium**: Moderate word count changes (5-20%)
- **Low**: Heading, link, or image count changes

## API Endpoints

### Track Content

**POST** `/api/monitor/track`

Add a new URL to monitor:

```json
{
  "userId": "user-123",
  "url": "https://example.com/article",
  "checkFrequency": "daily",
  "notifyOnChange": true
}
```

**GET** `/api/monitor/track?userId=user-123`

List all monitored URLs for a user.

**PUT** `/api/monitor/track`

Update monitoring settings:

```json
{
  "id": "monitor-id",
  "checkFrequency": "hourly",
  "status": "paused"
}
```

**DELETE** `/api/monitor/track?id=monitor-id`

Stop monitoring a URL.

### Check for Changes

**POST** `/api/monitor/check`

Manually check a URL for changes:

```json
{
  "monitorId": "monitor-id",
  "userId": "user-123"
}
```

Response:

```json
{
  "success": true,
  "hasChanges": true,
  "changes": [
    {
      "type": "content",
      "field": "Content",
      "change": "Content has been modified",
      "severity": "high"
    },
    {
      "type": "word_count",
      "field": "Word Count",
      "old": 1500,
      "new": 1650,
      "change": "+150 words (10.0%)",
      "severity": "medium"
    }
  ],
  "message": "2 change(s) detected"
}
```

## Database Schema

### monitored_content Table

```sql
CREATE TABLE monitored_content (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    url TEXT NOT NULL,
    check_frequency TEXT DEFAULT 'daily',
    notify_on_change BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active',
    last_snapshot JSONB,
    last_checked TIMESTAMP,
    last_change_detected TIMESTAMP,
    changes_detected INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, url)
);
```

### content_changes Table

```sql
CREATE TABLE content_changes (
    id UUID PRIMARY KEY,
    monitor_id UUID REFERENCES monitored_content(id),
    user_id UUID NOT NULL,
    url TEXT NOT NULL,
    changes JSONB NOT NULL,
    detected_at TIMESTAMP DEFAULT NOW(),
    reviewed BOOLEAN DEFAULT false,
    applied BOOLEAN DEFAULT false
);
```

## Automated Monitoring

### Cron Job

The system runs an hourly cron job (`/api/cron/check-monitored`) that:

1. Fetches all active monitored URLs
2. Checks each URL based on its frequency setting
3. Detects and records changes
4. Updates the database with new snapshots

**Vercel Configuration** (vercel.json):

```json
{
  "crons": [{
    "path": "/api/cron/check-monitored",
    "schedule": "0 * * * *"
  }]
}
```

### Check Frequency Logic

- **Hourly**: Checks every hour
- **Daily**: Checks every 24 hours
- **Weekly**: Checks every 168 hours (7 days)

## User Interface

### Auto-Update Dashboard

**URL**: `/auto-update.html`

Features:
- **Add Monitor Form**: Quick URL addition with frequency selection
- **Monitored List**: All tracked URLs with stats
- **Real-time Status**: Active/paused status indicators
- **Quick Actions**:
  - 🔍 Check Now: Manual change detection
  - ⏸️ Pause/▶️ Resume: Toggle monitoring
  - 🗑️ Delete: Stop monitoring
- **Change Badges**: Visual indicators for detected changes
- **Auto-refresh**: Updates every 30 seconds

### Stats Display

Each monitored URL shows:
- Check frequency
- Last checked time
- Current word count
- Total changes detected

## Use Cases

### 1. iGaming Bonus Tracking
Monitor competitor bonus pages to stay competitive:
```
URL: competitor.com/welcome-bonus
Frequency: Daily
Alert: Bonus changed from £20 to £25
```

### 2. Regulation Compliance
Track regulatory pages for updates:
```
URL: gambling-commission.gov.uk/regulations
Frequency: Weekly
Alert: New compliance requirements added
```

### 3. Competitor Analysis
Monitor top-ranking competitor content:
```
URL: competitor.com/best-casinos-2025
Frequency: Daily
Alert: Added 3 new casinos, +500 words
```

### 4. Own Content Monitoring
Track your published articles for unauthorized changes:
```
URL: yoursite.com/important-article
Frequency: Hourly
Alert: Content modified (possible hack/CMS issue)
```

## Best Practices

### 1. Choose Appropriate Frequency
- **Hourly**: Time-sensitive content (live odds, breaking news)
- **Daily**: Regular updates (bonuses, promotions)
- **Weekly**: Slow-changing content (regulations, guides)

### 2. Monitor Strategically
- Focus on high-value competitor pages
- Track your top-performing content
- Monitor regulatory/compliance pages
- Watch for seasonal changes

### 3. Act on Changes
- Review high-severity changes immediately
- Update your content to stay competitive
- Document regulatory changes
- Maintain content freshness

## Limitations

1. **Rate Limits**: Firecrawl API has rate limits
2. **Content Extraction**: Some sites may block scraping
3. **False Positives**: Minor formatting changes may trigger alerts
4. **Storage**: Change history grows over time

## Future Enhancements

### Planned Features
- [ ] Email/Slack notifications
- [ ] AI-powered change summaries
- [ ] Automatic content update suggestions
- [ ] Bulk monitoring (entire site)
- [ ] Change diff viewer
- [ ] Export change reports
- [ ] Integration with CMS (WordPress, Webflow)
- [ ] Smart scheduling based on change patterns

### Advanced Features
- [ ] Competitor content comparison
- [ ] Trend analysis and predictions
- [ ] Automated content rewriting
- [ ] Multi-language support
- [ ] Screenshot comparison
- [ ] Price/bonus extraction
- [ ] Sentiment analysis

## Troubleshooting

### No Changes Detected
- Verify URL is accessible
- Check Firecrawl API status
- Ensure content has actually changed
- Review last_snapshot data

### Too Many False Positives
- Increase word count threshold
- Adjust check frequency
- Filter out minor changes
- Use content hash only

### Monitoring Stopped
- Check status (active vs paused)
- Verify cron job is running
- Review error logs
- Check API quotas

## Security

### Authentication
- User-specific monitoring (user_id required)
- Row-level security in Supabase
- Cron job protected by secret token

### Data Privacy
- Only stores content metrics, not full content
- User data isolated
- Secure API endpoints

## Performance

### Optimization
- Batch processing in cron job
- Efficient database queries
- Indexed columns for fast lookups
- Pagination for large datasets

### Scalability
- Serverless architecture
- Horizontal scaling with Vercel
- Database connection pooling
- Caching for frequent queries

## Support

For issues or questions:
- Check logs in Vercel dashboard
- Review Supabase database
- Test API endpoints manually
- Contact support team

---

**Version**: 1.0  
**Last Updated**: November 9, 2025  
**Status**: ✅ Production Ready
