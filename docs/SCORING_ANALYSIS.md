# Scoring Algorithm Analysis & Refinement

**Last Updated**: November 9, 2025  
**Status**: In Progress  
**Goal**: Optimize scoring algorithms for accuracy and fairness

---

## 🎯 Current Scoring System

### Overall Score Calculation
```
Overall Score = (E-E-A-T Score × 0.5) + (Technical SEO Score × 0.5)
```

### E-E-A-T Score Breakdown
```
E-E-A-T = (Experience × 0.25) + (Expertise × 0.25) + 
          (Authoritativeness × 0.25) + (Trustworthiness × 0.25)
```

---

## 📊 Identified Issues & Improvements

### 1. **Experience Score** - Too Sensitive to First-Person Pronouns

**Current Problem**:
- Heavily weights first-person pronouns (I, we, my, our)
- Can penalize objective, authoritative content
- News articles and academic papers score poorly

**Example**:
```
"I tested this product" → High score ✅
"Research shows this product works" → Low score ❌
```

**Proposed Fix**:
```javascript
// OLD: 20 points for first-person
score += Math.min(20, (firstPersonCount / wordCount) * 1000);

// NEW: 15 points, with content-type awareness
const firstPersonRatio = firstPersonCount / wordCount;
if (firstPersonRatio > 0.01) {
  score += Math.min(15, firstPersonRatio * 750);
} else {
  // Alternative: Check for case studies, examples
  const caseStudyPatterns = /(case study|real example|actual results)/gi;
  score += Math.min(15, (markdown.match(caseStudyPatterns) || []).length * 5);
}
```

---

### 2. **Expertise Score** - Word Count Bias

**Current Problem**:
- Longer content automatically scores higher
- Short, high-quality content penalized
- 2000+ words gets full 15 points, <1000 words gets 0-5

**Example**:
```
2500-word fluff article → 15 points ✅
800-word expert guide → 5 points ❌
```

**Proposed Fix**:
```javascript
// OLD: Fixed thresholds
if (wordCount > 2000) score += 15;
else if (wordCount > 1500) score += 10;
else if (wordCount > 1000) score += 5;

// NEW: Content density scoring
const contentDensity = technicalCount / wordCount;
const qualityMultiplier = contentDensity > 0.05 ? 1.5 : 1.0;

if (wordCount > 1500) score += 15 * qualityMultiplier;
else if (wordCount > 1000) score += 12 * qualityMultiplier;
else if (wordCount > 500) score += 8 * qualityMultiplier;
else score += 5 * qualityMultiplier;
```

---

### 3. **Authoritativeness Score** - Date Pattern Too Broad

**Current Problem**:
- Any 4-digit number triggers "freshness" bonus
- Years in historical content (e.g., "in 1995") count as dates
- 20 points given too easily

**Example**:
```
"Updated 2025" → 20 points ✅
"Founded in 1995" → 20 points ❌ (false positive)
```

**Proposed Fix**:
```javascript
// OLD: Any 4-digit pattern
const datePatterns = /(updated|published|last modified|\\d{4})/gi;
if (datePatterns.test(markdown)) score += 20;

// NEW: Specific date indicators
const updatePatterns = /(updated|last updated|published|last modified).*?(202[3-9]|20[3-9]\\d)/gi;
const recentUpdate = updatePatterns.test(markdown);
if (recentUpdate) {
  score += 20;
} else {
  // Check for any date mention (reduced points)
  const anyDatePattern = /(updated|published|last modified)/gi;
  if (anyDatePattern.test(markdown)) score += 10;
}
```

---

### 4. **Trustworthiness Score** - Broken Links Placeholder

**Current Problem**:
- Always gives 10 points for "no broken links"
- Not actually checking links
- Inflates scores artificially

**Proposed Fix**:
```javascript
// OLD: Placeholder
score += 10;

// NEW: Remove until we can actually check
// OR: Implement basic link validation
const suspiciousLinks = links.filter(link => 
  link.url.includes('bit.ly') || 
  link.url.includes('tinyurl') ||
  link.url === '#'
).length;

if (suspiciousLinks === 0) {
  score += 10;
} else {
  score += Math.max(0, 10 - (suspiciousLinks * 2));
}
```

---

### 5. **Technical SEO** - Meta Description Penalties Too Harsh

**Current Problem**:
- Missing description = P0 (critical)
- Too harsh for some content types (landing pages, apps)
- Should be P1, not P0

**Proposed Fix**:
```javascript
// OLD: P0 priority
priority: 'P0',

// NEW: P1 priority (still important, not critical)
priority: 'P1',
```

---

## 🔧 Proposed Weight Adjustments

### Current Weights
```javascript
Overall = (E-E-A-T × 0.5) + (Technical × 0.5)
E-E-A-T = (Exp × 0.25) + (Exp × 0.25) + (Auth × 0.25) + (Trust × 0.25)
```

### Proposed Weights (Content-Type Aware)

