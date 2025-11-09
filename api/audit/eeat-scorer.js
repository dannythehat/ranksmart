/**
 * E-E-A-T Scoring Algorithm (Refined v1.1)
 * Evaluates Experience, Expertise, Authoritativeness, and Trustworthiness
 * Each score: 0-100
 * 
 * Changelog v1.1:
 * - Reduced first-person pronoun weight (20→15 points)
 * - Added content-type awareness for experience
 * - Improved word count scoring with density multiplier
 * - Fixed date pattern false positives
 * - Removed broken link placeholder
 * - Added suspicious link detection
 */

/**
 * Calculate Experience Score (0-100)
 * Measures first-hand, real-world experience demonstrated in content
 */
function calculateExperienceScore(data) {
  let score = 0;
  const { markdown, metadata, wordCount } = data;

  // 1. First-person narrative indicators (15 points, reduced from 20)
  const firstPersonPatterns = /\b(I|we|my|our|me|us)\b/gi;
  const firstPersonCount = (markdown.match(firstPersonPatterns) || []).length;
  const firstPersonRatio = wordCount > 0 ? firstPersonCount / wordCount : 0;
  
  if (firstPersonRatio > 0.01) {
    // Has first-person content
    score += Math.min(15, firstPersonRatio * 750);
  } else {
    // Alternative: Check for case studies and real examples
    const caseStudyPatterns = /(case study|real example|actual results|real-world|hands-on)/gi;
    const caseStudyCount = (markdown.match(caseStudyPatterns) || []).length;
    score += Math.min(15, caseStudyCount * 5);
  }

  // 2. Personal anecdotes and stories (20 points)
  const anecdotePatterns = /(when I|in my experience|I found|I discovered|I learned|I tried|I tested|we tested|we found)/gi;
  const anecdoteCount = (markdown.match(anecdotePatterns) || []).length;
  score += Math.min(20, anecdoteCount * 4);

  // 3. Specific details and examples (20 points)
  const specificPatterns = /(for example|specifically|in particular|such as|like when|for instance)/gi;
  const specificCount = (markdown.match(specificPatterns) || []).length;
  score += Math.min(20, specificCount * 3);

  // 4. Time-based experience indicators (20 points)
  const timePatterns = /(years of|months of|since \d{4}|for \d+ years|over the past|\d+ years experience)/gi;
  const timeCount = (markdown.match(timePatterns) || []).length;
  score += Math.min(20, timeCount * 5);

  // 5. Results and outcomes shared (25 points, increased from 20)
  const resultsPatterns = /(results|outcome|achieved|improved|increased|decreased|success|performance|impact)/gi;
  const resultsCount = (markdown.match(resultsPatterns) || []).length;
  score += Math.min(25, resultsCount * 2);

  return Math.round(Math.min(100, score));
}

/**
 * Calculate Expertise Score (0-100)
 * Measures demonstrated knowledge and qualifications
 */
function calculateExpertiseScore(data) {
  let score = 0;
  const { markdown, metadata, links, wordCount } = data;

  // 1. Author credentials mentioned (25 points)
  const credentialPatterns = /(PhD|MD|certified|licensed|degree|qualification|expert|specialist|professional|certified)/gi;
  const credentialCount = (markdown.match(credentialPatterns) || []).length;
  score += Math.min(25, credentialCount * 5);

  // 2. Technical depth and jargon (20 points)
  const technicalPatterns = /(algorithm|methodology|framework|analysis|research|study|data|statistics|implementation|optimization)/gi;
  const technicalCount = (markdown.match(technicalPatterns) || []).length;
  const technicalDensity = wordCount > 0 ? technicalCount / wordCount : 0;
  score += Math.min(20, technicalDensity * 500);

  // 3. Citations and references (25 points)
  const externalLinks = links.filter(link => !link.isInternal && 
    (link.url.includes('.edu') || link.url.includes('.gov') || link.url.includes('research')));
  score += Math.min(25, externalLinks.length * 5);

  // 4. Comprehensive coverage with content density (15 points)
  // NEW: Content density multiplier
  const contentDensity = technicalDensity;
  const qualityMultiplier = contentDensity > 0.05 ? 1.5 : 1.0;

  if (wordCount > 1500) {
    score += Math.round(15 * qualityMultiplier);
  } else if (wordCount > 1000) {
    score += Math.round(12 * qualityMultiplier);
  } else if (wordCount > 500) {
    score += Math.round(8 * qualityMultiplier);
  } else {
    score += Math.round(5 * qualityMultiplier);
  }

  // 5. Structured content with headings (15 points)
  const headingCount = data.headings?.length || 0;
  score += Math.min(15, headingCount * 2);

  return Math.round(Math.min(100, score));
}

/**
 * Calculate Authoritativeness Score (0-100)
 * Measures recognition and reputation in the field
 */
function calculateAuthoritativenessScore(data) {
  let score = 0;
  const { markdown, metadata, links } = data;

  // 1. Author bio present (20 points)
  const bioPatterns = /(about the author|author bio|written by|by [A-Z][a-z]+ [A-Z][a-z]+|contributor)/gi;
  if (bioPatterns.test(markdown)) score += 20;

  // 2. Awards and recognition (20 points)
  const awardPatterns = /(award|recognized|featured|published|speaker|contributor|expert|authority)/gi;
  const awardCount = (markdown.match(awardPatterns) || []).length;
  score += Math.min(20, awardCount * 4);

  // 3. High-quality backlinks (20 points)
  const authorityDomains = links.filter(link => 
    link.url.includes('.edu') || 
    link.url.includes('.gov') || 
    link.url.includes('wikipedia') ||
    link.url.includes('forbes') ||
    link.url.includes('nytimes') ||
    link.url.includes('wsj') ||
    link.url.includes('bbc')
  );
  score += Math.min(20, authorityDomains.length * 5);

  // 4. Social proof (20 points)
  const socialPatterns = /(followers|subscribers|readers|community|audience|trusted by)/gi;
  const socialCount = (markdown.match(socialPatterns) || []).length;
  score += Math.min(20, socialCount * 5);

  // 5. Publication date and freshness (20 points)
  // FIXED: More specific date patterns to avoid false positives
  const updatePatterns = /(updated|last updated|published|last modified).*?(202[3-9]|20[3-9]\d)/gi;
  const recentUpdate = updatePatterns.test(markdown);
  
  if (recentUpdate) {
    score += 20;
  } else {
    // Check for any date mention (reduced points)
    const anyDatePattern = /(updated|published|last modified)/gi;
    if (anyDatePattern.test(markdown)) score += 10;
  }

  return Math.round(Math.min(100, score));
}

