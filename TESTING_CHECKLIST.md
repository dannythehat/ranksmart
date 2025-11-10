# 🧪 RankSmart Testing Checklist

**Date**: November 10, 2025  
**Status**: Ready for Testing  
**Tester**: Daniel Doo

---

## 🎯 Testing Overview

This checklist covers all features and functionality of RankSmart. Test each item and mark as ✅ (Pass), ❌ (Fail), or ⚠️ (Needs Attention).

---

## 1️⃣ Core Audit Engine

### Content Analysis
- [ ] **Test URL Input**: Enter a valid article URL
- [ ] **Firecrawl Scraping**: Verify content is scraped correctly
- [ ] **E-E-A-T Scoring**: Check if score is 0-100 with breakdown
- [ ] **Technical SEO**: Verify meta tags, headings, keywords detected
- [ ] **Content Quality**: Check readability, structure analysis
- [ ] **Issue Detection**: Confirm issues are identified with locations
- [ ] **GPT-5.0 Analysis**: Verify model is `gpt-5.0` in API calls

**Test URLs**:
- iGaming: `https://www.casinoalpha.com/uk/best-online-casinos/`
- Finance: `https://www.investopedia.com/terms/s/stock.asp`
- Tech: `https://www.techcrunch.com/latest-article`

**Expected Results**:
- Score: 0-100
- Issues: 5-20 detected
- Response time: 15-30 seconds
- Model: gpt-5.0

---

## 2️⃣ SERP Analysis

### Competitor Research
- [ ] **Keyword Input**: Enter target keyword
- [ ] **Top 10 Fetch**: Verify 10 competitors are found
- [ ] **Content Scraping**: Check all competitor content is scraped
- [ ] **Gap Analysis**: Confirm gaps are identified
- [ ] **Scoring**: Verify each competitor has a score
- [ ] **Recommendations**: Check strategic recommendations provided
- [ ] **GPT-5.0 Analysis**: Verify model is `gpt-5.0`

**Test Keywords**:
- `best online casinos uk`
- `how to invest in stocks`
- `best vpn for privacy`

**Expected Results**:
- 10 competitors found
- Gaps identified: 3-10
- Response time: 30-60 seconds
- Model: gpt-5.0

---

## 3️⃣ Mode A: Fix My Article

### Content Surgery
- [ ] **Load Article**: Import existing article
- [ ] **Analyze Issues**: Verify issues are detected
- [ ] **Apply Fixes**: Click "Apply Fixes" button
- [ ] **Keyword Insertion**: Check keywords inserted naturally
- [ ] **Section Expansion**: Verify sections are expanded
- [ ] **Heading Restructure**: Confirm headings are improved
- [ ] **Meta Tags**: Check meta title/description optimized
- [ ] **Before/After**: Verify before/after comparison works
- [ ] **Score Improvement**: Confirm score increases (e.g., 71→96)
- [ ] **GPT-5.0 Surgery**: Verify model is `gpt-5.0`

**Test Article**: Use a low-scoring article (50-70 score)

**Expected Results**:
- Score improvement: +15-25 points
- Issues fixed: 80-95%
- Response time: 20-40 seconds
- Model: gpt-5.0

---

## 4️⃣ Mode B: Rewrite Competitor Content

### Content Generation
- [ ] **Competitor URL**: Enter competitor URL
- [ ] **Analyze Competitor**: Verify analysis completes
- [ ] **Generate Content**: Click "Generate Better Content"
- [ ] **Content Quality**: Check content is well-written
- [ ] **SEO Optimization**: Verify keywords, headings, structure
- [ ] **Uniqueness**: Confirm content is 100% unique
- [ ] **Image Suggestions**: Check image placement recommendations
- [ ] **Meta Tags**: Verify meta title/description generated
- [ ] **Export Options**: Test HTML, Markdown, WordPress export
- [ ] **GPT-5.0 Generation**: Verify model is `gpt-5.0`

