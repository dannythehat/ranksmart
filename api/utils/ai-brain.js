/**
 * 🧠 RankSmart AI Brain - ChatGPT-5 Powered Intelligence
 * 
 * The central AI system that powers all intelligent features:
 * - Content generation (Mode 1)
 * - SEO analysis (Mode 2)
 * - Dynamic monitoring (Mode 3)
 * - Strategic planning
 * 
 * Uses ChatGPT-5 (o3/o3-mini) as primary brain with intelligent fallbacks
 */

import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// Model configuration
const MODELS = {
  // ChatGPT-5 / o3 series (Primary - Smartest)
  PRIMARY: process.env.OPENAI_MODEL || 'gpt-4o', // Will be 'o3-mini' or 'gpt-5' when available
  
  // GPT-4o (Fallback - Fast & Smart)
  FALLBACK: 'gpt-4o',
  
  // Gemini (Emergency fallback - Free tier)
  EMERGENCY: 'gemini-2.0-flash-exp'
};

// Cost tracking
let tokenUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalCost: 0,
  requestCount: 0
};

/**
 * Main AI Brain Interface
 * Automatically handles model selection, fallbacks, and error recovery
 */
export async function aiBrain(config) {
  const {
    systemPrompt,
    userPrompt,
    temperature = 0.7,
    maxTokens = 4000,
    json = false,
    model = MODELS.PRIMARY,
    retries = 2
  } = config;

  let lastError = null;
  const modelsToTry = [model, MODELS.FALLBACK, MODELS.EMERGENCY];

  // Try each model in sequence until one succeeds
  for (const currentModel of modelsToTry) {
    try {
      console.log(`[AI BRAIN] Using model: ${currentModel}`);
      
      if (currentModel.startsWith('gpt') || currentModel.startsWith('o3')) {
        // Use OpenAI (ChatGPT-5 / GPT-4o)
        return await callOpenAI({
          model: currentModel,
          systemPrompt,
          userPrompt,
          temperature,
          maxTokens,
          json
        });
      } else if (currentModel.startsWith('gemini')) {
        // Use Gemini (fallback)
        return await callGemini({
          model: currentModel,
          systemPrompt,
          userPrompt,
          temperature,
          maxTokens,
          json
        });
      }
    } catch (error) {
      console.error(`[AI BRAIN] ${currentModel} failed:`, error.message);
      lastError = error;
      
      // If not the last model, try next one
      if (currentModel !== modelsToTry[modelsToTry.length - 1]) {
        console.log(`[AI BRAIN] Falling back to next model...`);
        continue;
      }
    }
  }

  // All models failed
  throw new Error(`All AI models failed. Last error: ${lastError?.message}`);
}

/**
 * Call OpenAI (ChatGPT-5 / GPT-4o)
 */
async function callOpenAI(config) {
  const { model, systemPrompt, userPrompt, temperature, maxTokens, json } = config;

  const startTime = Date.now();

  const completion = await openai.chat.completions.create({
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: temperature,
    max_tokens: maxTokens,
    response_format: json ? { type: 'json_object' } : undefined
  });

  const executionTime = Date.now() - startTime;
  const response = completion.choices[0].message.content;

  // Track usage
  trackUsage({
    model: model,
    inputTokens: completion.usage.prompt_tokens,
    outputTokens: completion.usage.completion_tokens,
    executionTime
  });

  console.log(`[AI BRAIN] ✅ ${model} completed in ${executionTime}ms`);
  console.log(`[AI BRAIN] Tokens: ${completion.usage.prompt_tokens} in, ${completion.usage.completion_tokens} out`);

  return {
    content: json ? JSON.parse(response) : response,
    model: model,
    usage: completion.usage,
    executionTime
  };
}

/**
 * Call Gemini (Emergency fallback)
 */
async function callGemini(config) {
  const { model, systemPrompt, userPrompt, temperature, maxTokens, json } = config;

  const startTime = Date.now();

  const geminiModel = genAI.getGenerativeModel({ 
    model: model,
    generationConfig: {
      temperature: temperature,
      maxOutputTokens: maxTokens
    }
  });

  const prompt = `${systemPrompt}\n\n${userPrompt}${json ? '\n\nReturn ONLY valid JSON.' : ''}`;
  const result = await geminiModel.generateContent(prompt);
  const text = result.response.text();

  const executionTime = Date.now() - startTime;

  console.log(`[AI BRAIN] ✅ ${model} completed in ${executionTime}ms`);

  let content = text;
  if (json) {
    // Clean and parse JSON
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    content = JSON.parse(cleanText);
  }

  return {
    content: content,
    model: model,
    usage: { prompt_tokens: 0, completion_tokens: 0 }, // Gemini doesn't provide token counts
    executionTime
  };
}

