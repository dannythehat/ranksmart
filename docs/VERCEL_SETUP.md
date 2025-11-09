# 🚀 Vercel Deployment Guide

Complete guide to deploying RankSmart backend to Vercel.

---

## Prerequisites

- GitHub account with RankSmart repository
- Vercel account (free tier works)
- Supabase project setup
- API keys ready (Gemini, Firecrawl)

---

## Step 1: Connect to Vercel

### Option A: Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository: `dannythehat/ranksmart`
4. Vercel will auto-detect the configuration from `vercel.json`

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel
```

---

## Step 2: Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

### Required Variables

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini
GOOGLE_API_KEY=AIzaSy...

# Firecrawl
FIRECRAWL_API_KEY=fc-...

# Application
NODE_ENV=production
APP_URL=https://dannythehat.github.io/ranksmart
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
```

### Optional Variables

```env
# Image Generation
FAL_API_KEY=your-fal-api-key

# Integrations
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Stripe (for billing)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Step 3: Verify Deployment

### Check Deployment Status

1. Go to Vercel Dashboard → Deployments
2. Wait for build to complete (usually 1-2 minutes)
3. Click on deployment to see logs

### Test API Endpoints

```bash
# Test signup
curl -X POST https://your-project.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "fullName": "Test User"
  }'

# Test login
curl -X POST https://your-project.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

---

## Step 4: Update Frontend Configuration

Update `public/js/api.js` with your Vercel API URL:

```javascript
const API_BASE_URL = 'https://your-project.vercel.app/api';
```

Commit and push to trigger GitHub Pages rebuild.

---

## API Endpoints Available

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify` - Token verification

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/usage` - Usage statistics

### API Keys
- `GET /api/keys/manage` - List API keys
- `POST /api/keys/manage` - Create API key
- `DELETE /api/keys/manage?id=xxx` - Delete API key

### Audit (Coming in Week 3)
- `POST /api/audit/scan` - Scan page
- `POST /api/audit/analyze` - Analyze content
- `POST /api/audit/serp` - SERP analysis

### Optimize (Coming in Week 5-6)
- `POST /api/optimize/fix` - Mode A: Fix article
- `POST /api/optimize/rewrite` - Mode B: Rewrite

---

## Troubleshooting

### Build Fails

**Error**: `Cannot find module '@supabase/supabase-js'`

**Solution**: Ensure `package.json` is in root directory with all dependencies.

### CORS Errors

**Error**: `Access-Control-Allow-Origin` blocked

**Solution**: All API endpoints include CORS headers. Check that frontend is using correct API URL.

### Environment Variables Not Working

**Error**: `process.env.SUPABASE_URL is undefined`

**Solution**: 
1. Verify variables are set in Vercel Dashboard
2. Redeploy after adding variables
3. Check variable names match exactly

### Database Connection Fails

**Error**: `Failed to connect to Supabase`

**Solution**:
1. Verify Supabase URL and keys are correct
2. Check Supabase project is active
3. Ensure database schema is applied

---

## Performance Optimization

### Enable Edge Functions (Optional)

For faster response times globally:

1. Update `vercel.json`:
```json
{
  "functions": {
    "api/**/*.js": {
      "runtime": "edge"
    }
  }
}
```

2. Redeploy

### Caching Strategy

API responses are cached based on headers:

- Auth endpoints: No cache
- User data: 5 minutes
- Audit results: 1 hour
- Static data: 24 hours

---

## Monitoring

### View Logs

```bash
# Real-time logs
vercel logs --follow

# Filter by function
vercel logs --follow api/auth/login.js
```

### Analytics

Vercel Dashboard → Analytics shows:
- Request count
- Response times
- Error rates
- Geographic distribution

---

## Production Checklist

- [ ] All environment variables set
- [ ] Supabase database schema applied
- [ ] API endpoints tested
- [ ] CORS configured correctly
- [ ] Frontend updated with API URL
- [ ] Error monitoring enabled
- [ ] Rate limiting configured
- [ ] SSL certificate active (automatic)

---

## Next Steps

1. **Week 3**: Implement audit engine endpoints
2. **Week 4**: Add SERP analysis
3. **Week 5-6**: Content optimization features
4. **Week 7-8**: Integrations and billing

---

**Deployment URL**: https://your-project.vercel.app  
**Frontend URL**: https://dannythehat.github.io/ranksmart  
**Status**: ✅ Backend deployed and ready!