**Test Competitor URLs**:
- `https://www.casinoalpha.com/uk/best-online-casinos/`
- `https://www.nerdwallet.com/article/investing/how-to-invest-in-stocks`

**Expected Results**:
- Content length: 1500-3000 words
- SEO score: 85-95
- Response time: 30-60 seconds
- Model: gpt-5.0

---

## 5️⃣ Mode C: Dynamic Content Monitor

### Auto-Monitoring
- [ ] **Setup Monitor**: Create a new monitor for an article
- [ ] **Source Detection**: Verify official sources are identified
- [ ] **Change Detection**: Test with a changed value (e.g., bonus amount)
- [ ] **Alert System**: Check if alerts are triggered
- [ ] **Update Generation**: Verify updates are generated
- [ ] **Bulk Apply**: Test applying updates across multiple articles
- [ ] **Schedule**: Confirm monitoring runs on schedule
- [ ] **GPT-5.0 Detection**: Verify model is `gpt-5.0`

**Test Scenarios**:
- Casino bonus change: £20 → £25
- Regulation update: New UKGC rule
- Odds change: 2.5 → 3.0

**Expected Results**:
- Changes detected: 100%
- Updates generated: Accurate
- Response time: 10-20 seconds per article
- Model: gpt-5.0

---

## 6️⃣ Link Building System

### Link Opportunities
- [ ] **Analyze Article**: Upload article for link analysis
- [ ] **Find Opportunities**: Verify link opportunities are found
- [ ] **Relevance Scoring**: Check relevance scores (0-100)
- [ ] **Natural Insertion**: Test link insertion in content
- [ ] **Context Preservation**: Verify content flow is maintained
- [ ] **Anchor Text**: Check anchor text is natural
- [ ] **Multiple Links**: Test inserting 3-5 links
- [ ] **GPT-5.0 Analysis**: Verify model is `gpt-5.0`

**Test Article**: Use an article with 5-10 link opportunities

**Expected Results**:
- Opportunities found: 5-15
- Relevance scores: 70-95
- Natural insertion: Yes
- Model: gpt-5.0

---

## 7️⃣ Regulation Monitoring

### Compliance Tracking
- [ ] **Add Regulation**: Create a new regulation to monitor
- [ ] **Source Tracking**: Verify official sources are tracked
- [ ] **Change Detection**: Test with a regulation change
- [ ] **Impact Analysis**: Check affected articles are identified
- [ ] **Update Generation**: Verify compliance updates are generated
- [ ] **Bulk Update**: Test updating multiple articles
- [ ] **GPT-5.0 Analysis**: Verify model is `gpt-5.0`

**Test Regulations**:
- UKGC gambling regulations
- GDPR privacy rules
- Financial regulations (FCA)

**Expected Results**:
- Changes detected: 100%
- Affected articles: Accurate
- Updates: Compliant
- Model: gpt-5.0

---

## 8️⃣ Export & Integration

### Export Formats
- [ ] **HTML Export**: Test HTML export with formatting
- [ ] **Markdown Export**: Verify Markdown syntax is correct
- [ ] **WordPress Export**: Check WordPress-ready format
- [ ] **Copy to Clipboard**: Test copy functionality
- [ ] **Download File**: Verify file download works
- [ ] **Formatting Preservation**: Check headings, lists, links preserved

**Test Content**: Use a generated article with all elements

**Expected Results**:
- All formats work: Yes
- Formatting preserved: Yes
- No errors: Yes

---

## 9️⃣ User Interface

### Dashboard
- [ ] **Login/Signup**: Test authentication flow
- [ ] **Dashboard Load**: Verify dashboard loads quickly
- [ ] **Navigation**: Check all menu items work
- [ ] **Responsive Design**: Test on mobile, tablet, desktop
- [ ] **Loading States**: Verify spinners/progress indicators
- [ ] **Error Messages**: Check error handling is user-friendly
- [ ] **Success Messages**: Verify success notifications appear

**Test Devices**:
- Desktop: Chrome, Firefox, Safari
- Mobile: iOS Safari, Android Chrome
- Tablet: iPad, Android tablet

