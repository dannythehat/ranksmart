/**
 * Technical SEO Checker
 * Analyzes meta tags, headings, images, links, and technical elements
 */

/**
 * Check meta tags
 */
function checkMetaTags(data) {
  const issues = [];
  const { title, description, metadata } = data;

  // Title tag checks
  if (!title || title.length === 0) {
    issues.push({
      category: 'Meta Tags',
      priority: 'P0',
      issue: 'Missing title tag',
      fix: 'Add a descriptive title tag (50-60 characters)',
      impact: 'Critical for SEO and click-through rates',
    });
  } else if (title.length < 30) {
    issues.push({
      category: 'Meta Tags',
      priority: 'P1',
      issue: 'Title tag too short',
      fix: `Expand title to 50-60 characters (current: ${title.length})`,
      impact: 'Short titles may not be descriptive enough',
    });
  } else if (title.length > 60) {
    issues.push({
      category: 'Meta Tags',
      priority: 'P1',
      issue: 'Title tag too long',
      fix: `Shorten title to 50-60 characters (current: ${title.length})`,
      impact: 'Long titles get truncated in search results',
    });
  }

  // Meta description checks
  if (!description || description.length === 0) {
    issues.push({
      category: 'Meta Tags',
      priority: 'P0',
      issue: 'Missing meta description',
      fix: 'Add a compelling meta description (150-160 characters)',
      impact: 'Critical for click-through rates',
    });
  } else if (description.length < 120) {
    issues.push({
      category: 'Meta Tags',
      priority: 'P1',
      issue: 'Meta description too short',
      fix: `Expand description to 150-160 characters (current: ${description.length})`,
      impact: 'Short descriptions miss opportunities to attract clicks',
    });
  } else if (description.length > 160) {
    issues.push({
      category: 'Meta Tags',
      priority: 'P2',
      issue: 'Meta description too long',
      fix: `Shorten description to 150-160 characters (current: ${description.length})`,
      impact: 'Long descriptions get truncated in search results',
    });
  }

  // Open Graph checks
  if (!metadata.ogImage) {
    issues.push({
      category: 'Meta Tags',
      priority: 'P2',
      issue: 'Missing Open Graph image',
      fix: 'Add og:image meta tag for social sharing',
      impact: 'Affects social media preview appearance',
    });
  }

  return {
    score: calculateScore(issues, 4),
    issues,
    passed: issues.filter(i => i.priority === 'P0').length === 0,
  };
}

/**
 * Check heading structure
 */
function checkHeadings(data) {
  const issues = [];
  const { headings } = data;

  if (!headings || headings.length === 0) {
    issues.push({
      category: 'Headings',
      priority: 'P0',
      issue: 'No headings found',
      fix: 'Add proper heading structure (H1, H2, H3, etc.)',
      impact: 'Critical for content organization and SEO',
    });
    return { score: 0, issues, passed: false };
  }

  // Check for H1
  const h1Count = headings.filter(h => h.level === 1).length;
  if (h1Count === 0) {
    issues.push({
      category: 'Headings',
      priority: 'P0',
      issue: 'Missing H1 tag',
      fix: 'Add exactly one H1 tag as the main page heading',
      impact: 'H1 is critical for SEO and accessibility',
    });
  } else if (h1Count > 1) {
    issues.push({
      category: 'Headings',
      priority: 'P1',
      issue: `Multiple H1 tags found (${h1Count})`,
      fix: 'Use only one H1 tag per page',
      impact: 'Multiple H1s can confuse search engines',
    });
  }

  // Check heading hierarchy
  let previousLevel = 0;
  headings.forEach((heading, index) => {
    if (heading.level > previousLevel + 1 && previousLevel !== 0) {
      issues.push({
        category: 'Headings',
        priority: 'P2',
        issue: `Heading hierarchy skip detected (H${previousLevel} to H${heading.level})`,
        fix: 'Maintain proper heading hierarchy without skipping levels',
        impact: 'Improves content structure and accessibility',
      });
    }
    previousLevel = heading.level;
  });

  // Check for empty headings
  const emptyHeadings = headings.filter(h => !h.text || h.text.length === 0);
  if (emptyHeadings.length > 0) {
    issues.push({
      category: 'Headings',
      priority: 'P1',
      issue: `${emptyHeadings.length} empty heading(s) found`,
      fix: 'Add descriptive text to all headings',
      impact: 'Empty headings provide no SEO value',
    });
  }

  return {
    score: calculateScore(issues, 4),
    issues,
    passed: issues.filter(i => i.priority === 'P0').length === 0,
  };
}

