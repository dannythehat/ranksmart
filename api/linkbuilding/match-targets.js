/**
 * Semantic Matching API
 * Matches anchor phrases to target pages using semantic similarity
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Find best matching target page for an anchor phrase
 */
async function findBestMatch(anchorPhrase, userId, sourcePageId, minConfidence = 0.6) {
  try {
    // Get all pages for this user (excluding source page)
    const { data: pages, error: pagesError } = await supabase
      .from('site_pages')
      .select('id, page_url, page_title, site_domain, embedding')
      .eq('user_id', userId)
      .neq('id', sourcePageId);
    
    if (pagesError || !pages || pages.length === 0) {
      return null;
    }
    
    // Calculate similarity scores
    const matches = pages.map(page => {
      const similarity = cosineSimilarity(anchorPhrase.embedding, page.embedding);
      
      return {
        page_id: page.id,
        page_url: page.page_url,
        page_title: page.page_title,
        site_domain: page.site_domain,
        similarity_score: similarity,
        link_type: 'internal'
      };
    }).filter(match => match.similarity_score >= minConfidence);
    
    // Sort by similarity score (descending)
    matches.sort((a, b) => b.similarity_score - a.similarity_score);
    
    // Return top match
    return matches.length > 0 ? matches[0] : null;
  } catch (error) {
    console.error('Error finding best match:', error);
    return null;
  }
}

/**
 * Check if link already exists
 */
async function linkExists(sourcePageId, targetUrl, anchorText) {
  try {
    // Check in existing links of source page
    const { data: sourcePage } = await supabase
      .from('site_pages')
      .select('existing_links')
      .eq('id', sourcePageId)
      .single();
    
    if (sourcePage && sourcePage.existing_links) {
      const exists = sourcePage.existing_links.some(link => 
        link.url === targetUrl || link.anchor_text === anchorText
      );
      
      if (exists) {
        return true;
      }
    }
    
    // Check in applied links
    const { data: appliedLinks } = await supabase
      .from('applied_links')
      .select('id')
      .eq('source_page_id', sourcePageId)
      .eq('target_url', targetUrl)
      .eq('is_active', true);
    
    return appliedLinks && appliedLinks.length > 0;
  } catch (error) {
    console.error('Error checking link existence:', error);
    return false;
  }
}

/**
 * Calculate link density for a page
 */
async function calculateLinkDensity(pageId) {
  try {
    const { data: page } = await supabase
      .from('site_pages')
      .select('word_count, existing_links')
      .eq('id', pageId)
      .single();
    
    if (!page || !page.word_count) {
      return 0;
    }
    
    const existingLinksCount = page.existing_links ? page.existing_links.length : 0;
    
    // Get applied links count
    const { data: appliedLinks } = await supabase
      .from('applied_links')
      .select('id')
      .eq('source_page_id', pageId)
      .eq('is_active', true);
    
    const appliedLinksCount = appliedLinks ? appliedLinks.length : 0;
    
    const totalLinks = existingLinksCount + appliedLinksCount;
    
    // Calculate density as percentage
    return (totalLinks / page.word_count) * 100;
  } catch (error) {
    console.error('Error calculating link density:', error);
    return 0;
  }
}

/**
 * Get user preferences
 */
async function getUserPreferences(userId) {
  try {
    const { data: prefs } = await supabase
      .from('link_building_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return prefs || {
      min_confidence_threshold: 0.7,
      max_links_per_page: 5,
      max_link_density_percent: 2.0,
      avoid_duplicate_targets: true
    };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {
      min_confidence_threshold: 0.7,
      max_links_per_page: 5,
      max_link_density_percent: 2.0,
      avoid_duplicate_targets: true
    };
  }
}

/**
 * Process anchor phrases for a page
 */
async function processAnchorsForPage(pageId, userId) {
  try {
    // Get user preferences
    const prefs = await getUserPreferences(userId);
    
    // Check current link density
    const currentDensity = await calculateLinkDensity(pageId);
    
    if (currentDensity >= prefs.max_link_density_percent) {
      return {
        success: false,
        page_id: pageId,
        error: 'Page has reached maximum link density',
        current_density: currentDensity
      };
    }
    
    // Get anchor phrases for this page
    const { data: anchors, error: anchorsError } = await supabase
      .from('anchor_phrases')
      .select('*')
      .eq('page_id', pageId)
      .eq('user_id', userId)
      .order('relevance_score', { ascending: false });
    
    if (anchorsError || !anchors || anchors.length === 0) {
      return {
        success: false,
        page_id: pageId,
        error: 'No anchor phrases found'
      };
    }
    
    // Process each anchor phrase
    const matches = [];
    let linksAdded = 0;
    
    for (const anchor of anchors) {
      // Check if we've reached max links per page
      if (linksAdded >= prefs.max_links_per_page) {
        break;
      }
      
      // Check if link already exists
      const exists = await linkExists(pageId, anchor.anchor_text, anchor.anchor_text);
      if (exists && prefs.avoid_duplicate_targets) {
        continue;
      }
      
      // Find best matching target page
      const match = await findBestMatch(anchor, userId, pageId, prefs.min_confidence_threshold);
      
      if (match) {
        matches.push({
          anchor_phrase_id: anchor.id,
          anchor_text: anchor.anchor_text,
          target_page_id: match.page_id,
          target_url: match.page_url,
          target_title: match.page_title,
          confidence_score: match.similarity_score,
          relevance_score: anchor.relevance_score,
          link_type: match.link_type
        });
        
        linksAdded++;
      }
    }
    
    return {
      success: true,
      page_id: pageId,
      matches_found: matches.length,
      matches: matches
    };
  } catch (error) {
    console.error(`Error processing anchors for page ${pageId}:`, error);
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
    let totalMatches = 0;
    
    for (const pageId of pagesToProcess) {
      const result = await processAnchorsForPage(pageId, userId);
      results.push(result);
      
      if (result.success) {
        totalMatches += result.matches_found;
      }
    }
    
    return res.status(200).json({
      success: true,
      summary: {
        pages_processed: pagesToProcess.length,
        total_matches_found: totalMatches
      },
      results: results
    });
    
  } catch (error) {
    console.error('Semantic matching error:', error);
    return res.status(500).json({
      error: 'Semantic matching failed',
      details: error.message
    });
  }
}
