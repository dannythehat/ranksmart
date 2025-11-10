/**
 * Anchor Phrase Extraction API
 * Uses NLP to extract high-value anchor phrase candidates from content
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Extract noun phrases using simple NLP patterns
 */
function extractNounPhrases(text) {
  // Common noun phrase patterns
  const patterns = [
    // Adjective + Noun (e.g., "best practices", "high quality")
    /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g,
    // Noun + Noun (e.g., "content marketing", "link building")
    /\b([a-z]+\s+[a-z]+ing)\b/g,
    // Multi-word capitalized phrases (e.g., "Search Engine Optimization")
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g
  ];
  
  const phrases = new Set();
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const phrase = match[1].trim();
      if (phrase.length > 3 && phrase.split(' ').length <= 5) {
        phrases.add(phrase);
      }
    }
  });
  
  return Array.from(phrases);
}

/**
 * Extract named entities (simple approach)
 */
function extractNamedEntities(text) {
  // Look for capitalized words/phrases
  const entityRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  const entities = new Set();
  let match;
  
  while ((match = entityRegex.exec(text)) !== null) {
    const entity = match[1].trim();
    // Filter out common words
    const commonWords = ['The', 'This', 'That', 'These', 'Those', 'A', 'An'];
    if (!commonWords.includes(entity) && entity.length > 2) {
      entities.add(entity);
    }
  }
  
  return Array.from(entities);
}

/**
 * Calculate TF-IDF score for a phrase
 */
function calculateTFIDF(phrase, content, allContent) {
  // Term Frequency (TF)
  const phraseCount = (content.match(new RegExp(phrase, 'gi')) || []).length;
  const totalWords = content.split(/\s+/).length;
  const tf = phraseCount / totalWords;
  
  // Inverse Document Frequency (IDF) - simplified
  // In a real implementation, this would use all documents in the corpus
  const idf = Math.log(allContent.length / (1 + phraseCount));
  
  return tf * idf;
}

/**
 * Extract context around a phrase
 */
function extractContext(content, phrase, contextLength = 100) {
  const phraseIndex = content.toLowerCase().indexOf(phrase.toLowerCase());
  
  if (phraseIndex === -1) {
    return { before: '', after: '' };
  }
  
  const before = content.substring(
    Math.max(0, phraseIndex - contextLength),
    phraseIndex
  ).trim();
  
  const after = content.substring(
    phraseIndex + phrase.length,
    Math.min(content.length, phraseIndex + phrase.length + contextLength)
  ).trim();
  
  return { before, after };
}

/**
 * Generate embedding for anchor phrase
 */
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

/**
 * Use ChatGPT-5 to extract high-quality anchor phrases
 */
async function extractAnchorsWithAI(content) {
  try {
    const prompt = `Analyze the following content and extract 10-15 high-quality anchor phrases that would be suitable for internal or external linking. Focus on:
- Key concepts and topics
- Named entities (products, services, companies)
- Technical terms and jargon
- Action-oriented phrases
- Phrases that users might search for

Return ONLY a JSON array of phrases, nothing else.

Content:
${content.substring(0, 3000)}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an SEO expert specializing in anchor text optimization. Extract relevant anchor phrases from content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });
    
    const result = response.choices[0].message.content.trim();
    
    // Parse JSON response
    try {
      const phrases = JSON.parse(result);
      return Array.isArray(phrases) ? phrases : [];
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error extracting anchors with AI:', error);
    return [];
  }
}

/**
 * Process a single page to extract anchor phrases
 */
async function processPageForAnchors(pageId, userId) {
  try {
    // Get page content
    const { data: page, error: pageError } = await supabase
      .from('site_pages')
      .select('*')
      .eq('id', pageId)
      .eq('user_id', userId)
      .single();
    
    if (pageError || !page) {
      throw new Error('Page not found');
    }
    
    const content = page.page_content;
    
    // Extract anchor phrases using multiple methods
    const nounPhrases = extractNounPhrases(content);
    const namedEntities = extractNamedEntities(content);
    const aiPhrases = await extractAnchorsWithAI(content);
    
    // Combine and deduplicate
    const allPhrases = [...new Set([...nounPhrases, ...namedEntities, ...aiPhrases])];
    
    // Process each phrase
    const anchorRecords = [];
    
    for (const phrase of allPhrases) {
      // Calculate relevance score (TF-IDF)
      const relevanceScore = calculateTFIDF(phrase, content, [content]);
      
      // Extract context
      const context = extractContext(content, phrase);
      
      // Find position in content
      const position = content.toLowerCase().indexOf(phrase.toLowerCase());
      
      // Generate embedding
      const embedding = await generateEmbedding(phrase);
      
      // Determine phrase type
      let phraseType = 'keyword';
      if (nounPhrases.includes(phrase)) phraseType = 'noun_phrase';
      if (namedEntities.includes(phrase)) phraseType = 'named_entity';
      
      anchorRecords.push({
        page_id: pageId,
        user_id: userId,
        anchor_text: phrase,
        context_before: context.before,
        context_after: context.after,
        position_in_content: position,
        relevance_score: relevanceScore,
        phrase_type: phraseType,
        embedding: embedding
      });
    }
    
    // Store in database
    if (anchorRecords.length > 0) {
      const { error: insertError } = await supabase
        .from('anchor_phrases')
        .insert(anchorRecords);
      
      if (insertError) {
        throw insertError;
      }
    }
    
    return {
      success: true,
      page_id: pageId,
      anchors_extracted: anchorRecords.length,
      phrase_types: {
        noun_phrases: nounPhrases.length,
        named_entities: namedEntities.length,
        ai_phrases: aiPhrases.length
      }
    };
  } catch (error) {
    console.error(`Error processing page ${pageId}:`, error);
    return {
      success: false,
      page_id: pageId,
      error: error.message
    };
  }
}

/**
 * Main handler
 */
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
    const { userId, scanId, pageIds } = req.body;
    
    // Validation
    if (!userId) {
      return res.status(400).json({
        error: 'Missing required field: userId'
      });
    }
    
    // Get pages to process
    let pagesToProcess = [];
    
    if (pageIds && pageIds.length > 0) {
      // Process specific pages
      pagesToProcess = pageIds;
    } else if (scanId) {
      // Get all pages from scan
      const { data: scan } = await supabase
        .from('link_building_scans')
        .select('site_domain')
        .eq('id', scanId)
        .eq('user_id', userId)
        .single();
      
      if (scan) {
        const { data: pages } = await supabase
          .from('site_pages')
          .select('id')
          .eq('user_id', userId)
          .eq('site_domain', scan.site_domain);
        
        pagesToProcess = pages.map(p => p.id);
      }
    } else {
      return res.status(400).json({
        error: 'Must provide either pageIds or scanId'
      });
    }
    
    // Process pages
    const results = [];
    let totalAnchors = 0;
    
    for (const pageId of pagesToProcess) {
      const result = await processPageForAnchors(pageId, userId);
      results.push(result);
      
      if (result.success) {
        totalAnchors += result.anchors_extracted;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Update scan record if provided
    if (scanId) {
      await supabase
        .from('link_building_scans')
        .update({
          anchors_extracted: totalAnchors
        })
        .eq('id', scanId);
    }
    
    return res.status(200).json({
      success: true,
      summary: {
        pages_processed: pagesToProcess.length,
        total_anchors_extracted: totalAnchors
      },
      results: results
    });
    
  } catch (error) {
    console.error('Anchor extraction error:', error);
    return res.status(500).json({
      error: 'Anchor extraction failed',
      details: error.message
    });
  }
}
