# RankSmart Testing Suite

Comprehensive testing infrastructure for the RankSmart SEO audit platform.

---

## 📁 Test Files

### `audit-test.js`
**Automated test suite** for the audit endpoint.

**Features**:
- Tests multiple URL types (good SEO, medium quality, edge cases)
- Validates response structure
- Measures execution time
- Generates test summaries with score distribution
- Handles errors gracefully

**Usage**:
```bash
# Run all tests
node tests/audit-test.js

# Or use npm script (if configured)
npm test
```

**Expected Output**:
```
🚀 Starting Audit Endpoint Tests
Testing 6 URLs...

================================================================================
Testing: https://moz.com/learn/seo/what-is-seo
================================================================================
✅ Audit completed successfully!

📊 OVERALL SCORE
   Score: 82/100 (A-)
   Status: excellent

🎯 E-E-A-T ANALYSIS
   Overall: 85/100 (A)
   Experience: 78/100
   Expertise: 92/100
   ...
```

---

### `manual-test.md`
**Complete manual testing guide** with step-by-step instructions.

**Includes**:
- 7 comprehensive test scenarios
- cURL and JavaScript examples
- Response validation checklist
- Performance testing guidelines
- Troubleshooting section
- Edge case testing

**Test Scenarios**:
1. Basic Audit (Good SEO)
2. Medium Quality Site
3. Error Handling - Invalid URL
4. Edge Cases (404, timeouts, redirects)
5. Response Validation
6. Performance Testing
7. Concurrent Requests

---

## 🚀 Quick Start

### Prerequisites
1. Vercel deployment is live OR running locally
2. `FIRECRAWL_API_KEY` is configured in environment variables
3. Node.js 18+ installed (for automated tests)

### Running Tests

**Option 1: Automated Tests**
```bash
cd tests
node audit-test.js
```

**Option 2: Manual Testing**
```bash
# Follow instructions in manual-test.md
curl -X POST https://your-vercel-url.vercel.app/api/audit/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

**Option 3: Browser Console**
```javascript
fetch('https://your-vercel-url.vercel.app/api/audit/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://example.com' })
})
.then(r => r.json())
.then(data => console.log(data));
```

---

## ✅ Test Checklist

After running tests, verify:

- [ ] Valid URLs return 200 status
- [ ] Invalid URLs return appropriate 400 errors
- [ ] All response fields are present
- [ ] Scores are within 0-100 range
- [ ] Grades are valid (A+ to F)
- [ ] Execution time is reasonable (<30s)
- [ ] Error messages are clear and helpful
- [ ] Edge cases are handled gracefully
- [ ] No server crashes or 500 errors
- [ ] CORS headers are present

---

## 📊 Expected Results

### Good SEO Site (e.g., Moz, Backlinko)
- Overall Score: 70-85/100
- E-E-A-T Score: 75-90/100
- Technical SEO: 70-85/100
- Word Count: 2000+
- Execution Time: 5-15s

### Medium Quality Site (e.g., example.com)
- Overall Score: 30-50/100
- E-E-A-T Score: 20-40/100
- Technical SEO: 40-60/100
- Word Count: <500
- Execution Time: 3-8s

### Error Cases
- Invalid URL: 400 with clear error message
- 404 Page: 400 with "Failed to scrape URL"
- Timeout: 400 with "Request timeout after 30 seconds"
- No Content: 400 with "No content found"

---

## 🐛 Troubleshooting

### Issue: "FIRECRAWL_API_KEY is not configured"
**Solution**: Add `FIRECRAWL_API_KEY` to Vercel environment variables or `.env` file

### Issue: Timeout errors
**Solution**: Increase `FIRECRAWL_TIMEOUT` in environment variables (default: 30000ms)

### Issue: "No content found"
**Solution**: Check if URL is accessible and contains text content

### Issue: 500 Internal Server Error
**Solution**: Check Vercel logs for detailed error messages:
```bash
vercel logs
```

### Issue: Tests fail locally but work on Vercel
**Solution**: Ensure local environment variables match Vercel configuration

---

## 📈 Test Metrics

Track these metrics over time:

- **Success Rate**: % of tests passing
- **Average Execution Time**: Time to complete audit
- **Score Distribution**: Range of scores across test URLs
- **Error Rate**: % of requests resulting in errors
- **Coverage**: % of code covered by tests

---

## 🔄 Continuous Testing

### When to Run Tests

1. **Before Deployment**: Always run tests before pushing to production
2. **After Code Changes**: Test affected endpoints
3. **Weekly**: Full test suite to catch regressions
4. **After API Updates**: When Firecrawl or other APIs change

### Automated Testing (Future)

Consider setting up:
- GitHub Actions for CI/CD
- Scheduled tests (daily/weekly)
- Performance monitoring
- Alert system for failures

---

## 📝 Adding New Tests

To add a new test case:

1. **Add URL to test array** in `audit-test.js`:
```javascript
const testUrls = [
  'https://your-new-test-url.com',
  // ... existing URLs
];
```

2. **Document in manual-test.md**:
```markdown
## Test X: Your New Test

**URL**: `https://your-new-test-url.com`

**Expected Results**:
- Score: X/100
- Issues: Y
```

3. **Run tests** and verify results
4. **Update documentation** with findings

---

## 🎯 Next Steps

1. ✅ Run comprehensive tests with real URLs
2. 🚧 Refine scoring algorithms based on results
3. ⏳ Add integration tests for database operations
4. ⏳ Add UI tests for frontend components
5. ⏳ Set up automated CI/CD testing

---

**Last Updated**: November 9, 2025  
**Test Coverage**: Audit endpoint (scan.js)  
**Status**: Active development