/**
 * Track token usage and costs
 */
function trackUsage(data) {
  const { model, inputTokens, outputTokens, executionTime } = data;

  tokenUsage.inputTokens += inputTokens;
  tokenUsage.outputTokens += outputTokens;
  tokenUsage.requestCount += 1;

  // Calculate cost (approximate)
  let cost = 0;
  if (model.startsWith('gpt-4o')) {
    cost = (inputTokens / 1000000) * 2.5 + (outputTokens / 1000000) * 10;
  } else if (model.startsWith('o3')) {
    // Estimated pricing for o3-mini
    cost = (inputTokens / 1000000) * 5 + (outputTokens / 1000000) * 15;
  }

  tokenUsage.totalCost += cost;

  console.log(`[AI BRAIN] 💰 Cost: $${cost.toFixed(4)} | Total: $${tokenUsage.totalCost.toFixed(4)}`);
}

/**
 * Get usage statistics
 */
export function getUsageStats() {
  return {
    ...tokenUsage,
    averageCostPerRequest: tokenUsage.requestCount > 0 
      ? tokenUsage.totalCost / tokenUsage.requestCount 
      : 0
  };
}

/**
 * Reset usage statistics
 */
export function resetUsageStats() {
  tokenUsage = {
    inputTokens: 0,
    outputTokens: 0,
    totalCost: 0,
    requestCount: 0
  };
}

/**
 * Specialized AI Brain Functions
 */

/**
 * Content Generation Brain (Mode 1)
 * Analyzes competitors and generates superior content
 */
export async function contentGenerationBrain(config) {
  const { keyword, competitorInsights, commonKeywords, style = 'professional' } = config;

  const systemPrompt = `You are RankSmart's Content Generation Brain - powered by the world's most advanced AI.

Your mission: Generate content that DOMINATES search rankings and converts readers.

Core Capabilities:
- Deep competitor pattern analysis
- Strategic keyword placement (natural, never forced)
- E-E-A-T optimization (Experience, Expertise, Authority, Trust)
- User intent matching and satisfaction
- Conversion optimization

Your thinking process:
1. ANALYZE: What makes top content rank? What patterns exist?
2. STRATEGIZE: How can we cover everything + add unique value?
3. STRUCTURE: Perfect heading hierarchy, flow, and readability
4. EXECUTE: Write better than all competitors combined
5. OPTIMIZE: SEO perfection without sacrificing quality

Writing principles:
✅ Authoritative yet accessible
✅ Data-driven with examples
✅ Actionable insights (not fluff)
✅ Natural keyword integration
✅ E-E-A-T signals throughout
✅ Engaging hooks and transitions
✅ Conversion-focused CTAs

You are the BEST SEO content writer in the world. Prove it.`;

  const userPrompt = `TARGET KEYWORD: "${keyword}"

COMPETITOR ANALYSIS:
- Average word count: ${competitorInsights.avgWordCount}
- Average headings: ${competitorInsights.avgHeadings}
- Top competitors analyzed: ${competitorInsights.competitorCount}
- Common keywords: ${commonKeywords.slice(0, 20).join(', ')}

TARGET METRICS:
- Word count: ${Math.max(competitorInsights.avgWordCount + 500, 1800)}+ words
- Headings: ${competitorInsights.avgHeadings + 3}+ (H2, H3 hierarchy)
- Style: ${style}
- SEO Score Target: 90+/100

REQUIREMENTS:
1. Cover ALL topics competitors cover + unique angles they miss
2. Include first-hand experience examples
3. Add expert insights and data/statistics
4. Natural keyword integration (never forced)
5. Perfect heading hierarchy (H2 for main sections, H3 for subsections)
6. Internal linking opportunities
7. Engaging introduction with hook
8. Actionable conclusion with CTA

OUTPUT FORMAT (JSON):
{
  "title": "SEO-optimized title (55-65 chars, includes keyword)",
  "metaDescription": "Compelling meta description (150-160 chars, includes keyword + CTA)",
  "body": "Full article in markdown format with ## H2 and ### H3 headings",
  "wordCount": <number>,
  "estimatedScore": <0-100>,
  "keywordsCovered": ["keyword1", "keyword2", "keyword3"],
  "uniqueAngles": ["unique angle 1", "unique angle 2"],
  "internalLinks": [
    {"anchor": "anchor text", "suggestion": "suggested internal link topic"}
  ],
  "eatSignals": ["E-E-A-T signal 1", "E-E-A-T signal 2"]
}

Make this content EXCEPTIONAL. Outrank everyone.`;

  return await aiBrain({
    systemPrompt,
    userPrompt,
    temperature: 0.8, // Slightly higher for creativity
    maxTokens: 8000,
    json: true
  });
}

