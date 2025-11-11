# 🧪 RankSmart Testing Guide

## Overview

This guide explains how to test RankSmart's core functionality through our gateway testing system. Each gateway must pass before moving to the next.

## Prerequisites

### Required Environment Variables

```bash
# Required for all tests
OPENAI_API_KEY=your_openai_api_key_here

# Required for Gateway 4 (Integration Test)
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Optional (for fallback)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Installation

```bash
# Install dependencies
npm install

# Or with yarn
yarn install
```

## Test Structure

### Gateway System

RankSmart uses a **sequential gateway testing system**:

1. **Gateway 1**: Firecrawl Module (Web Scraping)
2. **Gateway 2**: E-E-A-T Scorer (Content Quality)
3. **Gateway 3**: Technical SEO Checker
4. **Gateway 4**: Full Integration Test

Each gateway **must pass** before proceeding to the next. This ensures:
- ✅ Individual modules work correctly
- ✅ Dependencies are properly configured
- ✅ Integration is validated
- ✅ Production readiness

## Running Tests

### Run All Tests (Recommended)

```bash
npm test
```

This runs all gateways sequentially and stops at the first failure.

### Run Individual Gateways

```bash
# Gateway 1: Firecrawl Module
npm run test:gateway1

# Gateway 2: E-E-A-T Scorer
npm run test:gateway2

# Gateway 3: Technical SEO
npm run test:gateway3

# Gateway 4: Integration Test
npm run test:gateway4
```

### Run AI Brain Test

```bash
npm run test:brain
```

## Gateway Details

### Gateway 1: Firecrawl Module

**Purpose**: Validates web scraping functionality

**Tests**:
- ✅ URL scraping works
- ✅ Content extraction (markdown, HTML)
- ✅ Metadata extraction (title, description)
- ✅ Structural data (headings, images, links)
- ✅ Word count and reading time calculation

**Expected Output**:
```
✅ Result has success property
✅ Success is true
✅ Data object exists
✅ URL matches
✅ Title extracted
✅ Markdown content exists
✅ Word count calculated
✅ Headings extracted
✅ Images extracted
✅ Links extracted
✅ Has content flag

📊 Results: 11/11 checks passed
🎉 TEST GATEWAY 1: PASSED
```

**Common Issues**:
- ❌ Missing `FIRECRAWL_API_KEY` → Set in `.env` file
- ❌ Network timeout → Check internet connection
- ❌ Invalid URL → Use a valid, accessible URL

---

### Gateway 2: E-E-A-T Scorer

**Purpose**: Validates content quality scoring algorithms

**Tests**:
- ✅ Experience score calculation
- ✅ Expertise score calculation
- ✅ Authoritativeness score calculation
- ✅ Trustworthiness score calculation
- ✅ Overall score aggregation
- ✅ Grade assignment
- ✅ Recommendations generation

**Expected Output**:
```
✅ E-E-A-T result has success property
✅ Overall score exists
✅ Overall score is a number
✅ Overall score is in valid range (0-100)
✅ Grade exists
✅ Breakdown object exists
✅ Experience score exists
✅ Expertise score exists
✅ Authoritativeness score exists
✅ Trustworthiness score exists
✅ All breakdown scores are numbers
✅ All breakdown scores are in valid range
✅ Recommendations array exists

📊 Results: 13/13 checks passed
🎉 TEST GATEWAY 2: PASSED
```

**Common Issues**:
- ❌ Scores out of range → Algorithm bug (report to dev team)
- ❌ Missing breakdown → Data structure issue

---

### Gateway 3: Technical SEO Checker

**Purpose**: Validates technical SEO analysis

**Tests**:
- ✅ Meta tags analysis
- ✅ Heading structure validation
- ✅ Image optimization checks
- ✅ Link quality analysis
- ✅ Content quality assessment
- ✅ Overall score calculation
- ✅ Issue prioritization (P0, P1, P2)

**Expected Output**:
```
✅ Technical SEO result has success property
✅ Overall score exists
✅ Overall score is a number
✅ Overall score is in valid range (0-100)
✅ Grade exists
✅ Breakdown object exists
✅ Issues by priority exists
✅ Total issues count exists
✅ Critical issues count exists
✅ All category scores are numbers
✅ All category scores are in valid range

📊 Results: 11/11 checks passed
🎉 TEST GATEWAY 3: PASSED
```

**Common Issues**:
- ❌ Missing categories → Data extraction issue
- ❌ Invalid scores → Algorithm bug

---

### Gateway 4: Full Integration Test

**Purpose**: Validates complete audit pipeline

**Tests**:
- ✅ HTTP endpoint works
- ✅ Request/response handling
- ✅ CORS headers set correctly
- ✅ All modules integrated
- ✅ Complete audit report generated
- ✅ Execution time tracked
- ✅ Error handling works

**Expected Output**:
```
✅ Response status is 200
✅ Response body exists
✅ Success flag is true
✅ Data object exists
✅ URL in response
✅ Scanned timestamp exists
✅ Execution time recorded
✅ Overall score exists
✅ Overall grade exists
✅ E-E-A-T data exists
✅ E-E-A-T overall score
✅ E-E-A-T breakdown exists
✅ Technical SEO data exists
✅ Technical SEO score
✅ Page metadata exists
✅ Stats object exists
✅ CORS headers set

