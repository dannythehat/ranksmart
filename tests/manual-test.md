# Manual Testing Guide - Audit Endpoint

## Prerequisites

1. **Environment Setup**
   - Ensure `.env` file is configured with `FIRECRAWL_API_KEY`
   - Vercel deployment is live OR running locally

2. **Test URLs**
   - Use real, accessible URLs
   - Mix of good and poor SEO examples
   - Include edge cases (404s, slow sites, etc.)

---

## Test 1: Basic Audit (Good SEO)

**URL**: `https://moz.com/learn/seo/what-is-seo`

**Expected Results**:
- ✅ Overall score: 70-85/100
- ✅ E-E-A-T score: 75-90/100
- ✅ Technical SEO: 70-85/100
- ✅ Word count: 2000+
- ✅ Multiple headings (H1-H6)
- ✅ Images with alt text
- ✅ Internal links present

**cURL Command**:
```bash
curl -X POST https://your-vercel-url.vercel.app/api/audit/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://moz.com/learn/seo/what-is-seo"}'
```

**JavaScript (Browser Console)**:
```javascript
fetch('https://your-vercel-url.vercel.app/api/audit/scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://moz.com/learn/seo/what-is-seo' })
})
.then(r => r.json())
.then(data => console.log(data));
```

---

## Test 2: Medium Quality Site

**URL**: `https://example.com`

**Expected Results**:
- ✅ Overall score: 30-50/100
- ✅ Low word count
- ✅ Minimal content
- ✅ Few or no images
- ✅ Basic technical SEO

---

## Test 3: Error Handling - Invalid URL

**Test Cases**:

1. **Missing URL**
```bash
curl -X POST https://your-vercel-url.vercel.app/api/audit/scan \
  -H "Content-Type: application/json" \
  -d '{}'
```
Expected: `400 - URL is required`

2. **Invalid Format**
```bash
curl -X POST https://your-vercel-url.vercel.app/api/audit/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "not-a-url"}'
```
Expected: `400 - Invalid URL format`

3. **Unsupported Protocol**
```bash
curl -X POST https://your-vercel-url.vercel.app/api/audit/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "ftp://example.com"}'
```
Expected: `400 - Invalid protocol`

4. **Localhost**
```bash
curl -X POST https://your-vercel-url.vercel.app/api/audit/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:3000"}'
```
Expected: `400 - Invalid hostname`

---

## Test 4: Edge Cases

### 404 Page
```bash
curl -X POST https://your-vercel-url.vercel.app/api/audit/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://httpstat.us/404"}'
```
Expected: Should handle gracefully with error message

### Slow Loading Page
```bash
curl -X POST https://your-vercel-url.vercel.app/api/audit/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://httpstat.us/200?sleep=5000"}'
```
Expected: Should timeout or complete within 30 seconds

### Redirect
```bash
curl -X POST https://your-vercel-url.vercel.app/api/audit/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://httpstat.us/301"}'
```
Expected: Should follow redirect and audit final URL

---

## Test 5: Response Validation

**Check Response Structure**:
```javascript
{
  "success": true,
  "data": {
    "url": "string",
    "scannedAt": "ISO date",
    "executionTime": "string",
    "overall": {
      "score": "number (0-100)",
      "grade": "string (A+ to F)",
      "status": "string",
      "message": "string"
    },
    "eeat": {
      "overall": "number",
      "grade": "string",
      "breakdown": {
        "experience": "number",
        "expertise": "number",
        "authoritativeness": "number",
        "trustworthiness": "number"
      },
      "recommendations": "array",
      "strengths": "array",
      "weaknesses": "array"
    },
    "technicalSEO": {
      "overall": "number",
      "grade": "string",
      "breakdown": "object",
      "issuesByPriority": "object",
      "totalIssues": "number",
      "criticalIssues": "number"
    },
    "page": {
      "title": "string",
      "description": "string",
      "wordCount": "number",
      "readingTime": "number",
      "headingCount": "number",
      "imageCount": "number",
      "linkCount": "number",
      "contentQuality": "object"
    },
    "stats": {
      "totalIssues": "number",
      "criticalIssues": "number",
      "eeatScore": "number",
      "technicalScore": "number"
    }
  }
}
```

---

## Test 6: Performance Testing

**Measure Execution Time**:
```bash
time curl -X POST https://your-vercel-url.vercel.app/api/audit/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://moz.com/learn/seo/what-is-seo"}'
```

**Expected**: 5-15 seconds for most pages

---

## Test 7: Concurrent Requests

**Test Rate Limiting**:
```bash
for i in {1..5}; do
  curl -X POST https://your-vercel-url.vercel.app/api/audit/scan \
    -H "Content-Type: application/json" \
    -d '{"url": "https://example.com"}' &
done
wait
```

**Expected**: All requests should complete successfully

---

## Checklist

After testing, verify:

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

## Troubleshooting

### Issue: "FIRECRAWL_API_KEY is not configured"
**Solution**: Add `FIRECRAWL_API_KEY` to Vercel environment variables

### Issue: Timeout errors
**Solution**: Increase `FIRECRAWL_TIMEOUT` in environment variables

### Issue: "No content found"
**Solution**: Check if URL is accessible and contains text content

### Issue: 500 Internal Server Error
**Solution**: Check Vercel logs for detailed error messages

---

## Next Steps

Once all tests pass:
1. ✅ Mark "Test audit endpoint" as complete
2. 🚧 Move to "Refine scoring algorithms"
3. 🚧 Create audit report UI components
