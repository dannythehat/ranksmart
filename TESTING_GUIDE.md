# 🧪 RankSmart Testing Guide

## Overview

This guide explains the **Gateway Testing System** - a sequential validation approach where each test must pass before moving to the next.

## Why Gateway Testing?

**Problem**: Building features without testing creates a house of cards. Code references other code that doesn't work, leading to cascading failures.

**Solution**: Gateway tests validate each module in isolation before integration. Each gateway is a checkpoint that MUST pass before proceeding.

---

## Test Gateways

### Gateway 1: Firecrawl Module ✅
**File**: `tests/01-firecrawl-test.js`  
**Purpose**: Validates web scraping functionality  
**Tests**:
- URL scraping with Firecrawl API
- Content extraction (markdown, HTML)
- Metadata extraction (title, description)
- Link extraction (internal/external)
- Image extraction with alt text
- Heading structure extraction
- Word count and reading time calculation

**Run**: `npm run test:gateway1`

**Must Pass Before**: Gateway 2

---

### Gateway 2: E-E-A-T Scorer ✅
**File**: `tests/02-eeat-scorer-test.js`  
**Purpose**: Validates content quality scoring  
**Tests**:
- Experience score calculation (0-100)
- Expertise score calculation (0-100)
- Authoritativeness score calculation (0-100)
- Trustworthiness score calculation (0-100)
- Overall E-E-A-T score (weighted average)
- Grade assignment (A+ to F)
- Recommendation generation

**Run**: `npm run test:gateway2`

**Must Pass Before**: Gateway 3

---

### Gateway 3: Technical SEO Checker ✅
**File**: `tests/03-technical-seo-test.js`  
**Purpose**: Validates technical SEO analysis  
**Tests**:
- Meta tags validation (title, description)
- Heading structure analysis (H1-H6)
- Image optimization checks
- Internal linking analysis
- Content quality metrics
- Issue prioritization (P0, P1, P2)
- Overall technical score calculation

**Run**: `npm run test:gateway3`

**Must Pass Before**: Gateway 4

---

### Gateway 4: Integration Test 🔄
**File**: `tests/04-integration-test.js`  
**Purpose**: Validates complete scan endpoint  
**Tests**:
- Full request/response cycle
- Module integration (Firecrawl + E-E-A-T + Technical SEO)
- Error handling
- Response structure
- CORS headers
- Execution time tracking

**Run**: `npm run test:gateway4`

**Requires**: 
- Gateways 1, 2, 3 must pass
- `FIRECRAWL_API_KEY` environment variable

**Must Pass Before**: Deployment

---

## Running Tests

### Run All Tests (Recommended)
```bash
npm test
```

This runs all gateways sequentially and stops at the first failure.

### Run Individual Gateways
```bash
npm run test:gateway1  # Firecrawl module
npm run test:gateway2  # E-E-A-T scorer
npm run test:gateway3  # Technical SEO checker
npm run test:gateway4  # Integration test
```

---

## Test Output

### Successful Test
```
🧪 TEST GATEWAY 1: Firecrawl Module
==================================================

📍 Testing URL: https://example.com
⏳ Scraping...

✅ VALIDATION RESULTS:
--------------------------------------------------
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
--------------------------------------------------

📊 Results: 11/11 checks passed

🎉 TEST GATEWAY 1: PASSED
✅ Firecrawl module is working correctly
```

### Failed Test
```
🧪 TEST GATEWAY 1: Firecrawl Module
==================================================

📍 Testing URL: https://example.com
⏳ Scraping...

✅ VALIDATION RESULTS:
--------------------------------------------------
✅ Result has success property
❌ Success is true
✅ Data object exists
--------------------------------------------------

📊 Results: 2/11 checks passed

❌ TEST GATEWAY 1: FAILED
⚠️  9 validation check(s) failed

🔍 Debug Info:
{
  "success": false,
  "error": "FIRECRAWL_API_KEY is not configured"
}
```

---

## Environment Setup

### Required Environment Variables

Create a `.env` file in the project root:

```bash
# Required for Gateway 4 (Integration Test)
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Optional (for future tests)
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Get API Keys

- **Firecrawl**: https://firecrawl.dev/
- **OpenAI**: https://platform.openai.com/api-keys
- **Google Gemini**: https://ai.google.dev/
- **Supabase**: https://supabase.com/

---

## Troubleshooting

### Gateway 1 Fails
**Issue**: Firecrawl API key not configured  
**Fix**: Add `FIRECRAWL_API_KEY` to `.env` file

**Issue**: Network timeout  
**Fix**: Check internet connection, increase timeout in `api/audit/firecrawl.js`

### Gateway 2 Fails
**Issue**: Scoring algorithm returns invalid values  
**Fix**: Check mock data structure in test file

### Gateway 3 Fails
**Issue**: Technical SEO checks fail  
**Fix**: Verify mock data has required fields (title, description, headings, etc.)

### Gateway 4 Fails
**Issue**: Integration test fails after individual tests pass  
**Fix**: Check module imports in `api/audit/scan.js`

---

## Adding New Tests

### Step 1: Create Test File
```javascript
// tests/05-new-feature-test.js

async function testNewFeature() {
  console.log('🧪 TEST GATEWAY 5: New Feature');
  console.log('=' .repeat(50));
  
  // Your test logic here
  
  return true; // or false
}

module.exports = { testNewFeature };
```

### Step 2: Add to Master Test Runner
Edit `tests/00-run-all-tests.js`:
```javascript
const { testNewFeature } = require('./05-new-feature-test.js');

const tests = [
  // ... existing tests
  { name: 'Gateway 5: New Feature', fn: testNewFeature },
];
```

### Step 3: Add NPM Script
Edit `package.json`:
```json
{
  "scripts": {
    "test:gateway5": "node tests/05-new-feature-test.js"
  }
}
```

---

## Best Practices

### ✅ DO
- Run tests sequentially (Gateway 1 → 2 → 3 → 4)
- Fix failures immediately before proceeding
- Add new tests for new features
- Keep tests isolated and independent
- Use descriptive test names
- Log detailed error information

### ❌ DON'T
- Skip failed tests and move forward
- Test multiple features in one gateway
- Rely on external services without fallbacks
- Commit code without passing tests
- Ignore test warnings

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
        env:
          FIRECRAWL_API_KEY: ${{ secrets.FIRECRAWL_API_KEY }}
```

---

## Next Steps

1. ✅ Run `npm test` to validate all gateways
2. ✅ Fix any failures before proceeding
3. ✅ Add environment variables for Gateway 4
4. ✅ Deploy only after all tests pass
5. ✅ Add new tests for new features

---

## Support

If tests fail and you can't figure out why:

1. Check the error message and stack trace
2. Review the debug info in test output
3. Verify environment variables are set
4. Check API key validity
5. Review module code for syntax errors

---

**Remember**: Each gateway is a checkpoint. Don't skip ahead. Fix failures immediately.