/**
 * Calculate Trustworthiness Score (0-100)
 * Measures transparency, accuracy, and safety
 */
function calculateTrustworthinessScore(data) {
  let score = 0;
  const { markdown, metadata, links, images } = data;

  // 1. HTTPS and secure connection (15 points)
  if (data.url?.startsWith('https://')) score += 15;

  // 2. Contact information present (15 points)
  const contactPatterns = /(contact|email|phone|address|support|reach us)/gi;
  if (contactPatterns.test(markdown)) score += 15;

  // 3. Privacy policy and terms (15 points)
  const policyPatterns = /(privacy policy|terms of service|disclaimer|cookie policy|gdpr)/gi;
  if (policyPatterns.test(markdown)) score += 15;

  // 4. Fact-checking and sources (20 points)
  const sourcePatterns = /(source|according to|research shows|study found|data from|cited|reference)/gi;
  const sourceCount = (markdown.match(sourcePatterns) || []).length;
  score += Math.min(20, sourceCount * 4);

  // 5. Transparency and disclosure (15 points)
  const disclosurePatterns = /(disclosure|affiliate|sponsored|partnership|disclaimer|transparency)/gi;
  if (disclosurePatterns.test(markdown)) score += 15;

  // 6. Image alt text (10 points)
  const imagesWithAlt = images.filter(img => img.hasAlt).length;
  const altTextRatio = images.length > 0 ? imagesWithAlt / images.length : 1;
  score += Math.round(altTextRatio * 10);

  // 7. Link quality check (10 points)
  // FIXED: Removed placeholder, added suspicious link detection
  const suspiciousLinks = links.filter(link => 
    link.url.includes('bit.ly') || 
    link.url.includes('tinyurl') ||
    link.url.includes('t.co') ||
    link.url === '#' ||
    link.url.startsWith('javascript:')
  ).length;

  if (suspiciousLinks === 0) {
    score += 10;
  } else {
    score += Math.max(0, 10 - (suspiciousLinks * 2));
  }

  return Math.round(Math.min(100, score));
}

/**
 * Calculate overall E-E-A-T score
 */
function calculateEEATScore(scrapedData) {
  const experience = calculateExperienceScore(scrapedData);
  const expertise = calculateExpertiseScore(scrapedData);
  const authoritativeness = calculateAuthoritativenessScore(scrapedData);
  const trustworthiness = calculateTrustworthinessScore(scrapedData);

  // Overall score is weighted average
  // Default weights (can be adjusted based on content type in future)
  const overall = Math.round(
    (experience * 0.25) + 
    (expertise * 0.25) + 
    (authoritativeness * 0.25) + 
    (trustworthiness * 0.25)
  );

  return {
    overall,
    breakdown: {
      experience,
      expertise,
      authoritativeness,
      trustworthiness,
    },
    grade: getGrade(overall),
    recommendations: generateRecommendations({
      experience,
      expertise,
      authoritativeness,
      trustworthiness,
    }),
  };
}

/**
 * Get letter grade from score
 */
function getGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'A-';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'B-';
  if (score >= 60) return 'C+';
  if (score >= 55) return 'C';
  if (score >= 50) return 'C-';
  if (score >= 45) return 'D+';
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * Generate recommendations based on scores
 */
function generateRecommendations(scores) {
  const recommendations = [];

  if (scores.experience < 70) {
    recommendations.push({
      category: 'Experience',
      priority: scores.experience < 50 ? 'high' : 'medium',
      issue: 'Low experience signals detected',
      fix: 'Add more first-hand experiences, personal anecdotes, case studies, and specific examples from real-world applications.',
    });
  }

  if (scores.expertise < 70) {
    recommendations.push({
      category: 'Expertise',
      priority: scores.expertise < 50 ? 'high' : 'medium',
      issue: 'Expertise not clearly demonstrated',
      fix: 'Include author credentials, cite authoritative sources (.edu, .gov), add technical depth, and ensure comprehensive coverage.',
    });
  }

  if (scores.authoritativeness < 70) {
    recommendations.push({
      category: 'Authoritativeness',
      priority: scores.authoritativeness < 50 ? 'high' : 'medium',
      issue: 'Authority signals are weak',
      fix: 'Add author bio with credentials, showcase awards/recognition, link to high-authority sources, and keep content updated.',
    });
  }

  if (scores.trustworthiness < 70) {
    recommendations.push({
      category: 'Trustworthiness',
      priority: scores.trustworthiness < 50 ? 'high' : 'medium',
      issue: 'Trust signals need improvement',
      fix: 'Add contact information, privacy policy, fact-check sources, ensure HTTPS, add image alt text, and avoid suspicious links.',
    });
  }

  return recommendations;
}

module.exports = {
  calculateEEATScore,
  calculateExperienceScore,
  calculateExpertiseScore,
  calculateAuthoritativenessScore,
  calculateTrustworthinessScore,
};