#### For Blog Posts / Articles
```javascript
Overall = (E-E-A-T × 0.55) + (Technical × 0.45)
E-E-A-T = (Exp × 0.30) + (Exp × 0.30) + (Auth × 0.20) + (Trust × 0.20)
```

#### For Landing Pages / Sales Pages
```javascript
Overall = (E-E-A-T × 0.40) + (Technical × 0.60)
E-E-A-T = (Exp × 0.15) + (Exp × 0.25) + (Auth × 0.30) + (Trust × 0.30)
```

#### For Academic / Research Content
```javascript
Overall = (E-E-A-T × 0.60) + (Technical × 0.40)
E-E-A-T = (Exp × 0.10) + (Exp × 0.40) + (Auth × 0.30) + (Trust × 0.20)
```

---

## 📈 Score Distribution Goals

### Target Distribution (Healthy Mix)
```
90-100 (A+/A):   5-10%  (Exceptional content)
80-89  (A-/B+):  15-20% (Excellent content)
70-79  (B/B-):   25-30% (Good content)
60-69  (C+/C):   20-25% (Average content)
50-59  (C-/D):   15-20% (Below average)
0-49   (F):      10-15% (Poor content)
```

### Current Issues
- Too many scores in 40-60 range (grade inflation)
- Not enough differentiation at high end
- Need more granular scoring

---

## 🧪 Testing Plan

### Phase 1: Baseline Testing (Current)
- [ ] Test 20 URLs across different types
- [ ] Record current scores
- [ ] Identify outliers and anomalies
- [ ] Document score distribution

### Phase 2: Algorithm Refinement
- [ ] Implement proposed fixes
- [ ] Test same 20 URLs
- [ ] Compare before/after scores
- [ ] Validate improvements

### Phase 3: Validation
- [ ] Test 50 new URLs
- [ ] Check score distribution
- [ ] Gather user feedback
- [ ] Fine-tune weights

---

## 📝 Test URL Categories

### High-Quality Content (Expected: 80-95)
1. Moz SEO Guide
2. Backlinko Blog Posts
3. HubSpot Marketing Articles
4. Neil Patel Guides
5. Ahrefs Blog

### Medium-Quality Content (Expected: 60-75)
1. Medium articles
2. Small business blogs
3. Personal websites
4. Basic how-to guides

### Low-Quality Content (Expected: 30-50)
1. Thin content pages
2. Keyword-stuffed articles
3. Auto-generated content
4. Spam sites

### Edge Cases (Variable)
1. Landing pages
2. Product pages
3. News articles
4. Academic papers
5. Government sites

---

## 🎯 Success Metrics

### Accuracy
- High-quality content scores 80+: **>80%**
- Low-quality content scores <50: **>70%**
- Medium content in 60-75 range: **>60%**

### Consistency
- Same URL tested multiple times: **±2 points**
- Similar quality content: **±5 points**

### User Satisfaction
- Scores align with user expectations: **>85%**
- Recommendations are actionable: **>90%**

---

## 🔄 Iteration Process

1. **Collect Data**: Run tests, gather scores
2. **Analyze**: Identify patterns and issues
3. **Adjust**: Modify weights and thresholds
4. **Test**: Validate changes
5. **Deploy**: Push improvements
6. **Monitor**: Track score distribution
7. **Repeat**: Continuous improvement

---

## 📊 Scoring Refinement Roadmap

### Week 3 (Current)
- [x] Document current issues
- [x] Propose fixes
- [ ] Implement Phase 1 fixes
- [ ] Test with 20 URLs
- [ ] Analyze results

### Week 4
- [ ] Implement Phase 2 fixes
- [ ] Content-type detection
- [ ] Adaptive weighting
- [ ] Test with 50 URLs

### Week 5
- [ ] Machine learning integration
- [ ] Historical score tracking
- [ ] A/B testing framework
- [ ] User feedback loop

---

## 💡 Future Enhancements

### Content-Type Detection
```javascript
function detectContentType(data) {
  const { wordCount, headings, links, markdown } = data;
  
  // Blog post indicators
  if (wordCount > 1000 && headings.length > 5) return 'blog';
  
  // Landing page indicators
  if (markdown.includes('buy now') || markdown.includes('sign up')) return 'landing';
  
  // Academic indicators
  if (links.filter(l => l.url.includes('.edu')).length > 5) return 'academic';
  
  return 'general';
}
```

### Adaptive Scoring
```javascript
function calculateAdaptiveScore(data) {
  const contentType = detectContentType(data);
  const weights = WEIGHTS[contentType] || WEIGHTS.default;
  
  return (
    (eeatScore * weights.eeat) +
    (technicalScore * weights.technical)
  );
}
```

### Historical Comparison
```javascript
function compareWithHistory(currentScore, url) {
  const history = getAuditHistory(url);
  const trend = calculateTrend(history);
  
  return {
    currentScore,
    previousScore: history[0]?.score,
    change: currentScore - history[0]?.score,
    trend, // 'improving', 'declining', 'stable'
  };
}
```

---

**Next Steps**: Implement Phase 1 fixes and run comprehensive tests
