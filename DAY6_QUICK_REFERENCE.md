# 📋 Day 6: Quick Reference Card

**Status:** ✅ Infrastructure Complete - Ready for Execution  
**Time Required:** 15-30 minutes

---

## 🚀 Quick Start (3 Commands)

```bash
# 1. Verify setup
npm run test:verify

# 2. Run all tests
npm test

# 3. Check deployment
open https://ranksmart.vercel.app/
```

---

## 📝 Test Commands

| Command | Purpose |
|---------|---------|
| `npm run test:verify` | Check prerequisites |
| `npm test` | Run all gateway tests |
| `npm run test:gateway1` | Test Firecrawl module |
| `npm run test:gateway2` | Test E-E-A-T scorer |
| `npm run test:gateway3` | Test Technical SEO |
| `npm run test:gateway4` | Test integration |

---

## ✅ Success Criteria

All tests should show:
```
🎉 ALL TESTS PASSED!
✅ All modules are working correctly
✅ Integration is validated
✅ Ready for deployment!
```

---

## 🐛 Common Issues

### "Cannot find module"
```bash
npm install
```

### "FIRECRAWL_API_KEY is not configured"
```bash
cp .env.example .env
# Add your API key to .env
```

### Gateway 4 skipped
- Add `FIRECRAWL_API_KEY` to `.env` file
- This is OK for local development

---

## 🌐 Deployment Check

Visit these URLs:
- Homepage: https://ranksmart.vercel.app/
- Audit: https://ranksmart.vercel.app/new-audit.html
- Dashboard: https://ranksmart.vercel.app/dashboard.html

Check for:
- [ ] Pages load without errors
- [ ] Black & purple theme visible
- [ ] No console errors (F12)
- [ ] Audit functionality works

---

## 📚 Full Documentation

- **DAY6_TEST_EXECUTION_GUIDE.md** - Complete guide
- **DAY6_COMPLETE.md** - Summary
- **DAY6_EXECUTION.md** - Tracker

---

## 🎯 After Tests Pass

1. Update `DAY6_EXECUTION.md` with results
2. Mark Day 6 complete in `PROGRESS_TRACKER.md`
3. Move to Day 7 (Week 1 Review)

---

**Last Updated:** November 12, 2025  
**Issue:** #39 (Closed ✅)