/**
 * Check image optimization
 */
function checkImages(data) {
  const issues = [];
  const { images } = data;

  if (!images || images.length === 0) {
    return {
      score: 100,
      issues: [],
      passed: true,
      note: 'No images found on page',
    };
  }

  // Check for missing alt text
  const missingAlt = images.filter(img => !img.hasAlt);
  if (missingAlt.length > 0) {
    issues.push({
      category: 'Images',
      priority: 'P1',
      issue: `${missingAlt.length} image(s) missing alt text`,
      fix: 'Add descriptive alt text to all images',
      impact: 'Critical for accessibility and image SEO',
    });
  }

  // Check for generic alt text
  const genericAlt = images.filter(img => 
    img.alt && (
      img.alt.toLowerCase().includes('image') ||
      img.alt.toLowerCase().includes('picture') ||
      img.alt.toLowerCase().includes('photo') ||
      img.alt.length < 5
    )
  );
  if (genericAlt.length > 0) {
    issues.push({
      category: 'Images',
      priority: 'P2',
      issue: `${genericAlt.length} image(s) with generic alt text`,
      fix: 'Use specific, descriptive alt text instead of generic terms',
      impact: 'Better alt text improves accessibility and SEO',
    });
  }

  // Check for large images (basic check based on URL)
  const largeImages = images.filter(img => 
    !img.src.includes('webp') && 
    !img.src.includes('avif') &&
    !img.src.includes('optimized')
  );
  if (largeImages.length > 0) {
    issues.push({
      category: 'Images',
      priority: 'P2',
      issue: `${largeImages.length} image(s) may not be optimized`,
      fix: 'Use modern formats (WebP, AVIF) and compress images',
      impact: 'Optimized images improve page load speed',
    });
  }

  return {
    score: calculateScore(issues, images.length),
    issues,
    passed: issues.filter(i => i.priority === 'P0' || i.priority === 'P1').length === 0,
  };
}

/**
 * Check internal linking
 */
function checkInternalLinks(data) {
  const issues = [];
  const { links } = data;

  if (!links || links.length === 0) {
    issues.push({
      category: 'Internal Links',
      priority: 'P1',
      issue: 'No links found on page',
      fix: 'Add relevant internal and external links',
      impact: 'Links help with navigation and SEO',
    });
    return { score: 0, issues, passed: false };
  }

  const internalLinks = links.filter(link => link.isInternal);
  const externalLinks = links.filter(link => !link.isInternal);

  // Check internal link count
  if (internalLinks.length === 0) {
    issues.push({
      category: 'Internal Links',
      priority: 'P1',
      issue: 'No internal links found',
      fix: 'Add links to related pages on your site',
      impact: 'Internal links help with site navigation and SEO',
    });
  } else if (internalLinks.length < 3) {
    issues.push({
      category: 'Internal Links',
      priority: 'P2',
      issue: `Only ${internalLinks.length} internal link(s) found`,
      fix: 'Add more internal links to related content (aim for 3-5)',
      impact: 'More internal links improve site structure',
    });
  }

  // Check for links with no anchor text
  const emptyAnchors = links.filter(link => !link.text || link.text.length === 0);
  if (emptyAnchors.length > 0) {
    issues.push({
      category: 'Internal Links',
      priority: 'P1',
      issue: `${emptyAnchors.length} link(s) with no anchor text`,
      fix: 'Add descriptive anchor text to all links',
      impact: 'Anchor text helps users and search engines understand link context',
    });
  }

  // Check for generic anchor text
  const genericAnchors = links.filter(link => 
    link.text && (
      link.text.toLowerCase() === 'click here' ||
      link.text.toLowerCase() === 'read more' ||
      link.text.toLowerCase() === 'here' ||
      link.text.toLowerCase() === 'link'
    )
  );
  if (genericAnchors.length > 0) {
    issues.push({
      category: 'Internal Links',
      priority: 'P2',
      issue: `${genericAnchors.length} link(s) with generic anchor text`,
      fix: 'Use descriptive anchor text instead of "click here" or "read more"',
      impact: 'Descriptive anchors improve SEO and user experience',
    });
  }

  return {
    score: calculateScore(issues, 4),
    issues,
    passed: issues.filter(i => i.priority === 'P0' || i.priority === 'P1').length === 0,
    stats: {
      total: links.length,
      internal: internalLinks.length,
      external: externalLinks.length,
    },
  };
}

