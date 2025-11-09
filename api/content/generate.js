/**
 * Mode 1: Competitor Content Generator
 * Analyzes competitors and generates better, unique content
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

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
    const { keyword, serpData, targetUrl, style = 'professional' } = req.body;

    // Validate inputs
    if (!keyword) {
      return res.status(400).json({ 
        error: 'Keyword is required',
        message: 'Please provide a target keyword' 
      });
    }

    if (!serpData || !serpData.competitors || serpData.competitors.length === 0) {
      return res.status(400).json({ 
        error: 'SERP data is required',
        message: 'Please provide competitor analysis data' 
      });
    }

    console.log(`[CONTENT GENERATION START] Keyword: ${keyword}`);

    // Extract competitor insights
    const competitorInsights = extractCompetitorInsights(serpData);
    
    // Generate content using Gemini
    console.log('[STEP 1/3] Generating content with AI...');
    const generatedContent = await generateContentFromCompetitors(
      keyword,
      competitorInsights,
      serpData.commonKeywords || [],
      style
    );

    console.log('[STEP 2/3] Optimizing content structure...');
    const optimizedContent = optimizeContentStructure(generatedContent, serpData);

    console.log('[STEP 3/3] Generating image suggestions...');
    const imageSuggestions = generateImageSuggestions(generatedContent, keyword);

    const executionTime = Date.now() - startTime;

    const response = {
      success: true,
      data: {
        keyword,
        targetUrl: targetUrl || null,
        
        // Generated content
        content: {
          title: optimizedContent.title,
          metaDescription: optimizedContent.metaDescription,
          body: optimizedContent.body,
          wordCount: optimizedContent.wordCount,
          readingTime: Math.ceil(optimizedContent.wordCount / 200),
        },

        // SEO metrics
        seo: {
          estimatedScore: optimizedContent.estimatedScore,
          keywordDensity: calculateKeywordDensity(optimizedContent.body, keyword),
          headingCount: countHeadings(optimizedContent.body),
          internalLinkSuggestions: optimizedContent.internalLinks || [],
        },

        // Improvements over competitors
        improvements: {
          averageCompetitorWordCount: competitorInsights.avgWordCount,
          yourWordCount: optimizedContent.wordCount,
          wordCountDifference: optimizedContent.wordCount - competitorInsights.avgWordCount,
          keywordsCovered: optimizedContent.keywordsCovered || [],
          uniqueAngles: optimizedContent.uniqueAngles || [],
        },

        // Image suggestions
        images: imageSuggestions,

        // Export options
        exports: {
          html: convertToHTML(optimizedContent),
          markdown: optimizedContent.body,
          wordpress: generateWordPressExport(optimizedContent),
        },

        // Metadata
        generatedAt: new Date().toISOString(),
        executionTime: `${(executionTime / 1000).toFixed(2)}s`,
      }
    };

    console.log(`[CONTENT GENERATION COMPLETE] ${optimizedContent.wordCount} words (${executionTime}ms)`);

    return res.status(200).json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[CONTENT GENERATION FAILED] ${error.message} (${executionTime}ms)`);
    console.error('Stack trace:', error.stack);
    
    return res.status(500).json({ 
      error: 'Content generation failed',
      message: error.message || 'An unexpected error occurred',
      details: 'Please try again or contact support if the issue persists',
      executionTime: `${(executionTime / 1000).toFixed(2)}s`,
    });
  }
}

/**
 * Extract insights from competitor data
 */
function extractCompetitorInsights(serpData) {
  const competitors = serpData.competitors || [];
  
  const totalWordCount = competitors.reduce((sum, c) => sum + (c.wordCount || 0), 0);
  const avgWordCount = Math.round(totalWordCount / competitors.length);
  
  const totalHeadings = competitors.reduce((sum, c) => sum + (c.headings || 0), 0);
  const avgHeadings = Math.round(totalHeadings / competitors.length);

  const allKeywords = competitors.flatMap(c => c.keywords || []);
  const keywordFrequency = {};
  allKeywords.forEach(kw => {
    keywordFrequency[kw] = (keywordFrequency[kw] || 0) + 1;
  });

  return {
    avgWordCount,
    avgHeadings,
    topKeywords: Object.entries(keywordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([kw]) => kw),
    competitorCount: competitors.length,
  };
}

/**
 * Generate content using Gemini AI
 */
