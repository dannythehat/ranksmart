/**
 * Mode 2: Self-Audit Endpoint
 * Analyzes your own content and provides actionable fixes
 * Powered by ChatGPT-5 Brain
 */

import { seoAnalysisBrain, getUsageStats } from '../utils/ai-brain.js';

export default async function handler(req, res) {
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
    const { url, content, serpData } = req.body;

    // Validate inputs
    if (!url || !content) {
      return res.status(400).json({ 
        error: 'URL and content are required',
        message: 'Please provide both URL and content to analyze' 
      });
    }

    console.log(`[MODE 2 - SELF-AUDIT] Analyzing: ${url}`);
    console.log(`[MODE 2] Content length: ${content.length} chars`);

    // Prepare page data
    const pageData = {
      url,
      content,
      title: extractTitle(content),
      metaDescription: extractMetaDescription(content),
      wordCount: content.split(/\s+/).length
    };

    // Calculate current score
    const currentScore = calculateCurrentScore(pageData);

    console.log(`[MODE 2] Current SEO Score: ${currentScore}/100`);
    console.log('[MODE 2] 🧠 Activating ChatGPT-5 Brain for deep self-audit...');

    // Prepare competitor data from SERP
    const competitorData = serpData ? {
      competitors: serpData.competitors || [],
      commonKeywords: serpData.commonKeywords || [],
      averageMetrics: {
        wordCount: serpData.competitors ? 
          Math.round(serpData.competitors.reduce((sum, c) => sum + (c.wordCount || 0), 0) / serpData.competitors.length) : 0,
        headings: serpData.competitors ?
          Math.round(serpData.competitors.reduce((sum, c) => sum + (c.headings || 0), 0) / serpData.competitors.length) : 0
      }
    } : null;

    // Analyze with ChatGPT-5 Brain
    const aiResponse = await seoAnalysisBrain({
      url: pageData.url,
      content: pageData.content,
      competitorData: competitorData,
      currentScore: currentScore
    });

    const analysis = aiResponse.content;
    const aiModel = aiResponse.model;
    const aiUsage = aiResponse.usage;

    console.log(`[MODE 2] ✅ Self-audit complete by ${aiModel}`);
    console.log(`[MODE 2] 📊 Current: ${currentScore}/100 → Potential: ${analysis.estimatedScoreAfterFixes || currentScore + 15}/100`);
    console.log(`[MODE 2] 🔧 Found ${analysis.criticalIssues?.length || 0} issues to fix`);

    // Categorize fixes by priority
    const fixes = categorizeFixes(analysis);

    const executionTime = Date.now() - startTime;
    const usageStats = getUsageStats();

    const response = {
      success: true,
      data: {
        url,
        
        // Current state
        current: {
          score: currentScore,
          wordCount: pageData.wordCount,
          title: pageData.title,
          metaDescription: pageData.metaDescription,
        },

        // Analysis results
        analysis: {
          overallScore: analysis.overallScore,
          scoreBreakdown: analysis.scoreBreakdown,
          estimatedScoreAfterFixes: analysis.estimatedScoreAfterFixes || currentScore + 15,
          potentialIncrease: (analysis.estimatedScoreAfterFixes || currentScore + 15) - currentScore,
        },

        // Categorized fixes
        fixes: {
          high: fixes.high,
          medium: fixes.medium,
          low: fixes.low,
          quickWins: analysis.quickWins || [],
        },

        // Missing keywords
        missingKeywords: analysis.missingKeywords || [],

        // Structural improvements
        structuralImprovements: analysis.structuralImprovements || [],

        // Competitor comparison (if available)
        competitorComparison: competitorData ? {
          yourWordCount: pageData.wordCount,
          avgCompetitorWordCount: competitorData.averageMetrics.wordCount,
          wordCountGap: pageData.wordCount - competitorData.averageMetrics.wordCount,
          competitorsAnalyzed: competitorData.competitors.length,
        } : null,

        // Summary
        summary: {
          totalIssues: (analysis.criticalIssues || []).length,
          highPriorityIssues: fixes.high.length,
          estimatedTimeToFix: estimateFixTime(fixes),
          topRecommendation: fixes.high[0]?.title || 'No critical issues found',
        }
      },

      // AI Brain metadata
      ai: {
        model: aiModel,
        tokensUsed: aiUsage,
        totalCost: usageStats.totalCost,
      },

      // Metadata
      analyzedAt: new Date().toISOString(),
      executionTime: `${(executionTime / 1000).toFixed(2)}s`,
    };

    console.log(`[MODE 2] 🎉 COMPLETE in ${(executionTime / 1000).toFixed(2)}s`);
    console.log(`[MODE 2] 💰 Cost: $${usageStats.totalCost.toFixed(4)}`);

    return res.status(200).json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[MODE 2] ❌ FAILED: ${error.message} (${executionTime}ms)`);
    console.error('Stack trace:', error.stack);
    
    return res.status(500).json({ 
      error: 'Self-audit failed',
      message: error.message || 'An unexpected error occurred',
      details: 'The AI brain encountered an error during self-audit. Please try again.',
      executionTime: `${(executionTime / 1000).toFixed(2)}s`,
    });
  }
}

/**
 * Extract title from content
 */
function extractTitle(content) {
  // Try to find H1 or title tag
  const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match) return h1Match[1].replace(/<[^>]*>/g, '');

  const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) return titleMatch[1].replace(/<[^>]*>/g, '');

  // Try markdown H1
  const mdH1Match = content.match(/^#\s+(.+)$/m);
  if (mdH1Match) return mdH1Match[1];

  return 'Untitled';
}

/**
 * Extract meta description from content
 */
function extractMetaDescription(content) {
  const metaMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  if (metaMatch) return metaMatch[1];

  return '';
}

/**
 * Calculate current SEO score
 */
function calculateCurrentScore(pageData) {
  let score = 50; // Base score

  // Title optimization (max +10)
  if (pageData.title && pageData.title !== 'Untitled') {
    const titleLength = pageData.title.length;
    if (titleLength >= 50 && titleLength <= 70) {
      score += 10;
    } else if (titleLength >= 40 && titleLength <= 80) {
      score += 5;
    }
  }

  // Meta description (max +10)
  if (pageData.metaDescription) {
    const metaLength = pageData.metaDescription.length;
    if (metaLength >= 140 && metaLength <= 160) {
      score += 10;
    } else if (metaLength >= 120 && metaLength <= 170) {
      score += 5;
    }
  }

  // Word count (max +15)
  if (pageData.wordCount >= 1500) {
    score += 15;
  } else if (pageData.wordCount >= 1000) {
    score += 10;
  } else if (pageData.wordCount >= 500) {
    score += 5;
  }

  // Heading structure (max +10)
  const h1Count = (pageData.content.match(/<h1/gi) || []).length;
  const h2Count = (pageData.content.match(/<h2/gi) || []).length;
  
  if (h1Count === 1 && h2Count >= 3) {
    score += 10;
  } else if (h1Count === 1 && h2Count >= 1) {
    score += 5;
  }

  // Images (max +5)
  const imgCount = (pageData.content.match(/<img/gi) || []).length;
  if (imgCount >= 3) {
    score += 5;
  } else if (imgCount >= 1) {
    score += 3;
  }

  return Math.min(score, 100);
}

/**
 * Categorize fixes by priority
 */
function categorizeFixes(analysis) {
  const criticalIssues = analysis.criticalIssues || [];

  return {
    high: criticalIssues.filter(issue => issue.impact === 'high'),
    medium: criticalIssues.filter(issue => issue.impact === 'medium'),
    low: criticalIssues.filter(issue => issue.impact === 'low'),
  };
}

/**
 * Estimate time to fix all issues
 */
function estimateFixTime(fixes) {
  const highTime = fixes.high.length * 10; // 10 min per high priority
  const mediumTime = fixes.medium.length * 5; // 5 min per medium
  const lowTime = fixes.low.length * 2; // 2 min per low

  const totalMinutes = highTime + mediumTime + lowTime;

  if (totalMinutes < 60) {
    return `${totalMinutes} minutes`;
  } else {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
  }
}