/**
 * Check content quality metrics
 */
function checkContentQuality(data) {
  const issues = [];
  const { wordCount, readingTime, markdown } = data;

  // Word count check
  if (wordCount < 300) {
    issues.push({
      category: 'Content Quality',
      priority: 'P0',
      issue: 'Content too short',
      fix: `Expand content to at least 1000 words (current: ${wordCount})`,
      impact: 'Thin content ranks poorly in search results',
    });
  } else if (wordCount < 1000) {
    issues.push({
      category: 'Content Quality',
      priority: 'P1',
      issue: 'Content could be more comprehensive',
      fix: `Consider expanding to 1500+ words (current: ${wordCount})`,
      impact: 'Longer, comprehensive content tends to rank better',
    });
  }

  // Reading time
  if (readingTime < 2) {
    issues.push({
      category: 'Content Quality',
      priority: 'P2',
      issue: 'Very short reading time',
      fix: `Add more depth to content (current: ${readingTime} min read)`,
      impact: 'Short content may not fully address user intent',
    });
  }

  // Check for duplicate content patterns
  const sentences = markdown.split(/[.!?]+/);
  const duplicates = sentences.filter((sentence, index) => 
    sentences.indexOf(sentence) !== index && sentence.trim().length > 20
  );
  if (duplicates.length > 0) {
    issues.push({
      category: 'Content Quality',
      priority: 'P2',
      issue: 'Duplicate sentences detected',
      fix: 'Remove or rephrase duplicate content',
      impact: 'Duplicate content provides no additional value',
    });
  }

  return {
    score: calculateScore(issues, 3),
    issues,
    passed: issues.filter(i => i.priority === 'P0').length === 0,
    stats: {
      wordCount,
      readingTime,
      sentences: sentences.length,
    },
  };
}

/**
 * Calculate score based on issues
 */
function calculateScore(issues, maxIssues) {
  const p0Count = issues.filter(i => i.priority === 'P0').length;
  const p1Count = issues.filter(i => i.priority === 'P1').length;
  const p2Count = issues.filter(i => i.priority === 'P2').length;

  // Deduct points based on priority
  let deduction = (p0Count * 30) + (p1Count * 15) + (p2Count * 5);
  return Math.max(0, 100 - deduction);
}

/**
 * Run all technical SEO checks
 */
function runTechnicalSEOAudit(scrapedData) {
  const metaTags = checkMetaTags(scrapedData);
  const headings = checkHeadings(scrapedData);
  const images = checkImages(scrapedData);
  const internalLinks = checkInternalLinks(scrapedData);
  const contentQuality = checkContentQuality(scrapedData);

  // Calculate overall technical SEO score
  const overallScore = Math.round(
    (metaTags.score * 0.25) +
    (headings.score * 0.20) +
    (images.score * 0.15) +
    (internalLinks.score * 0.20) +
    (contentQuality.score * 0.20)
  );

  // Collect all issues
  const allIssues = [
    ...metaTags.issues,
    ...headings.issues,
    ...images.issues,
    ...internalLinks.issues,
    ...contentQuality.issues,
  ];

  // Categorize by priority
  const issuesByPriority = {
    P0: allIssues.filter(i => i.priority === 'P0'),
    P1: allIssues.filter(i => i.priority === 'P1'),
    P2: allIssues.filter(i => i.priority === 'P2'),
  };

  return {
    overallScore,
    grade: getGrade(overallScore),
    breakdown: {
      metaTags,
      headings,
      images,
      internalLinks,
      contentQuality,
    },
    issuesByPriority,
    totalIssues: allIssues.length,
    criticalIssues: issuesByPriority.P0.length,
  };
}

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
  return 'F';
}

module.exports = {
  runTechnicalSEOAudit,
  checkMetaTags,
  checkHeadings,
  checkImages,
  checkInternalLinks,
  checkContentQuality,
};
