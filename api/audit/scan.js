/**
 * Complete SEO Audit Endpoint
 * Integrates Firecrawl scraping, E-E-A-T scoring, and technical SEO checks
 */

const { scrapeUrl } = require('./firecrawl');
const { calculateEEATScore } = require('./eeat-scorer');
const { runTechnicalSEOAudit } = require('./technical-seo');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests' 
    });
  }

  const startTime = Date.now();

  try {
    const { url } = req.body;

    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ 
        error: 'Invalid request body',
        message: 'Request body must be a valid JSON object' 
      });
    }

    // Validate URL presence
    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required',
        message: 'Please provide a URL to audit in the request body' 
      });
    }

    // Validate URL type
    if (typeof url !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid URL type',
        message: 'URL must be a string' 
      });
    }

    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ 
        error: 'Invalid URL format',
        message: 'Please provide a valid URL (e.g., https://example.com)' 
      });
    }

    // Validate protocol
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ 
        error: 'Invalid protocol',
        message: 'Only HTTP and HTTPS protocols are supported' 
      });
    }

    // Validate hostname
    if (!parsedUrl.hostname || parsedUrl.hostname === 'localhost') {
      return res.status(400).json({ 
        error: 'Invalid hostname',
        message: 'Cannot audit localhost or invalid hostnames' 
      });
    }

    console.log(`[AUDIT START] ${url}`);

    // Step 1: Scrape the page with Firecrawl
    console.log('[STEP 1/4] Scraping page...');
    const scrapeResult = await scrapeUrl(url);
    
    if (!scrapeResult.success) {
      console.error(`[SCRAPE FAILED] ${scrapeResult.error}`);
      return res.status(400).json({ 
        error: 'Failed to scrape URL',
        message: scrapeResult.error,
        details: 'The page could not be accessed or scraped. Please check if the URL is accessible and try again.' 
      });
    }

    const scrapedData = scrapeResult.data;
    
    // Validate scraped data
    if (!scrapedData.hasContent) {
      return res.status(400).json({ 
        error: 'No content found',
        message: 'The page appears to be empty or contains no analyzable content',
        details: 'Please ensure the URL points to a page with text content' 
      });
    }

    console.log(`[SCRAPE SUCCESS] ${scrapedData.wordCount} words extracted`);

    // Step 2: Calculate E-E-A-T Score
    console.log('[STEP 2/4] Calculating E-E-A-T score...');
    let eeatScore;
    try {
      eeatScore = calculateEEATScore(scrapedData);
      console.log(`[E-E-A-T SUCCESS] Score: ${eeatScore.overall}/100`);
    } catch (error) {
      console.error('[E-E-A-T FAILED]', error);
      return res.status(500).json({ 
        error: 'E-E-A-T calculation failed',
        message: error.message,
        details: 'An error occurred while analyzing content quality' 
      });
    }

    // Step 3: Run Technical SEO Audit
    console.log('[STEP 3/4] Running technical SEO audit...');
    let technicalSEO;
    try {
      technicalSEO = runTechnicalSEOAudit(scrapedData);
      console.log(`[TECHNICAL SEO SUCCESS] Score: ${technicalSEO.overallScore}/100`);
    } catch (error) {
      console.error('[TECHNICAL SEO FAILED]', error);
      return res.status(500).json({ 
        error: 'Technical SEO audit failed',
        message: error.message,
        details: 'An error occurred while analyzing technical SEO factors' 
      });
    }

    // Step 4: Calculate Overall Audit Score
    console.log('[STEP 4/4] Compiling audit report...');
    const overallScore = Math.round(
      (eeatScore.overall * 0.5) + 
      (technicalSEO.overallScore * 0.5)
    );

    const executionTime = Date.now() - startTime;

    // Step 5: Compile complete audit report
    const auditReport = {
      url,
      scannedAt: new Date().toISOString(),
      executionTime: `${(executionTime / 1000).toFixed(2)}s`,
      
      // Overall metrics
      overall: {
        score: overallScore,
        grade: getGrade(overallScore),
        status: getStatus(overallScore),
        message: getStatusMessage(overallScore),
      },

      // E-E-A-T Analysis
      eeat: {
        overall: eeatScore.overall,
        grade: eeatScore.grade,
        breakdown: eeatScore.breakdown,
        recommendations: eeatScore.recommendations || [],
        strengths: identifyStrengths(eeatScore.breakdown),
        weaknesses: identifyWeaknesses(eeatScore.breakdown),
      },

      // Technical SEO Analysis
      technicalSEO: {
        overall: technicalSEO.overallScore,
        grade: technicalSEO.grade,
        breakdown: technicalSEO.breakdown || {},
        issuesByPriority: technicalSEO.issuesByPriority || {},
        totalIssues: technicalSEO.totalIssues || 0,
        criticalIssues: technicalSEO.criticalIssues || 0,
      },

      // Page metadata
      page: {
        title: scrapedData.title || 'No title found',
        description: scrapedData.description || 'No description found',
        wordCount: scrapedData.wordCount || 0,
        readingTime: scrapedData.readingTime || 0,
        headingCount: scrapedData.headings?.length || 0,
        imageCount: scrapedData.images?.length || 0,
        linkCount: scrapedData.links?.length || 0,
        contentQuality: scrapedData.contentQuality || { score: 0, grade: 'poor' },
      },

      // Quick stats for dashboard
      stats: {
        totalIssues: (technicalSEO.totalIssues || 0) + (eeatScore.recommendations?.length || 0),
        criticalIssues: (technicalSEO.criticalIssues || 0) + 
                       (eeatScore.recommendations?.filter(r => r.priority === 'high').length || 0),
        eeatScore: eeatScore.overall,
        technicalScore: technicalSEO.overallScore,
      },
    };

    console.log(`[AUDIT COMPLETE] Overall score: ${overallScore}/100 (${executionTime}ms)`);

    return res.status(200).json({
      success: true,
      data: auditReport,
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[AUDIT FAILED] ${error.message} (${executionTime}ms)`);
    console.error('Stack trace:', error.stack);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      details: 'Please try again later or contact support if the issue persists',
      executionTime: `${(executionTime / 1000).toFixed(2)}s`,
    });
  }
};

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
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * Get status from score
 */
function getStatus(score) {
  if (score >= 80) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'needs-improvement';
  return 'poor';
}

/**
 * Get status message from score
 */
function getStatusMessage(score) {
  if (score >= 90) return 'Outstanding! Your content is highly optimized.';
  if (score >= 80) return 'Excellent! Your content is well-optimized with minor improvements possible.';
  if (score >= 70) return 'Good! Your content is solid but has room for improvement.';
  if (score >= 60) return 'Fair. Your content needs some optimization work.';
  if (score >= 50) return 'Needs improvement. Several optimization opportunities identified.';
  return 'Poor. Significant optimization work required.';
}

/**
 * Identify E-E-A-T strengths
 */
function identifyStrengths(breakdown) {
  const strengths = [];
  
  if (breakdown.experience >= 70) {
    strengths.push({
      category: 'Experience',
      score: breakdown.experience,
      message: 'Strong first-hand experience demonstrated',
    });
  }
  
  if (breakdown.expertise >= 70) {
    strengths.push({
      category: 'Expertise',
      score: breakdown.expertise,
      message: 'Clear expertise and knowledge shown',
    });
  }
  
  if (breakdown.authoritativeness >= 70) {
    strengths.push({
      category: 'Authoritativeness',
      score: breakdown.authoritativeness,
      message: 'Good authority signals present',
    });
  }
  
  if (breakdown.trustworthiness >= 70) {
    strengths.push({
      category: 'Trustworthiness',
      score: breakdown.trustworthiness,
      message: 'Strong trust signals detected',
    });
  }
  
  return strengths;
}

/**
 * Identify E-E-A-T weaknesses
 */
function identifyWeaknesses(breakdown) {
  const weaknesses = [];
  
  if (breakdown.experience < 70) {
    weaknesses.push({
      category: 'Experience',
      score: breakdown.experience,
      message: 'Limited first-hand experience shown',
      priority: breakdown.experience < 50 ? 'high' : 'medium',
    });
  }
  
  if (breakdown.expertise < 70) {
    weaknesses.push({
      category: 'Expertise',
      score: breakdown.expertise,
      message: 'Expertise could be better demonstrated',
      priority: breakdown.expertise < 50 ? 'high' : 'medium',
    });
  }
  
  if (breakdown.authoritativeness < 70) {
    weaknesses.push({
      category: 'Authoritativeness',
      score: breakdown.authoritativeness,
      message: 'Authority signals need strengthening',
      priority: breakdown.authoritativeness < 50 ? 'high' : 'medium',
    });
  }
  
  if (breakdown.trustworthiness < 70) {
    weaknesses.push({
      category: 'Trustworthiness',
      score: breakdown.trustworthiness,
      message: 'Trust signals need improvement',
      priority: breakdown.trustworthiness < 50 ? 'high' : 'medium',
    });
  }
  
  return weaknesses;
}
