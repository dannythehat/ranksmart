/**
 * Mode 2: Apply Fixes Endpoint
 * Applies SEO fixes with surgical precision
 * Powered by ChatGPT-5 Content Surgery Brain
 */

import { contentSurgeryBrain, getUsageStats } from '../utils/ai-brain.js';

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
    const { originalContent, fixes, preserveVoice = true, selectedFixes = null } = req.body;

    // Validate inputs
    if (!originalContent) {
      return res.status(400).json({ 
        error: 'Original content is required',
        message: 'Please provide the content to improve' 
      });
    }

    if (!fixes || (Array.isArray(fixes) && fixes.length === 0)) {
      return res.status(400).json({ 
        error: 'Fixes are required',
        message: 'Please provide fixes to apply' 
      });
    }

    console.log(`[MODE 2 - APPLY FIXES] Starting content surgery...`);
    console.log(`[MODE 2] Original content: ${originalContent.length} chars`);
    console.log(`[MODE 2] Fixes to apply: ${Array.isArray(fixes) ? fixes.length : 'all'}`);

    // Filter fixes if specific ones are selected
    let fixesToApply = fixes;
    if (selectedFixes && Array.isArray(selectedFixes)) {
      fixesToApply = fixes.filter((fix, index) => selectedFixes.includes(index));
      console.log(`[MODE 2] Applying ${fixesToApply.length} selected fixes`);
    }

    console.log('[MODE 2] 🧠 Activating ChatGPT-5 Content Surgery Brain...');

    // Apply fixes using ChatGPT-5 Brain
    const aiResponse = await contentSurgeryBrain({
      originalContent,
      fixes: fixesToApply,
      preserveVoice
    });

    const result = aiResponse.content;
    const aiModel = aiResponse.model;
    const aiUsage = aiResponse.usage;

    console.log(`[MODE 2] ✅ Content surgery complete by ${aiModel}`);
    console.log(`[MODE 2] 📊 Changes made: ${result.changesMade?.length || 0}`);

    // Calculate improvements
    const originalWordCount = originalContent.split(/\s+/).length;
    const improvedWordCount = result.improvedContent.split(/\s+/).length;
    const wordCountChange = improvedWordCount - originalWordCount;

    // Generate diff preview
    const diffPreview = generateDiffPreview(originalContent, result.improvedContent);

    const executionTime = Date.now() - startTime;
    const usageStats = getUsageStats();

    const response = {
      success: true,
      data: {
        // Improved content
        improvedContent: result.improvedContent,

        // Changes made
        changes: result.changesMade || [],

        // Metrics comparison
        metrics: {
          original: {
            wordCount: originalWordCount,
            estimatedScore: calculateScore(originalContent),
          },
          improved: {
            wordCount: improvedWordCount,
            estimatedScore: calculateScore(result.improvedContent),
          },
          improvements: {
            wordCountChange: wordCountChange,
            wordCountChangePercent: ((wordCountChange / originalWordCount) * 100).toFixed(1),
            scoreIncrease: result.metricsImprovement?.estimatedScoreIncrease || 0,
            keywordsAdded: result.metricsImprovement?.keywordsAdded || 0,
            headingsImproved: result.metricsImprovement?.headingsImproved || 0,
          }
        },

        // Diff preview (for UI display)
        diffPreview: diffPreview,

        // Export options
        exports: {
          html: convertToHTML(result.improvedContent),
          markdown: result.improvedContent,
          diff: generateFullDiff(originalContent, result.improvedContent),
        },

        // Summary
        summary: {
          changesApplied: result.changesMade?.length || 0,
          estimatedScoreIncrease: result.metricsImprovement?.estimatedScoreIncrease || 0,
          preservedVoice: preserveVoice,
          topChange: result.changesMade?.[0]?.reasoning || 'Content improved',
        }
      },

      // AI Brain metadata
      ai: {
        model: aiModel,
        tokensUsed: aiUsage,
        totalCost: usageStats.totalCost,
      },

      // Metadata
      appliedAt: new Date().toISOString(),
      executionTime: `${(executionTime / 1000).toFixed(2)}s`,
    };

    console.log(`[MODE 2] 🎉 COMPLETE in ${(executionTime / 1000).toFixed(2)}s`);
    console.log(`[MODE 2] 📈 Score increase: +${result.metricsImprovement?.estimatedScoreIncrease || 0}`);
    console.log(`[MODE 2] 💰 Cost: $${usageStats.totalCost.toFixed(4)}`);

    return res.status(200).json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[MODE 2] ❌ FAILED: ${error.message} (${executionTime}ms)`);
    console.error('Stack trace:', error.stack);
    
    return res.status(500).json({ 
      error: 'Fix application failed',
      message: error.message || 'An unexpected error occurred',
      details: 'The AI brain encountered an error during content surgery. Please try again.',
      executionTime: `${(executionTime / 1000).toFixed(2)}s`,
    });
  }
}

/**
 * Calculate basic SEO score
 */
function calculateScore(content) {
  let score = 50;

  const wordCount = content.split(/\s+/).length;
  if (wordCount >= 1500) score += 15;
  else if (wordCount >= 1000) score += 10;
  else if (wordCount >= 500) score += 5;

  const h2Count = (content.match(/^##\s+/gm) || []).length;
  if (h2Count >= 5) score += 10;
  else if (h2Count >= 3) score += 7;
  else if (h2Count >= 1) score += 4;

  const h3Count = (content.match(/^###\s+/gm) || []).length;
  if (h3Count >= 3) score += 5;

  return Math.min(score, 100);
}

/**
 * Generate diff preview (first 5 changes)
 */
function generateDiffPreview(original, improved) {
  const originalLines = original.split('\n');
  const improvedLines = improved.split('\n');

  const changes = [];
  const maxChanges = 5;

  for (let i = 0; i < Math.min(originalLines.length, improvedLines.length) && changes.length < maxChanges; i++) {
    if (originalLines[i] !== improvedLines[i]) {
      changes.push({
        lineNumber: i + 1,
        before: originalLines[i].substring(0, 100),
        after: improvedLines[i].substring(0, 100),
      });
    }
  }

  return changes;
}

/**
 * Generate full diff
 */
function generateFullDiff(original, improved) {
  const originalLines = original.split('\n');
  const improvedLines = improved.split('\n');

  let diff = '';

  for (let i = 0; i < Math.max(originalLines.length, improvedLines.length); i++) {
    const origLine = originalLines[i] || '';
    const impLine = improvedLines[i] || '';

    if (origLine !== impLine) {
      if (origLine) diff += `- ${origLine}\n`;
      if (impLine) diff += `+ ${impLine}\n`;
    } else {
      diff += `  ${origLine}\n`;
    }
  }

  return diff;
}

/**
 * Convert markdown to HTML
 */
function convertToHTML(markdown) {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Improved Content</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 { font-size: 2.5em; margin-bottom: 0.5em; }
    h2 { font-size: 1.8em; margin-top: 1.5em; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
    h3 { font-size: 1.4em; margin-top: 1.2em; }
    p { margin: 1em 0; }
    strong { font-weight: 600; }
    em { font-style: italic; }
    ul, ol { margin: 1em 0; padding-left: 2em; }
    li { margin: 0.5em 0; }
  </style>
</head>
<body>
  <article>
`;

  // Convert markdown to HTML (basic conversion)
  let bodyHtml = markdown
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  html += `    ${bodyHtml}
  </article>
</body>
</html>`;

  return html;
}
