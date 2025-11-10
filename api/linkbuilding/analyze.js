/**
 * Link Building - Opportunity Analysis
 * Analyzes content to find natural link insertion opportunities
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { content, targetPages } = req.body;

    // Validation
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (!targetPages || !Array.isArray(targetPages) || targetPages.length === 0) {
      return res.status(400).json({ error: 'Target pages array is required' });
    }

    // Initialize Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Analyze content for link opportunities
    const prompt = `You are an expert SEO analyst specializing in internal linking strategies.

TASK: Analyze the following content and identify natural opportunities to insert internal links to the specified target pages.

CONTENT:
${content}

TARGET PAGES TO LINK TO:
${targetPages.map((page, i) => `${i + 1}. ${page.title} (${page.url})\n   Topic: ${page.topic || 'General'}`).join('\n')}

REQUIREMENTS:
1. Find 3-5 natural link insertion opportunities
2. For each opportunity, identify:
   - The exact sentence or paragraph where the link should go
   - Suggested anchor text (natural, contextual)
   - Why this placement makes sense
   - Relevance score (0-100)
3. Prioritize opportunities by relevance and naturalness
4. Ensure anchor text is diverse (avoid repetition)
5. Consider user experience and reading flow

OUTPUT FORMAT (JSON):
{
  "opportunities": [
    {
      "targetPage": "page title",
      "targetUrl": "url",
      "anchorText": "suggested anchor text",
      "context": "surrounding sentence/paragraph",
      "position": "approximate position in content",
      "relevanceScore": 85,
      "reasoning": "why this link makes sense"
    }
  ]
}

Return ONLY valid JSON, no additional text.`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // Clean up response
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const analysis = JSON.parse(responseText);

    // Enhance opportunities with additional metrics
    const enhancedOpportunities = analysis.opportunities.map((opp, index) => {
      // Calculate position percentage
      const contextPosition = content.toLowerCase().indexOf(opp.context.toLowerCase().substring(0, 50));
      const positionPercentage = contextPosition >= 0 
        ? Math.round((contextPosition / content.length) * 100)
        : 50;

      return {
        id: index + 1,
        ...opp,
        positionPercentage,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
    });

    // Sort by relevance score
    enhancedOpportunities.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Calculate overall metrics
    const avgRelevance = Math.round(
      enhancedOpportunities.reduce((sum, opp) => sum + opp.relevanceScore, 0) / 
      enhancedOpportunities.length
    );

    return res.status(200).json({
      success: true,
      data: {
        opportunities: enhancedOpportunities,
        summary: {
          totalOpportunities: enhancedOpportunities.length,
          averageRelevance: avgRelevance,
          highPriority: enhancedOpportunities.filter(o => o.relevanceScore >= 80).length,
          mediumPriority: enhancedOpportunities.filter(o => o.relevanceScore >= 60 && o.relevanceScore < 80).length,
          lowPriority: enhancedOpportunities.filter(o => o.relevanceScore < 60).length
        },
        metadata: {
          contentLength: content.length,
          wordCount: content.split(/\s+/).length,
          targetPagesCount: targetPages.length,
          analyzedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Link analysis error:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze link opportunities',
      details: error.message 
    });
  }
}