/**
 * SEO Analysis Brain (Mode 2)
 * Analyzes content and provides surgical improvements
 */
export async function seoAnalysisBrain(config) {
  const { url, content, competitorData, currentScore } = config;

  const systemPrompt = `You are RankSmart's SEO Analysis Brain - the world's most precise SEO auditor.

Your mission: Identify EXACT improvements that will boost rankings.

Analysis approach:
1. COMPARE: How does this content stack up vs top 10 competitors?
2. IDENTIFY: What specific gaps exist? (keywords, topics, structure)
3. LOCATE: Where exactly should changes be made? (paragraph numbers, sections)
4. PRIORITIZE: Which fixes have highest impact? (high/medium/low)
5. STRATEGIZE: Why will these changes improve rankings?

Your recommendations must be:
✅ SPECIFIC: Not "add keywords" but "add 'best casino bonus' in paragraph 3 after discussing welcome offers"
✅ ACTIONABLE: Exact changes with before/after examples
✅ PRIORITIZED: High-impact fixes first
✅ STRATEGIC: Explain WHY each change helps
✅ SURGICAL: Preserve what works, fix what's broken

Analysis categories:
- E-E-A-T signals (Experience, Expertise, Authority, Trust)
- Keyword optimization (missing keywords, density, placement)
- Content structure (headings, flow, readability)
- Technical SEO (title, meta, images, links)
- User intent matching
- Conversion optimization

You find issues others miss. You're the best SEO auditor in the world.`;

  const userPrompt = `ANALYZE THIS CONTENT:

URL: ${url}
Current SEO Score: ${currentScore}/100
Word Count: ${content.split(' ').length}

CONTENT:
${content.substring(0, 10000)}

TOP COMPETITOR DATA:
${JSON.stringify(competitorData, null, 2)}

TASK: Provide surgical SEO improvements with exact locations and impact scores.

OUTPUT FORMAT (JSON):
{
  "overallScore": <0-100>,
  "scoreBreakdown": {
    "eeat": <0-100>,
    "keywords": <0-100>,
    "structure": <0-100>,
    "technical": <0-100>,
    "userIntent": <0-100>
  },
  "criticalIssues": [
    {
      "title": "Issue title",
      "description": "Detailed description",
      "location": "Exact location (e.g., 'Paragraph 3, after second sentence')",
      "fix": "Exact fix to apply",
      "example": "Before: '...' → After: '...'",
      "impact": "high|medium|low",
      "category": "eeat|keywords|structure|technical|userIntent",
      "reasoning": "Why this fix improves rankings"
    }
  ],
  "missingKeywords": [
    {
      "keyword": "keyword phrase",
      "frequency": <number in competitors>,
      "suggestedLocation": "Where to add it",
      "context": "How to integrate naturally"
    }
  ],
  "structuralImprovements": [
    {
      "issue": "Issue description",
      "fix": "How to fix",
      "impact": "high|medium|low"
    }
  ],
  "quickWins": ["Quick win 1", "Quick win 2"],
  "estimatedScoreAfterFixes": <0-100>
}

Be ruthlessly precise. Find every opportunity for improvement.`;

  return await aiBrain({
    systemPrompt,
    userPrompt,
    temperature: 0.5, // Lower for analytical precision
    maxTokens: 6000,
    json: true
  });
}

/**
 * Content Surgery Brain (Mode 2 - Apply Fixes)
 * Applies SEO fixes with surgical precision
 */