**Expected Results**:
- Load time: <3 seconds
- Responsive: Yes
- No broken links: Yes

---

## 🔟 API & Backend

### API Endpoints
- [ ] **POST /api/audit/analyze**: Test content analysis
- [ ] **POST /api/audit/serp**: Test SERP analysis
- [ ] **POST /api/content/generate**: Test content generation
- [ ] **POST /api/audit/apply-fixes**: Test fix application
- [ ] **POST /api/linkbuilding/analyze**: Test link analysis
- [ ] **POST /api/regulations/analyze**: Test regulation analysis
- [ ] **POST /api/monitor/analyze-changes**: Test change detection
- [ ] **Error Handling**: Test with invalid inputs
- [ ] **Rate Limiting**: Verify rate limits work
- [ ] **Authentication**: Check auth is required

**Test Tools**:
- Postman/Insomnia
- cURL commands
- Browser DevTools

**Expected Results**:
- All endpoints work: Yes
- Errors handled: Yes
- Auth required: Yes
- Model: gpt-5.0 in all calls

---

## 1️⃣1️⃣ Performance

### Speed & Reliability
- [ ] **Response Times**: Measure API response times
- [ ] **Concurrent Requests**: Test with 5-10 simultaneous requests
- [ ] **Large Content**: Test with 5000+ word articles
- [ ] **Error Recovery**: Test retry logic on failures
- [ ] **Caching**: Verify caching works (if implemented)
- [ ] **Database Performance**: Check query speeds

**Performance Targets**:
- Content analysis: 15-30s
- SERP analysis: 30-60s
- Content generation: 30-60s
- Apply fixes: 20-40s
- Link analysis: 10-20s

**Expected Results**:
- Within targets: Yes
- No timeouts: Yes
- Stable under load: Yes

---

## 1️⃣2️⃣ Security

### Security Checks
- [ ] **API Keys**: Verify API keys are not exposed
- [ ] **Environment Variables**: Check .env is not committed
- [ ] **Input Validation**: Test with malicious inputs
- [ ] **SQL Injection**: Test database queries
- [ ] **XSS Protection**: Test with script tags
- [ ] **CORS**: Verify CORS is configured correctly
- [ ] **HTTPS**: Check SSL/TLS is enabled
- [ ] **Authentication**: Test auth bypass attempts

**Security Tests**:
- SQL injection: `' OR '1'='1`
- XSS: `<script>alert('xss')</script>`
- Path traversal: `../../etc/passwd`

**Expected Results**:
- All inputs sanitized: Yes
- No vulnerabilities: Yes
- HTTPS enforced: Yes

---

## 1️⃣3️⃣ Billing & Payments

### Stripe Integration
- [ ] **Checkout**: Test Stripe checkout flow
- [ ] **Payment Success**: Verify payment success handling
- [ ] **Payment Failure**: Test payment failure handling
- [ ] **Subscription**: Test subscription creation
- [ ] **Upgrade/Downgrade**: Test plan changes
- [ ] **Cancellation**: Test subscription cancellation
- [ ] **Webhooks**: Verify Stripe webhooks work
- [ ] **Invoice Generation**: Check invoices are generated

**Test Cards** (Stripe test mode):
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

**Expected Results**:
- Payments work: Yes
- Webhooks fire: Yes
- Subscriptions created: Yes

---

## 1️⃣4️⃣ Email & Notifications

### Communication
- [ ] **Welcome Email**: Test signup email
- [ ] **Payment Confirmation**: Test payment email
- [ ] **Monitor Alerts**: Test change detection emails
- [ ] **Regulation Updates**: Test compliance emails
- [ ] **Password Reset**: Test password reset flow
- [ ] **Email Templates**: Check email formatting
- [ ] **Unsubscribe**: Test unsubscribe functionality

**Expected Results**:
- Emails delivered: Yes
- Templates formatted: Yes
- Links work: Yes

---

## 1️⃣5️⃣ Edge Cases

