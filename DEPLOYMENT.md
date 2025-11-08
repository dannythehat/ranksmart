# 🚀 RankSmart 2.0 - Deployment Guide

Complete step-by-step guide to deploy RankSmart 2.0 to production.

---

## Prerequisites

Before deploying, ensure you have:

1. **GitHub Account** - Repository is already set up ✅
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Supabase Account** - Sign up at [supabase.com](https://supabase.com)
4. **API Keys**:
   - Google Gemini API Key
   - Firecrawl API Key

---

## Step 1: Set Up Supabase Database

### 1.1 Create New Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and project name: `ranksmart`
4. Set a strong database password (save it!)
5. Select region closest to your users
6. Click "Create new project"

### 1.2 Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL editor
5. Click "Run" to execute
6. Verify tables were created in **Table Editor**

### 1.3 Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - `Project URL` → This is your `SUPABASE_URL`
   - `anon public` key → This is your `SUPABASE_ANON_KEY`
   - `service_role` key → This is your `SUPABASE_SERVICE_KEY` (keep secret!)

---

## Step 2: Get API Keys

### 2.1 Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key → This is your `GOOGLE_GEMINI_API_KEY`

### 2.2 Firecrawl API Key

1. Go to [Firecrawl](https://firecrawl.dev)
2. Sign up for an account
3. Go to Dashboard → API Keys
4. Copy your API key → This is your `FIRECRAWL_API_KEY`

---

## Step 3: Deploy to Vercel

### 3.1 Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository: `dannythehat/ranksmart`
4. Click "Import"

### 3.2 Configure Project Settings

**Framework Preset**: Other  
**Root Directory**: `./`  
**Build Command**: Leave empty  
**Output Directory**: `public`  
**Install Command**: `npm install`

### 3.3 Add Environment Variables

In the Vercel project settings, add these environment variables:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

### 3.4 Deploy

1. Click "Deploy"
2. Wait for deployment to complete (2-3 minutes)
3. Your app will be live at: `https://your-project.vercel.app`

---

## Step 4: Configure GitHub Pages (Optional)

If you want to use GitHub Pages for the frontend:

1. Go to repository **Settings** → **Pages**
2. Source: Deploy from a branch
3. Branch: `main` → `/public` folder
4. Click "Save"
5. Your site will be available at: `https://dannythehat.github.io/ranksmart`

**Note**: You'll need to update the API base URL in `public/js/auth.js` to point to your Vercel deployment.

---

## Step 5: Update API Base URL

### 5.1 Get Your Vercel URL

After deployment, copy your Vercel project URL (e.g., `https://ranksmart.vercel.app`)

### 5.2 Update Frontend Code

Edit `public/js/auth.js` and replace the API_BASE_URL:

```javascript
const API_BASE_URL = 'https://your-vercel-app.vercel.app/api';
```

Commit and push the change:

```bash
git add public/js/auth.js
git commit -m "Update API base URL"
git push origin main
```

Vercel will automatically redeploy.

---

## Step 6: Test Your Deployment

### 6.1 Test Authentication

1. Visit your deployed site
2. Click "Sign Up"
3. Create a test account
4. Verify email (check spam folder)
5. Log in with your credentials

### 6.2 Test Audit Functionality

1. Go to Dashboard
2. Enter a URL to audit (e.g., `https://example.com`)
3. Click "Start Audit"
4. Wait for results
5. Verify E-E-A-T scores display correctly

### 6.3 Check Database

1. Go to Supabase dashboard
2. Open **Table Editor**
3. Check `profiles` table - your user should be there
4. Check `audits` table - your audit should be saved

---

## Step 7: Custom Domain (Optional)

### 7.1 Add Domain to Vercel

1. In Vercel project settings, go to **Domains**
2. Click "Add"
3. Enter your domain (e.g., `ranksmart.io`)
4. Follow DNS configuration instructions

### 7.2 Update DNS Records

Add these records to your domain registrar:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

Wait 24-48 hours for DNS propagation.

---

## Troubleshooting

### Issue: API calls failing

**Solution**: Check environment variables in Vercel dashboard. Make sure all keys are set correctly.

### Issue: Database connection error

**Solution**: Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct. Check Supabase project is active.

### Issue: Authentication not working

**Solution**: 
1. Check Supabase Auth settings
2. Verify email templates are configured
3. Check CORS settings in API endpoints

### Issue: Gemini API errors

**Solution**: 
1. Verify API key is valid
2. Check quota limits in Google AI Studio
3. Ensure billing is enabled if needed

### Issue: Firecrawl scraping fails

**Solution**:
1. Verify API key is correct
2. Check Firecrawl account has credits
3. Test with a simple URL first

---

## Monitoring & Maintenance

### Check Logs

**Vercel Logs**:
1. Go to Vercel dashboard
2. Select your project
3. Click "Logs" tab
4. Filter by function or time range

**Supabase Logs**:
1. Go to Supabase dashboard
2. Click "Logs" in sidebar
3. View API logs, database logs, etc.

### Monitor Usage

**Vercel**:
- Check function invocations
- Monitor bandwidth usage
- Track build minutes

**Supabase**:
- Monitor database size
- Check API requests
- Track storage usage

**API Keys**:
- Google Gemini: Check quota usage
- Firecrawl: Monitor credit balance

---

## Scaling Considerations

### Free Tier Limits

**Vercel**:
- 100GB bandwidth/month
- 100 hours serverless function execution
- Unlimited deployments

**Supabase**:
- 500MB database
- 2GB bandwidth
- 50,000 monthly active users

**Google Gemini**:
- 60 requests/minute (free tier)
- Rate limits apply

**Firecrawl**:
- Check your plan limits

### Upgrade Path

When you exceed free tier limits:

1. **Vercel Pro** ($20/month)
   - 1TB bandwidth
   - Unlimited function execution
   - Team collaboration

2. **Supabase Pro** ($25/month)
   - 8GB database
   - 50GB bandwidth
   - Daily backups

3. **Google Gemini Paid**
   - Higher rate limits
   - More requests/minute

---

## Security Checklist

- [ ] All API keys stored in environment variables (not in code)
- [ ] Supabase Row Level Security (RLS) enabled
- [ ] CORS configured correctly
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] HTTPS enforced
- [ ] Database backups enabled
- [ ] Error messages don't expose sensitive info

---

## Next Steps

After successful deployment:

1. ✅ Test all functionality thoroughly
2. ✅ Set up monitoring and alerts
3. ✅ Configure custom domain
4. ✅ Add analytics (Google Analytics, Plausible, etc.)
5. ✅ Set up error tracking (Sentry, LogRocket, etc.)
6. ✅ Create user documentation
7. ✅ Plan Week 3-4 features (Core Audit Engine)

---

## Support

If you encounter issues:

1. Check this deployment guide
2. Review Vercel documentation
3. Check Supabase documentation
4. Review API provider documentation
5. Check GitHub Issues

---

**Congratulations! 🎉 RankSmart 2.0 is now live!**
