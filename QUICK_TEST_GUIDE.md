# 🚀 Quick Test Guide - RankSmart

**Time Required**: 30-45 minutes  
**Purpose**: Validate core functionality before beta launch

---

## ⚡ Quick Start

### 1. Setup (5 minutes)
```bash
# Clone and install
git clone https://github.com/dannythehat/ranksmart.git
cd ranksmart
npm install

# Setup environment
cp .env.example .env
# Add your API keys to .env:
# - OPENAI_API_KEY (GPT-5.0)
# - FIRECRAWL_API_KEY
# - SUPABASE_URL & SUPABASE_SERVICE_KEY

# Start server
npm run dev
```

Open: `http://localhost:3000`

---

## 🎯 Core Tests (30 minutes)

### Test 1: Content Analysis (5 min)
**Goal**: Verify GPT-5.0 analyzes content correctly

1. Go to dashboard
2. Enter URL: `https://www.casinoalpha.com/uk/best-online-casinos/`
3. Click "Analyze"
4. **Check**:
   - ✅ Score appears (0-100)
   - ✅ Issues detected (5-20)
   - ✅ Response time: 15-30s
   - ✅ No errors

**Expected**: Score ~75-85, 10-15 issues

---

### Test 2: SERP Analysis (5 min)
**Goal**: Verify competitor research works

1. Click "SERP Analysis"
2. Enter keyword: `best online casinos uk`
3. Click "Analyze"
4. **Check**:
   - ✅ 10 competitors found
   - ✅ Gaps identified
   - ✅ Response time: 30-60s
   - ✅ No errors

**Expected**: 10 results, 5-10 gaps

---

### Test 3: Content Generation (10 min)
**Goal**: Verify GPT-5.0 generates quality content

1. Click "Generate Content"
2. Enter competitor URL: `https://www.casinoalpha.com/uk/best-online-casinos/`
3. Click "Generate Better Content"
4. **Check**:
   - ✅ Content generated (1500-3000 words)
   - ✅ SEO score: 85-95
   - ✅ Meta tags included
   - ✅ Response time: 30-60s
   - ✅ No errors

**Expected**: High-quality article, score 85+

---

### Test 4: Apply Fixes (5 min)
**Goal**: Verify surgical fixes work

1. Use a low-scoring article (50-70)
2. Click "Apply Fixes"
3. **Check**:
   - ✅ Score improves (+15-25 points)
   - ✅ Issues fixed (80-95%)
   - ✅ Before/after comparison works
   - ✅ Response time: 20-40s
   - ✅ No errors

**Expected**: Score improvement visible

---

### Test 5: Export (5 min)
**Goal**: Verify export formats work

1. Generate or analyze content
2. Try each export:
   - HTML
   - Markdown
   - WordPress
3. **Check**:
   - ✅ All formats download
   - ✅ Formatting preserved
   - ✅ No errors

**Expected**: All exports work

---

## 🔍 GPT-5.0 Verification

### Check API Calls
Open browser DevTools → Network tab:

1. Filter: `api/`
2. Look for POST requests
3. Check request payload
4. **Verify**: `"model": "gpt-5.0"`

### Check OpenAI Dashboard
1. Go to: https://platform.openai.com/usage
2. Check recent API calls
3. **Verify**: Model shows as `gpt-5.0`

---

## 🐛 Common Issues

### Issue: "API Key Invalid"
**Fix**: Check `.env` file has correct `OPENAI_API_KEY`

### Issue: "Firecrawl Error"
**Fix**: Check `FIRECRAWL_API_KEY` is valid

### Issue: "Timeout"
**Fix**: Content too large or API slow. Try smaller article.

### Issue: "No Score"
**Fix**: Check API response in DevTools. May be GPT-5.0 rate limit.

---

## ✅ Success Criteria

**Ready for Beta if**:
- ✅ All 5 core tests pass
- ✅ GPT-5.0 verified in API calls
- ✅ No critical errors
- ✅ Response times acceptable
- ✅ Export works

**Not Ready if**:
- ❌ Any test fails completely
- ❌ GPT-4 being used instead of GPT-5.0
- ❌ Frequent errors or crashes
- ❌ Response times >2 minutes

---

## 📊 Quick Test Results

| Test | Status | Time | Notes |
|------|--------|------|-------|
| Content Analysis | ⬜ | | |
| SERP Analysis | ⬜ | | |
| Content Generation | ⬜ | | |
| Apply Fixes | ⬜ | | |
| Export | ⬜ | | |
| GPT-5.0 Verified | ⬜ | | |

**Overall**: ⬜ Not Tested

---

## 🚀 Next Steps

### If All Tests Pass ✅
1. Mark as "Ready for Beta"
2. Start inviting beta testers
3. Monitor for issues
4. Collect feedback

### If Tests Fail ❌
1. Document issues in `TESTING_CHECKLIST.md`
2. Fix critical bugs first
3. Re-test
4. Repeat until all pass

---

## 💡 Pro Tips

1. **Test with real content** - Use actual iGaming/affiliate sites
2. **Monitor costs** - GPT-5.0 is expensive, watch API usage
3. **Check quality** - Compare GPT-5.0 output vs GPT-4
4. **Time everything** - Users care about speed
5. **Test edge cases** - Very long articles, special characters, etc.

---

## 📞 Need Help?

- **GitHub Issues**: https://github.com/dannythehat/ranksmart/issues
- **Email**: doodaniel49@gmail.com
- **Documentation**: See `TESTING_CHECKLIST.md` for detailed tests

---

**Last Updated**: November 10, 2025  
**Version**: 2.0 (GPT-5.0)  
**Status**: Ready for Quick Testing