📊 Results: 17/17 checks passed
🎉 TEST GATEWAY 4: PASSED
🚀 READY FOR DEPLOYMENT!
```

**Common Issues**:
- ❌ Missing `FIRECRAWL_API_KEY` → Test will be skipped
- ❌ Integration errors → Check previous gateways
- ❌ Timeout → Increase `FIRECRAWL_TIMEOUT` in `.env`

---

## Test Results Interpretation

### All Tests Passed ✅

```
🎉 ALL TESTS PASSED!
✅ All modules are working correctly
✅ Integration is validated
✅ Ready for deployment!
```

**Next Steps**:
1. Deploy to staging environment
2. Run production smoke tests
3. Deploy to production

---

### Tests Passed with Skips ⚠️

```
⚠️  TESTS PASSED WITH SKIPS
✅ 3 test(s) passed
⏸️  1 test(s) skipped (missing API keys)
```

**Next Steps**:
1. Set missing API keys in `.env`
2. Re-run tests
3. Ensure all tests pass before deployment

---

### Tests Failed ❌

```
⚠️  TESTS INCOMPLETE
❌ 1 test(s) failed
⏸️  0 test(s) skipped
⏭️  2 test(s) not run
```

**Next Steps**:
1. Review error messages
2. Fix the failing test
3. Re-run test suite
4. Do NOT proceed until all tests pass

---

## Debugging Failed Tests

### Enable Debug Logging

```bash
# Set debug mode in .env
DEBUG=true
LOG_LEVEL=DEBUG
```

### Check Logs

Each test outputs detailed logs:
- ✅ Success indicators
- ❌ Failure indicators
- 🔍 Debug information
- 📊 Statistics

### Common Debugging Steps

1. **Check Environment Variables**
   ```bash
   # Verify .env file exists
   cat .env
   
   # Check specific variables
   echo $FIRECRAWL_API_KEY
   echo $OPENAI_API_KEY
   ```

2. **Test API Keys**
   ```bash
   # Test Firecrawl API
   curl -X POST https://api.firecrawl.dev/v1/scrape \
     -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"url":"https://example.com"}'
   ```

3. **Check Network Connectivity**
   ```bash
   # Test internet connection
   ping google.com
   
   # Test API endpoints
   curl https://api.firecrawl.dev/v1/health
   ```

4. **Review Test Output**
   - Look for specific error messages
   - Check stack traces
   - Verify data structures

---

## Continuous Integration

### GitHub Actions

Tests run automatically on:
- ✅ Every push to `main`
- ✅ Every pull request
- ✅ Manual workflow dispatch

### Pre-deployment Checklist

Before deploying to production:

- [ ] All tests pass locally
- [ ] All tests pass in CI/CD
- [ ] Environment variables configured
- [ ] API keys valid and active
- [ ] No critical issues in logs
- [ ] Performance benchmarks met
- [ ] Security scan passed

---

## Performance Benchmarks

### Expected Execution Times

| Gateway | Expected Time | Max Time |
|---------|--------------|----------|
| Gateway 1 | 2-5s | 10s |
| Gateway 2 | <1s | 2s |
| Gateway 3 | <1s | 2s |
| Gateway 4 | 3-7s | 15s |

### Optimization Tips

1. **Reduce Timeout**: Lower `FIRECRAWL_TIMEOUT` for faster failures
2. **Parallel Tests**: Run independent tests in parallel (future)
3. **Cache Results**: Cache API responses for repeated tests (future)

---

## Troubleshooting

### Test Hangs/Freezes

**Symptoms**: Test runs indefinitely without output

**Solutions**:
1. Check network connectivity
2. Reduce `FIRECRAWL_TIMEOUT`
3. Kill process and restart
4. Check for infinite loops in code

---

### Intermittent Failures

**Symptoms**: Tests pass sometimes, fail other times

**Solutions**:
1. Check API rate limits
2. Verify network stability
3. Review retry logic
4. Check for race conditions

---

### All Tests Fail

**Symptoms**: Every test fails immediately

**Solutions**:
1. Verify `.env` file exists
2. Check Node.js version (>=18.0.0)
3. Reinstall dependencies: `npm install`
4. Clear cache: `npm cache clean --force`

---

## Support

### Getting Help

1. **Check Documentation**: Review this guide and other docs
2. **Search Issues**: Look for similar problems on GitHub
3. **Create Issue**: Open a new issue with:
   - Test output
   - Environment details
   - Steps to reproduce
   - Expected vs actual behavior

### Reporting Bugs

When reporting test failures, include:
- ✅ Full test output
- ✅ Environment variables (redact sensitive data)
- ✅ Node.js version: `node --version`
- ✅ npm version: `npm --version`
- ✅ Operating system
- ✅ Steps to reproduce

---

## Best Practices

### Before Committing Code

```bash
# Always run tests before committing
npm test

# If tests pass, commit
git add .
git commit -m "Your commit message"
git push
```

### Before Deploying

```bash
# Run full test suite
npm test

# Check for security vulnerabilities
npm audit

# Build for production
npm run build

# Deploy
npm run deploy
```

### Regular Maintenance

- 🔄 Run tests weekly
- 🔄 Update dependencies monthly
- 🔄 Review test coverage quarterly
- 🔄 Optimize slow tests as needed

---

## Future Enhancements

### Planned Improvements

- [ ] Add unit tests for individual functions
- [ ] Implement test coverage reporting
- [ ] Add performance regression tests
- [ ] Create visual regression tests
- [ ] Add load testing
- [ ] Implement E2E tests with Playwright
- [ ] Add mutation testing
- [ ] Create test data generators

---

## Conclusion

The gateway testing system ensures RankSmart's reliability and quality. By following this guide, you can:

✅ Validate all core functionality
✅ Catch bugs before deployment
✅ Ensure production readiness
✅ Maintain code quality

**Remember**: Never skip tests. They're your safety net! 🛡️
