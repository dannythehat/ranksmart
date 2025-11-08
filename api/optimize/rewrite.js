import { verifyAuth } from '../utils/db.js';
import { rewriteContent, generateImagePrompt } from '../utils/ai.js';
import { isValidUrl, sanitizeKeyword } from '../utils/validators.js';

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
    // Verify authentication
    const { error: authError, user } = await verifyAuth(req.headers.authorization);
    
    if (authError) {
      return res.status(401).json({ error: authError });
    }

    const { competitorData, keyword, targetAudience } = req.body;

    if (!competitorData || !keyword) {
      return res.status(400).json({ 
        error: 'Competitor data and keyword are required' 
      });
    }

    if (!isValidUrl(competitorData.url)) {
      return res.status(400).json({ 
        error: 'Invalid competitor URL format' 
      });
    }

    const cleanKeyword = sanitizeKeyword(keyword);

    // Rewrite content using AI
    const rewrite = await rewriteContent(
      competitorData, 
      cleanKeyword, 
      targetAudience || 'iGaming affiliates'
    );

    // Generate image prompts for suggested images
    const imagePrompts = [];
    for (const imgSuggestion of rewrite.image_suggestions || []) {
      const prompt = await generateImagePrompt(
        imgSuggestion.description,
        'professional'
      );
      imagePrompts.push({
        ...imgSuggestion,
        prompt: prompt,
      });
    }

    // Create optimization record
    const optimization = {
      mode: 'rewrite',
      original_content: {
        url: competitorData.url,
        title: competitorData.title,
        content: competitorData.content,
        word_count: competitorData.wordCount,
      },
      optimized_content: {
        title: rewrite.title,
        meta_description: rewrite.meta_description,
        content: rewrite.content,
        word_count: rewrite.word_count,
        seo_keywords: rewrite.seo_keywords,
      },
      improvements: {
        key_improvements: rewrite.key_improvements,
        estimated_score: rewrite.estimated_score,
      },
      image_prompts: imagePrompts,
      estimated_score: rewrite.estimated_score,
    };

    return res.status(200).json({
      success: true,
      optimization: optimization,
      message: 'Content rewritten successfully',
    });

  } catch (error) {
    console.error('Rewrite content error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
