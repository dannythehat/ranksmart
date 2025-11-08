import { verifyAuth, saveAudit } from '../utils/db.js';
import { generateContentFixes } from '../utils/ai.js';
import { isValidUrl } from '../utils/validators.js';

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

    const { pageData, analysis } = req.body;

    if (!pageData || !analysis) {
      return res.status(400).json({ 
        error: 'Page data and analysis are required' 
      });
    }

    if (!isValidUrl(pageData.url)) {
      return res.status(400).json({ 
        error: 'Invalid URL format' 
      });
    }

    // Generate content improvements using AI
    const improvements = await generateContentFixes(pageData, analysis);

    // Create optimization record
    const optimization = {
      mode: 'fix',
      original_content: {
        title: pageData.title,
        description: pageData.description,
        content: pageData.content,
        word_count: pageData.wordCount,
      },
      optimized_content: {
        title: improvements.improved_title,
        description: improvements.improved_description,
        content_additions: improvements.content_additions,
        content_modifications: improvements.content_modifications,
        new_sections: improvements.new_sections,
      },
      improvements: {
        summary: improvements.summary,
        estimated_new_score: improvements.estimated_new_score,
        score_improvement: improvements.estimated_new_score - analysis.overall_score,
      },
      estimated_score: improvements.estimated_new_score,
    };

    return res.status(200).json({
      success: true,
      optimization: optimization,
      message: 'Content improvements generated successfully',
    });

  } catch (error) {
    console.error('Fix article error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
