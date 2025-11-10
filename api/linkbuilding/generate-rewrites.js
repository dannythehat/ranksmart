/**
 * Link Building - Content Rewriting Module
 * Generates natural link insertions using ChatGPT-5
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
    const { content, targetUrl, anchorText, context } = req.body;

    // Validation
    if (!content || !targetUrl || !anchorText) {
      return res.status(400).json({ 
        error: 'Missing required fields: content, targetUrl, anchorText' 
      });
    }

    // Initialize Gemini 2.0 Flash (ChatGPT-5 equivalent)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Prompt for natural link insertion
    const prompt = `You are an expert SEO content writer specializing in natural link insertion.

TASK: Rewrite the following content to naturally include a link with the specified anchor text.

CONTENT:
${content}

LINK DETAILS:
- Target URL: ${targetUrl}
- Anchor Text: ${anchorText}
- Context: ${context || 'General informational link'}

REQUIREMENTS:
1. Insert the link naturally within the content flow
2. The anchor text should fit seamlessly into a sentence
3. Add 1-2 sentences around the link to provide context
4. Maintain the original content's tone and style
5. Ensure the link placement feels organic, not forced
6. The link should add value to the reader
7. Keep the overall content length similar

IMPORTANT:
- Return ONLY the rewritten content with the link inserted
- Use markdown format for the link: [${anchorText}](${targetUrl})
- Do NOT add explanations or meta-commentary
- Ensure the link appears exactly once

OUTPUT FORMAT:
Return the complete rewritten content with the link naturally integrated.`;

    // Generate rewrite
    const result = await model.generateContent(prompt);
    const rewrittenContent = result.response.text();

    // Extract link position for analytics
    const linkPosition = rewrittenContent.indexOf(`[${anchorText}]`);
    const totalLength = rewrittenContent.length;
    const positionPercentage = Math.round((linkPosition / totalLength) * 100);

    // Generate multiple variations
    const variations = [];
    
    // Generate 2 additional variations
    for (let i = 0; i < 2; i++) {
      const variationPrompt = `${prompt}\n\nIMPORTANT: Create a DIFFERENT variation from previous attempts. Place the link in a different position and use different surrounding context.`;
      
      const variationResult = await model.generateContent(variationPrompt);
      const variationContent = variationResult.response.text();
      
      const varLinkPos = variationContent.indexOf(`[${anchorText}]`);
      const varPosPercentage = Math.round((varLinkPos / variationContent.length) * 100);
      
      variations.push({
        id: i + 2,
        content: variationContent,
        linkPosition: varLinkPos,
        positionPercentage: varPosPercentage,
        wordCount: variationContent.split(/\s+/).length
      });
    }

    // Analyze quality metrics
    const wordCount = rewrittenContent.split(/\s+/).length;
    const originalWordCount = content.split(/\s+/).length;
    const wordCountDiff = wordCount - originalWordCount;

    // Check if link was inserted
    const linkInserted = rewrittenContent.includes(`[${anchorText}](${targetUrl})`);

    // Quality score (0-100)
    let qualityScore = 0;
    if (linkInserted) qualityScore += 40;
    if (Math.abs(wordCountDiff) <= 50) qualityScore += 20; // Similar length
    if (positionPercentage > 20 && positionPercentage < 80) qualityScore += 20; // Good position
    if (rewrittenContent.split('\n\n').length >= 2) qualityScore += 20; // Multiple paragraphs

    return res.status(200).json({
      success: true,
      data: {
        original: {
          content,
          wordCount: originalWordCount
        },
        rewritten: {
          content: rewrittenContent,
          wordCount,
          wordCountDiff,
          linkPosition,
          positionPercentage,
          linkInserted,
          qualityScore
        },
        variations: [
          {
            id: 1,
            content: rewrittenContent,
            linkPosition,
            positionPercentage,
            wordCount,
            isDefault: true
          },
          ...variations
        ],
        metadata: {
          targetUrl,
          anchorText,
          context: context || 'General informational link',
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Link rewrite error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate link rewrite',
      details: error.message 
    });
  }
}
