/**
 * E-E-A-T Scoring Algorithm
 * Evaluates Experience, Expertise, Authoritativeness, and Trustworthiness
 * Each score: 0-100
 */

/**
 * Calculate Experience Score (0-100)
 * Measures first-hand, real-world experience demonstrated in content
 */
function calculateExperienceScore(data) {
  let score = 0;
  const { markdown, metadata, wordCount } = data;

  // 1. First-person narrative indicators (20 points)
  const firstPersonPatterns = /\b(I|we|my|our|me|us)\b/gi;
  const firstPersonCount = (markdown.match(firstPersonPatterns) || []).length;
  score += Math.min(20, (firstPersonCount / wordCount) * 1000);

  // 2. Personal anecdotes and stories (20 points)
  const anecdotePatterns = /(when I|in my experience|I found|I discovered|I learned|I tried|I tested)/gi;
  const anecdoteCount = (markdown.match(anecdotePatterns) || []).length;
  score += Math.min(20, anecdoteCount * 4);

  // 3. Specific details and examples (20 points)
  const specificPatterns = /(for example|specifically|in particular|such as|like when)/gi;
  const specificCount = (markdown.match(specificPatterns) || []).length;
  score += Math.min(20, specificCount * 3);

  // 4. Time-based experience indicators (20 points)
  const timePatterns = /(years of|months of|since \d{4}|for \d+ years|over the past)/gi;
  const timeCount = (markdown.match(timePatterns) || []).length;
  score += Math.min(20, timeCount * 5);

  // 5. Results and outcomes shared (20 points)
  const resultsPatterns = /(results|outcome|achieved|improved|increased|decreased|success)/gi;
  const resultsCount = (markdown.match(resultsPatterns) || []).length;
  score += Math.min(20, resultsCount * 2);

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
  const credentialPatterns = /(PhD|MD|certified|licensed|degree|qualification|expert|specialist|professional)/gi;
  const credentialCount = (markdown.match(credentialPatterns) || []).length;
  score += Math.min(25, credentialCount * 5);

  // 2. Technical depth and jargon (20 points)
  const technicalPatterns = /(algorithm|methodology|framework|analysis|research|study|data|statistics)/gi;
  const technicalCount = (markdown.match(technicalPatterns) || []).length;
  score += Math.min(20, (technicalCount / wordCount) * 500);

  // 3. Citations and references (25 points)
  const externalLinks = links.filter(link => !link.isInternal && 
    (link.url.includes('.edu') || link.url.includes('.gov') || link.url.includes('research')));
  score += Math.min(25, externalLinks.length * 5);

  // 4. Comprehensive coverage (15 points)
  if (wordCount > 2000) score += 15;
  else if (wordCount > 1500) score += 10;
  else if (wordCount > 1000) score += 5;

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
  const bioPatterns = /(about the author|author bio|written by|by [A-Z][a-z]+ [A-Z][a-z]+)/gi;
  if (bioPatterns.test(markdown)) score += 20;

  // 2. Awards and recognition (20 points)
  const awardPatterns = /(award|recognized|featured|published|speaker|contributor)/gi;
  const awardCount = (markdown.match(awardPatterns) || []).length;
  score += Math.min(20, awardCount * 4);

  // 3. High-quality backlinks (20 points)
  const authorityDomains = links.filter(link => 
    link.url.includes('.edu') || 
    link.url.includes('.gov') || 
    link.url.includes('wikipedia') ||
    link.url.includes('forbes') ||
    link.url.includes('nytimes')
  );
  score += Math.min(20, authorityDomains.length * 5);

  // 4. Social proof (20 points)
  const socialPatterns = /(followers|subscribers|readers|community|audience)/gi;
  const socialCount = (markdown.match(socialPatterns) || []).length;
  score += Math.min(20, socialCount * 5);

  // 5. Publication date and freshness (20 points)
  const datePatterns = /(updated|published|last modified|\d{4})/gi;
  if (datePatterns.test(markdown)) score += 20;

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
  const contactPatterns = /(contact|email|phone|address|support)/gi;
  if (contactPatterns.test(markdown)) score += 15;

  // 3. Privacy policy and terms (15 points)
  const policyPatterns = /(privacy policy|terms of service|disclaimer|cookie policy)/gi;
  if (policyPatterns.test(markdown)) score += 15;

  // 4. Fact-checking and sources (20 points)
  const sourcePatterns = /(source|according to|research shows|study found|data from)/gi;
  const sourceCount = (markdown.match(sourcePatterns) || []).length;
  score += Math.min(20, sourceCount * 4);

  // 5. Transparency and disclosure (15 points)
  const disclosurePatterns = /(disclosure|affiliate|sponsored|partnership|disclaimer)/gi;
  if (disclosurePatterns.test(markdown)) score += 15;

  // 6. Image alt text (10 points)
  const imagesWithAlt = images.filter(img => img.hasAlt).length;
  const altTextRatio = images.length > 0 ? imagesWithAlt / images.length : 0;
  score += Math.round(altTextRatio * 10);

  // 7. No broken links (10 points)
  // This would require actual link checking - placeholder for now
  score += 10;

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
      priority: 'high',
      issue: 'Low experience signals detected',
      fix: 'Add more first-hand experiences, personal anecdotes, and specific examples from your own work.',
    });
  }

  if (scores.expertise < 70) {
    recommendations.push({
      category: 'Expertise',
      priority: 'high',
      issue: 'Expertise not clearly demonstrated',
      fix: 'Include author credentials, cite authoritative sources, and add more technical depth to content.',
    });
  }

  if (scores.authoritativeness < 70) {
    recommendations.push({
      category: 'Authoritativeness',
      priority: 'medium',
      issue: 'Authority signals are weak',
      fix: 'Add author bio, showcase awards/recognition, and link to high-authority sources.',
    });
  }

  if (scores.trustworthiness < 70) {
    recommendations.push({
      category: 'Trustworthiness',
      priority: 'high',
      issue: 'Trust signals need improvement',
      fix: 'Add contact information, privacy policy, fact-check sources, and ensure all images have alt text.',
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