async function generateContentFromCompetitors(keyword, insights, commonKeywords, style) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `You are an expert SEO content writer. Create a comprehensive, unique article that outperforms competitors.

**Target Keyword**: ${keyword}

**Competitor Insights**:
- Average word count: ${insights.avgWordCount}
- Average headings: ${insights.avgHeadings}
- Common keywords: ${commonKeywords.slice(0, 15).join(', ')}

**Requirements**:
1. Write ${Math.max(insights.avgWordCount + 300, 1500)}+ words
2. Include ${insights.avgHeadings + 2}+ headings (H2, H3)
3. Use markdown format with proper heading hierarchy
4. Include all common keywords naturally
5. Add unique angles and insights not found in competitors
6. Include E-E-A-T signals:
   - Author expertise mentions
   - First-hand experience examples
   - Citations and references
   - Trust signals (data, statistics, expert quotes)
7. Style: ${style}
8. Make it engaging, authoritative, and comprehensive

**Output Format** (JSON):
{
  "title": "SEO-optimized title (60 chars max)",
  "metaDescription": "Compelling meta description (155 chars max)",
  "body": "Full article in markdown format with H2, H3 headings",
  "wordCount": <number>,
  "estimatedScore": <0-100>,
  "keywordsCovered": ["keyword1", "keyword2"],
  "uniqueAngles": ["angle1", "angle2"],
  "internalLinks": [
    {"anchor": "text", "suggestion": "where to link"}
  ]
}

**Important**: 
- Make content 100% unique and valuable
- Focus on user intent and comprehensive coverage
- Include actionable insights and examples
- Optimize for featured snippets

Return ONLY valid JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error('Gemini generation error:', error);
    throw new Error('Failed to generate content with AI');
  }
}

/**
 * Optimize content structure
 */
function optimizeContentStructure(content, serpData) {
  // Add missing keywords if any
  const missingKeywords = serpData.missingKeywords || [];
  if (missingKeywords.length > 0) {
    content.keywordsCovered = [
      ...(content.keywordsCovered || []),
      ...missingKeywords.slice(0, 5)
    ];
  }

  // Ensure minimum word count
  if (content.wordCount < 1500) {
    content.estimatedScore = Math.max(content.estimatedScore - 10, 0);
  }

  return content;
}

/**
 * Generate image suggestions
 */
function generateImageSuggestions(content, keyword) {
  const suggestions = [
    {
      placement: 'hero',
      description: `Professional hero image for article about ${keyword}`,
      altText: `${keyword} - comprehensive guide`,
      prompt: `Professional, high-quality hero image for ${keyword}, modern design, clean composition, 4K quality`
    }
  ];

  // Add inline images based on content length
  const inlineCount = Math.floor(content.wordCount / 800);
  for (let i = 0; i < Math.min(inlineCount, 3); i++) {
    suggestions.push({
      placement: 'inline',
      description: `Supporting image ${i + 1} for ${keyword} article`,
      altText: `${keyword} illustration ${i + 1}`,
      prompt: `Relevant illustration for ${keyword}, professional style, informative, high quality`
    });
  }

  return suggestions;
}

/**
 * Calculate keyword density
 */
function calculateKeywordDensity(text, keyword) {
  const words = text.toLowerCase().split(/\s+/);
  const keywordWords = keyword.toLowerCase().split(/\s+/);
  const keywordCount = words.filter(w => keywordWords.includes(w)).length;
  return ((keywordCount / words.length) * 100).toFixed(2);
}

/**
 * Count headings in markdown
 */
function countHeadings(markdown) {
  const headings = markdown.match(/^#{1,6}\s+.+$/gm) || [];
  return headings.length;
}

/**
 * Convert markdown to HTML
 */
function convertToHTML(content) {
  // Simple markdown to HTML conversion
  let html = content.body
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${content.title}</title>
  <meta name="description" content="${content.metaDescription}">
</head>
<body>
  <article>
    <h1>${content.title}</h1>
    <p>${html}</p>
  </article>
</body>
</html>`;
}

/**
 * Generate WordPress export format
 */
function generateWordPressExport(content) {
  return {
    title: content.title,
    content: content.body,
    excerpt: content.metaDescription,
    status: 'draft',
    format: 'standard',
    meta: {
      _yoast_wpseo_title: content.title,
      _yoast_wpseo_metadesc: content.metaDescription,
    }
  };
}
