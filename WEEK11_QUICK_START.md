# 🚀 Week 11: Analytics & Impact Tracking - Quick Start

Get your analytics and SERP tracking up and running in 15 minutes!

---

## 📋 Prerequisites

- ✅ Supabase account (free tier)
- ✅ Google Cloud Console account
- ✅ Vercel account (free tier)
- ✅ SerpAPI account (optional, for SERP tracking)

---

## 🔧 Setup Steps

### 1. Database Setup (5 minutes)

1. **Run Migration**:
   ```bash
   # In Supabase SQL Editor
   # Copy and paste: supabase/migrations/004_analytics_tracking.sql
   # Click "Run"
   ```

2. **Verify Tables**:
   - Check that 4 new tables exist:
     - `article_tracking`
     - `position_history`
     - `gsc_connections`
     - `impact_reports`

### 2. Google Cloud Console Setup (5 minutes)

1. **Create Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project: "RankSmart"

2. **Enable APIs**:
   - Search for "Google Search Console API"
   - Click "Enable"

3. **Create OAuth Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "RankSmart Analytics"
   - Authorized redirect URIs:
     ```
     https://ranksmart.vercel.app/api/analytics/gsc-callback
     http://localhost:3000/api/analytics/gsc-callback
     ```
   - Click "Create"
   - **Copy Client ID and Client Secret**

### 3. SerpAPI Setup (Optional, 2 minutes)

1. **Sign Up**:
   - Go to [SerpAPI](https://serpapi.com)
   - Sign up for free account (100 searches/month)

2. **Get API Key**:
   - Go to Dashboard
   - Copy your API key

### 4. Environment Variables (3 minutes)

Add to Vercel environment variables:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=https://ranksmart.vercel.app/api/analytics/gsc-callback

# SERP Tracking (choose one)
SERPAPI_KEY=your_serpapi_key_here

# OR use Google Custom Search (free tier)
GOOGLE_SEARCH_API_KEY=your_google_api_key
GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id

# Cron Security
CRON_SECRET=generate_random_secret_here

# Supabase (already set)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# Frontend
FRONTEND_URL=https://dannythehat.github.io/ranksmart
```

**Generate Random Secret**:
```bash
# In terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Deploy to Vercel (2 minutes)

1. **Push to GitHub**:
   ```bash
   git push origin feature/week11-analytics-impact-tracking
   ```

2. **Deploy**:
   - Vercel will auto-deploy
   - Or manually: `vercel --prod`

3. **Verify Deployment**:
   - Check that cron job is scheduled
   - Test OAuth flow

---

## ✅ Testing

### Test 1: GSC Connection

1. Open Impact Dashboard
2. Click "Connect Google Search Console"
3. Authorize with Google account
4. Should redirect back with success message

### Test 2: Add Article to Tracking

```javascript
// In browser console or API client
fetch('https://ranksmart.vercel.app/api/analytics/track-article?action=add', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'your_user_id',
    url: 'https://example.com/article',
    title: 'Test Article',
    targetKeyword: 'test keyword',
    baselinePosition: 15,
    baselineClicks: 50
  })
})
```

### Test 3: Fetch Performance Data

```javascript
fetch('https://ranksmart.vercel.app/api/analytics/fetch-performance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'your_user_id',
    url: 'https://example.com/article',
    keyword: 'test keyword'
  })
})
```

### Test 4: Generate Report

```javascript
fetch('https://ranksmart.vercel.app/api/analytics/generate-report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'your_user_id',
    format: 'json'
  })
})
```

### Test 5: Manual Cron Trigger

```bash
curl -X GET \
  https://ranksmart.vercel.app/api/cron/check-positions \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

## 🎨 UI Integration

### Add to Dashboard Navigation

Update `public/dashboard.html`:

```html
<li><a href="impact-dashboard.html">📈 Impact Dashboard</a></li>
```

### Auto-Track After Optimization

In Mode 1 and Mode 2 completion handlers:

```javascript
// After successful optimization
await fetch('/api/analytics/track-article?action=add', {
  method: 'POST',
  body: JSON.stringify({
    userId: currentUser.id,
    url: articleUrl,
    title: articleTitle,
    targetKeyword: keyword,
    baselinePosition: currentPosition,
    modeUsed: 'mode1' // or 'mode2'
  })
});
```

---

## 📊 Usage Flow

### For Users

1. **First Time**:
   - Connect Google Search Console
   - Optimize first article
   - Article automatically tracked

2. **Daily**:
   - Cron job checks positions
   - Updates tracked automatically
   - Notifications sent for changes

3. **Weekly**:
   - Review Impact Dashboard
   - See improvements
   - Export report for clients

### For Admins

1. **Monitor Cron Jobs**:
   - Check Vercel logs
   - Verify daily execution
   - Review error rates

2. **Database Health**:
   - Monitor table sizes
   - Check query performance
   - Archive old data if needed

---

## 🐛 Troubleshooting

### Issue: OAuth Not Working

**Solution**:
- Verify redirect URI matches exactly
- Check client ID and secret
- Ensure GSC API is enabled

### Issue: Cron Job Not Running

**Solution**:
- Verify CRON_SECRET is set
- Check Vercel cron logs
- Ensure schedule is correct

### Issue: No Position Data

**Solution**:
- Verify SerpAPI key is valid
- Check API quota limits
- Try alternative SERP API

### Issue: GSC Data Not Fetching

**Solution**:
- Check token expiry
- Verify property URL matches
- Ensure user has GSC access

---

## 📈 Expected Timeline

- **Day 1**: Setup complete, first articles tracked
- **Day 2**: Cron job runs, first position checks
- **Week 1**: Baseline established
- **Week 2-4**: Improvements visible
- **Month 2+**: Full impact tracking

---

## 🎉 Success Indicators

✅ GSC connected successfully  
✅ Articles being tracked  
✅ Cron job running daily  
✅ Position history accumulating  
✅ Reports generating correctly  
✅ Users seeing improvements  

---

## 📚 Resources

- [Full Documentation](docs/WEEK11_ANALYTICS_COMPLETE.md)
- [Google Search Console API](https://developers.google.com/webmaster-tools)
- [SerpAPI Documentation](https://serpapi.com/docs)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

---

## 🆘 Support

Need help? Check:
1. Full documentation in `docs/WEEK11_ANALYTICS_COMPLETE.md`
2. API logs in Vercel dashboard
3. Database logs in Supabase
4. Browser console for frontend errors

---

**Ready to prove your SEO success!** 🚀