### Error Scenarios
- [ ] **Invalid URL**: Test with broken URL
- [ ] **Empty Content**: Test with empty article
- [ ] **Very Long Content**: Test with 10,000+ words
- [ ] **Special Characters**: Test with emojis, unicode
- [ ] **Rate Limit Hit**: Test when API limit is reached
- [ ] **Network Failure**: Test with network interruption
- [ ] **Database Down**: Test with database unavailable
- [ ] **OpenAI API Down**: Test with OpenAI unavailable

**Expected Results**:
- Graceful errors: Yes
- User-friendly messages: Yes
- No crashes: Yes

---

## 1️⃣6️⃣ GPT-5.0 Verification

### Model Confirmation
- [ ] **Check API Calls**: Verify all calls use `gpt-5.0`
- [ ] **Response Quality**: Confirm GPT-5.0 quality (vs GPT-4)
- [ ] **Cost Tracking**: Monitor API costs
- [ ] **Error Handling**: Test GPT-5.0 specific errors
- [ ] **Fallback**: Test fallback to GPT-4 (if implemented)

**Verification Methods**:
1. Check API logs for model parameter
2. Review OpenAI dashboard for model usage
3. Compare output quality with GPT-4
4. Monitor costs (GPT-5.0 is more expensive)

**Expected Results**:
- Model: gpt-5.0 in all calls
- Quality: Superior to GPT-4
- Costs: Within budget

---

## 📊 Testing Summary

### Overall Status

| Category | Status | Notes |
|----------|--------|-------|
| Core Audit Engine | ⬜ Not Tested | |
| SERP Analysis | ⬜ Not Tested | |
| Mode A: Fix Article | ⬜ Not Tested | |
| Mode B: Rewrite Content | ⬜ Not Tested | |
| Mode C: Monitor | ⬜ Not Tested | |
| Link Building | ⬜ Not Tested | |
| Regulation Monitoring | ⬜ Not Tested | |
| Export & Integration | ⬜ Not Tested | |
| User Interface | ⬜ Not Tested | |
| API & Backend | ⬜ Not Tested | |
| Performance | ⬜ Not Tested | |
| Security | ⬜ Not Tested | |
| Billing & Payments | ⬜ Not Tested | |
| Email & Notifications | ⬜ Not Tested | |
| Edge Cases | ⬜ Not Tested | |
| GPT-5.0 Verification | ⬜ Not Tested | |

---

## 🚀 Testing Instructions

### Setup
1. Clone repository: `git clone https://github.com/dannythehat/ranksmart.git`
2. Install dependencies: `npm install`
3. Setup environment variables (copy `.env.example` to `.env`)
4. Start development server: `npm run dev`
5. Open browser: `http://localhost:3000`

### Testing Process
1. Start with Core Audit Engine
2. Test each feature systematically
3. Mark items as ✅ (Pass), ❌ (Fail), or ⚠️ (Needs Attention)
4. Document any bugs or issues
5. Take screenshots of errors
6. Note performance metrics

### Bug Reporting
When you find a bug, document:
- **What**: What went wrong?
- **Where**: Which feature/page?
- **How**: Steps to reproduce
- **Expected**: What should happen?
- **Actual**: What actually happened?
- **Screenshot**: Visual proof

---

## 🐛 Known Issues

(Document issues as you find them)

### Critical Issues
- None yet

### Major Issues
- None yet

### Minor Issues
- None yet

---

## ✅ Testing Completion

**Started**: [Date]  
**Completed**: [Date]  
**Tested By**: Daniel Doo  
**Overall Status**: ⬜ Not Started

**Sign-off**: Once all tests pass, mark as ✅ READY FOR LAUNCH

---

## 📝 Notes

- Test in production-like environment
- Use real API keys (not test keys) for final testing
- Monitor costs during testing
- Keep track of API usage
- Document any unexpected behavior
- Test with real user scenarios

---

**Next Steps After Testing**:
1. Fix all critical and major issues
2. Re-test fixed issues
3. Get user feedback (beta testers)
4. Iterate based on feedback
5. Launch! 🚀