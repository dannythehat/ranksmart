/**
 * Complete SEO Audit Endpoint
 * Integrates Firecrawl scraping, E-E-A-T scoring, and technical SEO checks
 */

const { scrapeUrl } = require('./firecrawl');
const { calculateEEATScore } = require('./eeat-scorer');
const { runTechnicalSEOAudit } = require('./technical-seo');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required' 
      });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ 
        error: 'Invalid URL format' 
      });
    }

    console.log(`Starting audit for: ${url}`);

    // Step 1: Scrape the page with Firecrawl
    const scrapeResult = await scrapeUrl(url);
    
    if (!scrapeResult.success) {
      return res.status(400).json({ 
        error: 'Failed to scrape URL',
        details: scrapeResult.error 
      });
    }

    const scrapedData = scrapeResult.data;
    console.log(`Scraped ${scrapedData.wordCount} words from ${url}`);

    // Step 2: Calculate E-E-A-T Score
    const eeatScore = calculateEEATScore(scrapedData);
    console.log(`E-E-A-T Score: ${eeatScore.overall}/100`);

    // Step 3: Run Technical SEO Audit
    const technicalSEO = runTechnicalSEOAudit(scrapedData);
    console.log(`Technical SEO Score: ${technicalSEO.overallScore}/100`);

    // Step 4: Calculate Overall Audit Score
    const overallScore = Math.round(
      (eeatScore.overall * 0.5) + 
      (technicalSEO.overallScore * 0.5)
    );

    // Step 5: Compile complete audit report
    const auditReport = {
      url,
      scannedAt: new Date().toISOString(),
      
      // Overall metrics
      overall: {
        score: overallScore,
        grade: getGrade(overallScore),
        status: overallScore >= 70 ? 'good' : overallScore >= 50 ? 'needs-improvement' : 'poor',
      },

      // E-E-A-T Analysis
      eeat: {
        overall: eeatScore.overall,
        grade: eeatScore.grade,
        breakdown: eeatScore.breakdown,
        recommendations: eeatScore.recommendations,
      },

      // Technical SEO Analysis
      technicalSEO: {
        overall: technicalSEO.overallScore,
        grade: technicalSEO.grade,
        breakdown: technicalSEO.breakdown,
        issuesByPriority: technicalSEO.issuesByPriority,
        totalIssues: technicalSEO.totalIssues,
        criticalIssues: technicalSEO.criticalIssues,
      },

      // Page metadata
      page: {
        title: scrapedData.title,
        description: scrapedData.description,
        wordCount: scrapedData.wordCount,
        readingTime: scrapedData.readingTime,
        headingCount: scrapedData.headings?.length || 0,
        imageCount: scrapedData.images?.length || 0,
        linkCount: scrapedData.links?.length || 0,
      },

      // Quick stats for dashboard
      stats: {
        totalIssues: technicalSEO.totalIssues + eeatScore.recommendations.length,
        criticalIssues: technicalSEO.criticalIssues + eeatScore.recommendations.filter(r => r.priority === 'high').length,
        eeatScore: eeatScore.overall,
        technicalScore: technicalSEO.overallScore,
      },
    };

    console.log(`Audit complete! Overall score: ${overallScore}/100`);

    return res.status(200).json({
      success: true,
      data: auditReport,
    });

  } catch (error) {
    console.error('Scan error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
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
