/**
 * SEO Analysis Endpoint
 * Powered by ChatGPT-5 Brain - Surgical precision SEO audits
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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const { pageData, competitorData } = req.body;

    if (!pageData || !pageData.content) {
      return res.status(400).json({ 
        error: 'Page data with content is required' 
      });
    }

    console.log(`[SEO ANALYSIS] Analyzing: ${pageData.url}`);
    console.log(`[SEO ANALYSIS] Content length: ${pageData.content.length} chars`);

    // Calculate current score (basic estimation)
    const currentScore = estimateCurrentScore(pageData);

    console.log('[SEO ANALYSIS] 🧠 Activating ChatGPT-5 Brain for deep analysis...');

    // Analyze with ChatGPT-5 Brain
    const aiResponse = await seoAnalysisBrain({
      url: pageData.url,
      content: pageData.content,
      competitorData: competitorData || {},
      currentScore: currentScore
    });

    const analysis = aiResponse.content;
    const aiModel = aiResponse.model;
    const aiUsage = aiResponse.usage;

    console.log(`[SEO ANALYSIS] ✅ Analysis complete by ${aiModel}`);
    console.log(`[SEO ANALYSIS] 📊 Score: ${analysis.overallScore}/100`);
    console.log(`[SEO ANALYSIS] 🔧 Found ${analysis.criticalIssues?.length || 0} critical issues`);

    const executionTime = Date.now() - startTime;
    const usageStats = getUsageStats();

    const response = {
      success: true,
      analysis: {
        // Overall metrics
        overallScore: analysis.overallScore,
        currentScore: currentScore,
        potentialScore: analysis.estimatedScoreAfterFixes || analysis.overallScore + 15,
        
        // Detailed breakdown
        scoreBreakdown: analysis.scoreBreakdown || {
          eeat: 0,
          keywords: 0,
          structure: 0,
          technical: 0,
          userIntent: 0
        },

        // Critical issues (high priority)
        criticalIssues: analysis.criticalIssues || [],
        
        // Missing keywords
        missingKeywords: analysis.missingKeywords || [],
        
        // Structural improvements
        structuralImprovements: analysis.structuralImprovements || [],
        
        // Quick wins (easy, high-impact fixes)
        quickWins: analysis.quickWins || [],

        // Improvement potential
        improvement: {
          estimatedScoreIncrease: (analysis.estimatedScoreAfterFixes || currentScore + 15) - currentScore,
          highImpactFixes: (analysis.criticalIssues || []).filter(i => i.impact === 'high').length,
          mediumImpactFixes: (analysis.criticalIssues || []).filter(i => i.impact === 'medium').length,
          lowImpactFixes: (analysis.criticalIssues || []).filter(i => i.impact === 'low').length,
        }
      },

      // AI Brain metadata
      ai: {
        model: aiModel,
        tokensUsed: aiUsage,
        totalCost: usageStats.totalCost,
        averageCostPerRequest: usageStats.averageCostPerRequest,
      },

      // Metadata
      analyzedAt: new Date().toISOString(),
      executionTime: `${(executionTime / 1000).toFixed(2)}s`,
    };

    console.log(`[SEO ANALYSIS] 🎉 COMPLETE in ${(executionTime / 1000).toFixed(2)}s`);
    console.log(`[SEO ANALYSIS] 💰 Cost: $${usageStats.totalCost.toFixed(4)}`);

    return res.status(200).json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[SEO ANALYSIS] ❌ FAILED: ${error.message} (${executionTime}ms)`);
    console.error('Stack trace:', error.stack);
    
    return res.status(500).json({ 
      error: 'SEO analysis failed',
      message: error.message || 'An unexpected error occurred',
      details: 'The AI brain encountered an error during analysis. Please try again.',
      executionTime: `${(executionTime / 1000).toFixed(2)}s`,
    });
  }
}

/**
 * Estimate current SEO score based on basic metrics
 */
function estimateCurrentScore(pageData) {
  let score = 50; // Base score

  // Title optimization (max +10)
  if (pageData.title) {
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
  const wordCount = pageData.wordCount || pageData.content.split(/\s+/).length;
  if (wordCount >= 1500) {
    score += 15;
  } else if (wordCount >= 1000) {
    score += 10;
  } else if (wordCount >= 500) {
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
