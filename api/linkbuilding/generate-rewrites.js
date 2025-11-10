/**
 * Link Building - Content Rewriting Module
 * 
 * Generates natural link insertions using ChatGPT-5 content rewriting.
 * Creates multiple variations with quality scoring.
 * 
 * Week 12 Day 5
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate content rewrites with natural link insertions
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, scanId, suggestionIds, variationsCount = 3 } = req.body;

    // Validation
    if (!userId || !scanId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, scanId' 
      });
    }

    console.log(`[Rewrite] Starting for scan ${scanId}, ${suggestionIds?.length || 'all'} suggestions`);

    // Get suggestions to rewrite
    let query = supabase
      .from('link_suggestions')
      .select(`
        *,
        anchor_phrases!inner(
          phrase_text,
          context_before,
          context_after,
          phrase_position
        ),
        site_pages!link_suggestions_source_page_id_fkey(
          url,
          title,
          content_markdown
        ),
        target_pages:site_pages!link_suggestions_target_page_id_fkey(
          url,
          title,
          content_markdown
        )
      `)
      .eq('scan_id', scanId)
      .eq('status', 'pending');

    if (suggestionIds && suggestionIds.length > 0) {
      query = query.in('id', suggestionIds);
    }

    const { data: suggestions, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch suggestions: ${fetchError.message}`);
    }

    if (!suggestions || suggestions.length === 0) {
      return res.status(404).json({ 
        error: 'No pending suggestions found' 
      });
    }

    console.log(`[Rewrite] Processing ${suggestions.length} suggestions`);

    const results = [];
    let totalVariations = 0;

    // Process each suggestion
    for (const suggestion of suggestions) {
      try {
        const variations = await generateRewriteVariations(
          suggestion,
          variationsCount
        );

        // Store variations in database
        const { error: updateError } = await supabase
          .from('link_suggestions')
          .update({
            rewritten_content: variations,
            status: 'ready_for_review',
            updated_at: new Date().toISOString()
          })
          .eq('id', suggestion.id);

        if (updateError) {
          console.error(`[Rewrite] Failed to update suggestion ${suggestion.id}:`, updateError);
          results.push({
            suggestion_id: suggestion.id,
            success: false,
            error: updateError.message
          });
          continue;
        }

        totalVariations += variations.length;

        results.push({
          suggestion_id: suggestion.id,
          success: true,
          variations_count: variations.length,
          top_quality_score: Math.max(...variations.map(v => v.quality_score))
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`[Rewrite] Error processing suggestion ${suggestion.id}:`, error);
        results.push({
          suggestion_id: suggestion.id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return res.status(200).json({
      success: true,
      summary: {
        suggestions_processed: suggestions.length,
        successful: successCount,
        failed: results.length - successCount,
        total_variations_generated: totalVariations
      },
      results
    });

  } catch (error) {
    console.error('[Rewrite] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

/**
 * Generate multiple rewrite variations for a link suggestion
 */
async function generateRewriteVariations(suggestion, count = 3) {
  const { anchor_phrases, site_pages, target_pages } = suggestion;
  
  const anchorText = anchor_phrases.phrase_text;
  const contextBefore = anchor_phrases.context_before || '';
  const contextAfter = anchor_phrases.context_after || '';
  const targetUrl = target_pages.url;
  const targetTitle = target_pages.title;

  // Build the prompt for ChatGPT-5
  const prompt = `You are an expert SEO content writer. Your task is to naturally insert a link into existing content while maintaining readability and context.

**Context:**
Original text: "${contextBefore} ${anchorText} ${contextAfter}"

**Link to insert:**
- Anchor text: "${anchorText}"
- Target URL: ${targetUrl}
- Target page title: "${targetTitle}"

**Requirements:**
1. Insert the link naturally into the text
2. Maintain the original meaning and flow
3. Ensure the link makes sense in context
4. Keep the writing style consistent
5. Don't force the link if it doesn't fit naturally

**Generate ${count} different variations** of how to insert this link. Each variation should:
- Be natural and readable
- Preserve the original context
- Use the exact anchor text: "${anchorText}"
- Vary the surrounding text slightly for different options

Return ONLY a JSON array with this structure:
[
  {
    "rewritten_content": "the full rewritten paragraph with the link naturally inserted",
    "approach": "brief description of the insertion approach used",
    "naturalness_score": 0-100
  }
]`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO content writer specializing in natural link insertion. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const responseText = completion.choices[0].message.content.trim();
    
    // Parse JSON response
    let variations;
    try {
      // Remove markdown code blocks if present
      const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      variations = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[Rewrite] Failed to parse AI response:', responseText);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Enhance variations with quality scores
    const enhancedVariations = variations.map((variation, index) => {
      const qualityScore = calculateQualityScore(
        variation.rewritten_content,
        anchorText,
        contextBefore + ' ' + anchorText + ' ' + contextAfter
      );

      return {
        variation_number: index + 1,
        rewritten_content: variation.rewritten_content,
        approach: variation.approach,
        naturalness_score: variation.naturalness_score || 0,
        quality_score: qualityScore,
        readability_score: calculateReadabilityScore(variation.rewritten_content),
        anchor_text: anchorText,
        target_url: targetUrl
      };
    });

    // Sort by quality score (highest first)
    enhancedVariations.sort((a, b) => b.quality_score - a.quality_score);

    return enhancedVariations;

  } catch (error) {
    console.error('[Rewrite] OpenAI API error:', error);
    throw new Error(`Failed to generate rewrites: ${error.message}`);
  }
}

/**
 * Calculate quality score for a rewritten variation
 */
function calculateQualityScore(rewrittenContent, anchorText, originalContent) {
  let score = 0;

  // Check if anchor text is present (30 points)
  if (rewrittenContent.includes(anchorText)) {
    score += 30;
  }

  // Check content length similarity (20 points)
  const lengthRatio = rewrittenContent.length / originalContent.length;
  if (lengthRatio >= 0.8 && lengthRatio <= 1.5) {
    score += 20;
  } else if (lengthRatio >= 0.6 && lengthRatio <= 2.0) {
    score += 10;
  }

  // Check for natural language patterns (20 points)
  const hasNaturalFlow = /\b(the|a|an|this|that|these|those)\b/i.test(rewrittenContent);
  if (hasNaturalFlow) {
    score += 20;
  }

  // Check for proper punctuation (15 points)
  const hasPunctuation = /[.!?]$/.test(rewrittenContent.trim());
  if (hasPunctuation) {
    score += 15;
  }

  // Check for context preservation (15 points)
  const originalWords = originalContent.toLowerCase().split(/\s+/);
  const rewrittenWords = rewrittenContent.toLowerCase().split(/\s+/);
  const commonWords = originalWords.filter(word => 
    rewrittenWords.includes(word) && word.length > 3
  );
  const preservationRatio = commonWords.length / originalWords.length;
  score += Math.round(preservationRatio * 15);

  return Math.min(score, 100);
}

/**
 * Calculate readability score (Flesch Reading Ease approximation)
 */
function calculateReadabilityScore(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((count, word) => {
    return count + countSyllables(word);
  }, 0);

  if (sentences.length === 0 || words.length === 0) {
    return 0;
  }

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease formula
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

  // Normalize to 0-100 scale
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Count syllables in a word (approximation)
 */
function countSyllables(word) {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}