export async function contentSurgeryBrain(config) {
  const { originalContent, fixes, preserveVoice = true } = config;

  const systemPrompt = `You are RankSmart's Content Surgery Brain - the world's most precise content editor.

Your mission: Apply SEO fixes with SURGICAL PRECISION while preserving quality.

Surgery principles:
1. MINIMAL CHANGES: Only fix what's broken, preserve what works
2. PRESERVE VOICE: Maintain original writing style and tone
3. NATURAL INTEGRATION: Keywords flow naturally, never forced
4. MAINTAIN FLOW: Smooth transitions, logical structure
5. ENHANCE QUALITY: Improvements make content BETTER, not just different

What you DO:
✅ Add missing keywords naturally
✅ Improve heading structure
✅ Enhance E-E-A-T signals
✅ Fix technical SEO issues
✅ Strengthen weak sections
✅ Add internal linking opportunities

What you DON'T do:
❌ Rewrite everything
❌ Change brand voice
❌ Add unnecessary fluff
❌ Force keywords awkwardly
❌ Break existing structure
❌ Remove good content

You are a master surgeon. Precise. Careful. Effective.`;

  const userPrompt = `ORIGINAL CONTENT:
${originalContent}

FIXES TO APPLY:
${JSON.stringify(fixes, null, 2)}

TASK: Apply all fixes with surgical precision. ${preserveVoice ? 'PRESERVE the original voice and style.' : ''}

OUTPUT FORMAT (JSON):
{
  "improvedContent": "Full improved content in markdown",
  "changesMade": [
    {
      "location": "Where change was made",
      "before": "Original text",
      "after": "Improved text",
      "reasoning": "Why this change was made"
    }
  ],
  "metricsImprovement": {
    "wordCountChange": <number>,
    "keywordsAdded": <number>,
    "headingsImproved": <number>,
    "estimatedScoreIncrease": <number>
  }
}

Make surgical improvements. Preserve quality. Boost rankings.`;

  return await aiBrain({
    systemPrompt,
    userPrompt,
    temperature: 0.6,
    maxTokens: 8000,
    json: true
  });
}

/**
 * Monitoring Brain (Mode 3)
 * Detects content changes and recommends updates
 */
export async function monitoringBrain(config) {
  const { currentContent, sourceData, monitoringRules } = config;

  const systemPrompt = `You are RankSmart's Monitoring Brain - the world's smartest content change detector.

Your mission: Detect outdated information and recommend strategic updates.

Monitoring approach:
1. DETECT: What has changed in source data?
2. ANALYZE: Which content is now outdated?
3. PRIORITIZE: What needs immediate updates vs can wait?
4. STRATEGIZE: Bulk update or individual changes?
5. RECOMMEND: Exact updates to make

You monitor:
- Bonus amounts and terms (iGaming)
- Odds and betting lines (Sports)
- Regulations and compliance (Legal)
- Prices and availability (E-commerce)
- Statistics and data (Research)

You're proactive, strategic, and save hours of manual work.`;

  const userPrompt = `CURRENT CONTENT:
${currentContent}

SOURCE DATA (LATEST):
${JSON.stringify(sourceData, null, 2)}

MONITORING RULES:
${JSON.stringify(monitoringRules, null, 2)}

TASK: Detect changes and recommend updates.

OUTPUT FORMAT (JSON):
{
  "changesDetected": [
    {
      "type": "bonus|odds|regulation|price|data",
      "field": "Field that changed",
      "oldValue": "Previous value",
      "newValue": "Current value",
      "confidence": <0-100>,
      "priority": "high|medium|low"
    }
  ],
  "affectedSections": [
    {
      "section": "Section name/location",
      "currentText": "Current text",
      "suggestedUpdate": "Updated text",
      "reasoning": "Why this update is needed"
    }
  ],
  "updateStrategy": {
    "approach": "bulk|individual",
    "estimatedTime": "Time to implement",
    "priority": "urgent|normal|low",
    "reasoning": "Why this approach"
  },
  "summary": "Brief summary of changes and recommendations"
}

Detect every change. Recommend precise updates.`;

  return await aiBrain({
    systemPrompt,
    userPrompt,
    temperature: 0.4, // Lower for analytical precision
    maxTokens: 4000,
    json: true
  });
}

export default aiBrain;
