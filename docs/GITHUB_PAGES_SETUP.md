# 🚀 GitHub Pages Deployment Guide

**Project**: RankSmart 2.0  
**Deployment Target**: GitHub Pages  
**Source**: `/public` directory  
**Branch**: `main`

---

## 📋 Prerequisites

- ✅ Repository: `dannythehat/ranksmart`
- ✅ Frontend files in `/public` directory
- ✅ GitHub Actions workflow created
- ⬜ GitHub Pages enabled (follow steps below)

---

## 🔧 Step-by-Step Setup

### Step 1: Enable GitHub Pages

1. **Navigate to Repository Settings**
   - Go to: https://github.com/dannythehat/ranksmart
   - Click on **Settings** tab

2. **Access Pages Configuration**
   - Scroll down to **Pages** section in the left sidebar
   - Or go directly to: https://github.com/dannythehat/ranksmart/settings/pages

3. **Configure Source**
   - Under "Build and deployment"
   - **Source**: Select "GitHub Actions"
   - This will use the workflow we created in `.github/workflows/deploy-pages.yml`

4. **Save Configuration**
   - GitHub will automatically deploy on the next push to `main`

---

### Step 2: Verify Deployment

1. **Check Workflow Status**
   - Go to: https://github.com/dannythehat/ranksmart/actions
   - Look for "Deploy to GitHub Pages" workflow
   - Ensure it completes successfully (green checkmark)

2. **Access Your Site**
   - Your site will be available at:
   - **URL**: `https://dannythehat.github.io/ranksmart/`
   - It may take 1-2 minutes for the first deployment

3. **Test All Pages**
   - Landing page: `https://dannythehat.github.io/ranksmart/`
   - Dashboard: `https://dannythehat.github.io/ranksmart/dashboard.html`
   - Audit: `https://dannythehat.github.io/ranksmart/audit.html`
   - Optimize: `https://dannythehat.github.io/ranksmart/optimize.html`
   - Settings: `https://dannythehat.github.io/ranksmart/settings.html`

---

## 🎨 Custom Domain (Optional)

### Add Custom Domain

1. **Purchase Domain** (if you don't have one)
   - Recommended: Namecheap, Google Domains, Cloudflare

2. **Configure DNS**
   - Add these DNS records at your domain provider:
   ```
   Type: A
   Name: @
   Value: 185.199.108.153
   
   Type: A
   Name: @
   Value: 185.199.109.153
   
   Type: A
   Name: @
   Value: 185.199.110.153
   
   Type: A
   Name: @
   Value: 185.199.111.153
   
   Type: CNAME
   Name: www
   Value: dannythehat.github.io
   ```

3. **Add Domain in GitHub**
   - Go to: https://github.com/dannythehat/ranksmart/settings/pages
   - Under "Custom domain", enter your domain (e.g., `ranksmart.io`)
   - Click **Save**
   - Wait for DNS check to complete (can take up to 24 hours)

4. **Enable HTTPS**
   - Once DNS is verified, check "Enforce HTTPS"
   - GitHub will automatically provision SSL certificate

---

## 🔄 Automatic Deployments

### How It Works

Every time you push to the `main` branch:
1. GitHub Actions workflow triggers automatically
2. Workflow builds and deploys `/public` directory
3. Site updates within 1-2 minutes

### Manual Deployment

If you need to manually trigger deployment:
1. Go to: https://github.com/dannythehat/ranksmart/actions
2. Click on "Deploy to GitHub Pages" workflow
3. Click "Run workflow" button
4. Select `main` branch
5. Click "Run workflow"

---

## 🐛 Troubleshooting

### Issue: 404 Page Not Found

**Cause**: GitHub Pages not enabled or wrong source  
**Solution**:
- Verify Pages is enabled in Settings
- Ensure source is set to "GitHub Actions"
- Check that `/public` directory exists

### Issue: CSS/JS Not Loading

**Cause**: Incorrect file paths  
**Solution**:
- Ensure all paths in HTML are relative
- Example: `<link href="css/main.css">` not `/css/main.css`
- Check browser console for 404 errors

### Issue: Workflow Fails

**Cause**: Permissions or configuration error  
**Solution**:
- Go to: https://github.com/dannythehat/ranksmart/settings/actions
- Under "Workflow permissions", select "Read and write permissions"
- Re-run the workflow

### Issue: Site Not Updating

**Cause**: Cache or deployment delay  
**Solution**:
- Wait 2-3 minutes after push
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check Actions tab for deployment status

---

## 📊 Monitoring & Analytics

### GitHub Pages Analytics

- **Traffic**: https://github.com/dannythehat/ranksmart/graphs/traffic
- **Visitors**: View unique visitors and page views
- **Referrers**: See where traffic comes from

### Add Google Analytics (Optional)

1. Create Google Analytics account
2. Get tracking ID (e.g., `G-XXXXXXXXXX`)
3. Add to all HTML pages before `</head>`:
   ```html
   <!-- Google Analytics -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```

---

## 🔒 Security Best Practices

### HTTPS
- ✅ Always enforce HTTPS
- ✅ GitHub provides free SSL certificates

### API Keys
- ❌ Never commit API keys to repository
- ✅ Use environment variables (set in Vercel for backend)
- ✅ Frontend should call backend API, not use keys directly

### Content Security Policy
Add to HTML `<head>`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline';">
```

---

## ✅ Deployment Checklist

Before going live:
- [ ] All HTML pages load correctly
- [ ] CSS styles apply properly
- [ ] JavaScript modules work
- [ ] Images and assets load
- [ ] Mobile responsive design works
- [ ] Cross-browser testing complete
- [ ] No console errors
- [ ] HTTPS enabled
- [ ] Custom domain configured (if applicable)
- [ ] Analytics tracking added (if applicable)

---

## 🚀 Next Steps

After successful deployment:
1. ✅ Test all pages on live site
2. ✅ Complete testing checklist (`docs/TESTING_CHECKLIST.md`)
3. ✅ Mark Week 1, Day 3 as complete
4. 🔄 Move to Week 2: Backend setup (Vercel + Supabase)

---

## 📞 Support

**Issues**: https://github.com/dannythehat/ranksmart/issues  
**Discussions**: https://github.com/dannythehat/ranksmart/discussions  
**Documentation**: https://github.com/dannythehat/ranksmart/tree/main/docs

---

**Last Updated**: November 8, 2025  
**Status**: Ready for Deployment 🚀
