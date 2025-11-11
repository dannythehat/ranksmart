# 🚀 Day 5: Quick Start Guide

**Ready to test? Follow these steps!**

---

## ⚡ Quick Test (5 minutes)

### Step 1: Run All Tests
```bash
npm run test:day5
```

This will run all 4 gateway tests and give you a comprehensive report.

---

### Step 2: Check Live Site
Open in browser:
- **Homepage**: https://ranksmart.vercel.app/
- **Audit Page**: https://ranksmart.vercel.app/new-audit.html
- **Dashboard**: https://ranksmart.vercel.app/dashboard.html

---

### Step 3: Test Audit Functionality
1. Go to https://ranksmart.vercel.app/new-audit.html
2. Enter URL: `https://example.com`
3. Click "Scan Now"
4. Wait for results (5-15 seconds)
5. Verify scores and recommendations appear

---

## 📊 Expected Results

### ✅ All Tests Pass
```
🎉 ALL TESTS PASSED!
✅ All modules are working correctly
✅ Integration is validated
✅ Ready for deployment!
```

**Next:** Move to Day 6 (User Acceptance Testing)

---

### ⚠️ Some Tests Skipped
```
⚠️  TESTS PASSED WITH SKIPS
✅ 3 test(s) passed
⏸️  1 test(s) skipped (missing API keys)
```

**Action Required:**
1. Check `.env` file for missing API keys
2. Add required keys
3. Re-run tests

---

### ❌ Tests Failed
```
⚠️  TESTS INCOMPLETE
❌ 1 test(s) failed
```

**Action Required:**
1. Review error messages
2. Check [DAY5_TESTING_PLAN.md](docs/DAY5_TESTING_PLAN.md) for troubleshooting
3. Fix issues
4. Re-run tests

---

## 🔧 Common Issues & Quick Fixes

### Issue: "Missing API key"
**Fix:**
```bash
# Create .env file
cp .env.example .env

# Add your keys
OPENAI_API_KEY=your_key_here
FIRECRAWL_API_KEY=your_key_here
SUPABASE_URL=your_url_here
SUPABASE_ANON_KEY=your_key_here
```

---

### Issue: "Cannot find module"
**Fix:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

### Issue: "Vercel deployment not found"
**Fix:**
```bash
# Check deployment status
vercel ls

# Redeploy if needed
npm run deploy
```

---

## 📋 Quick Checklist

### Backend Tests
- [ ] Gateway 1: Firecrawl ✅
- [ ] Gateway 2: E-E-A-T ✅
- [ ] Gateway 3: Technical SEO ✅
- [ ] Gateway 4: Integration ✅

### Frontend Tests
- [ ] Homepage loads ✅
- [ ] Audit page works ✅
- [ ] Dashboard displays ✅
- [ ] Mobile responsive ✅

### API Tests
- [ ] Scan endpoint works ✅
- [ ] Error handling works ✅

---

## 📚 Full Documentation

For detailed testing instructions, see:
- [DAY5_TESTING_PLAN.md](docs/DAY5_TESTING_PLAN.md) - Complete testing plan
- [DAY5_STATUS.md](docs/DAY5_STATUS.md) - Current status
- [TESTING_GUIDE.md](docs/TESTING_GUIDE.md) - Testing guide

---

## 🎯 Success Criteria

Day 5 is complete when:
- ✅ All 4 gateway tests pass
- ✅ Live site is accessible
- ✅ Audit functionality works
- ✅ No critical issues found

---

## 🚀 Next Steps

### If Everything Passes
**Day 6:** User acceptance testing
**Day 7:** Performance optimization
**Day 8:** Documentation finalization
**Day 9:** Launch preparation
**Day 10:** Production launch 🎉

### If Issues Found
**Day 6:** Fix critical issues
**Day 7:** Fix high-priority issues
**Day 8:** Retest everything
**Day 9:** Final verification
**Day 10:** Launch (if ready)

---

**Ready? Let's test!** 🧪

```bash
npm run test:day5
```
