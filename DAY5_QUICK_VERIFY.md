# ⚡ Day 5 Quick Verification

**Time:** 5 minutes  
**Goal:** Verify Day 5 works before Day 6

---

## 🚀 Quick Commands

```bash
# 1. Setup (if needed)
cp .env.example .env
npm install

# 2. Run tests
npm run test:day5

# 3. Verify deployment
curl https://ranksmart.vercel.app/

# 4. Test audit
curl -X POST https://ranksmart.vercel.app/api/audit/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

---

## ✅ Quick Checklist

### Must Pass (Critical)
- [ ] `npm run test:day5` → All 4 tests pass
- [ ] Live site loads: https://ranksmart.vercel.app/
- [ ] Audit works: https://ranksmart.vercel.app/new-audit.html
- [ ] API responds: `/api/audit/scan` returns 200

### Should Check
- [ ] .env has OPENAI_API_KEY
- [ ] .env has FIRECRAWL_API_KEY
- [ ] Vercel env vars configured
- [ ] No console errors (F12)

---

## 🎯 Expected Results

### Test Output
```
🎉 ALL TESTS PASSED!
✅ Passed: 4
❌ Failed: 0
```

### API Response
```json
{
  "success": true,
  "data": {
    "overall": { "score": 85 },
    "eeat": { "overall": 78 },
    "technicalSEO": { "overall": 92 }
  }
}
```

---

## 🐛 Quick Fixes

| Problem | Fix |
|---------|-----|
| Missing .env | `cp .env.example .env` |
| Missing modules | `npm install` |
| Test fails | Check API keys in .env |
| 404 on live site | Check Vercel deployment |
| API timeout | Try different test URL |

---

## 📋 Files to Check

**Backend:**
- `api/audit/scan.js` - Main endpoint
- `api/audit/firecrawl.js` - Scraping
- `api/audit/eeat-scorer.js` - E-E-A-T
- `api/audit/technical-seo.js` - SEO checks

**Frontend:**
- `public/index.html` - Homepage
- `public/new-audit.html` - Audit page
- `public/dashboard.html` - Dashboard

**Tests:**
- `tests/run-day5-tests.js` - Test runner
- `tests/01-firecrawl-test.js` - Gateway 1
- `tests/04-integration-test.js` - Gateway 4

---

## 🚦 Go/No-Go Decision

### ✅ GO (Proceed to Day 6)
- All 4 tests pass
- Live site works
- Audit completes successfully
- No critical errors

### ❌ NO-GO (Fix issues first)
- Any test fails
- Live site 404/500 errors
- Audit doesn't work
- Critical bugs found

---

## 📚 Full Documentation

- [DAY5_VERIFICATION_GUIDE.md](./DAY5_VERIFICATION_GUIDE.md) - Complete guide
- [DAY5_SUMMARY.md](./DAY5_SUMMARY.md) - What was built
- [GitHub Issue #37](https://github.com/dannythehat/ranksmart/issues/37) - Verification checklist

---

## 🆘 Still Stuck?

1. Run automated script: `./scripts/verify-day5.sh`
2. Check full guide: [DAY5_VERIFICATION_GUIDE.md](./DAY5_VERIFICATION_GUIDE.md)
3. Review test output for specific errors
4. Check Vercel logs for deployment issues

---

**⏱️ Total Time:** 5-10 minutes  
**⚠️ Don't skip this!** Day 6 depends on Day 5 working correctly.
