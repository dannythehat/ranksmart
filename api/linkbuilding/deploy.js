/**
 * Link Building - Deployment Module
 * 
 * Applies approved link suggestions to live content with version control
 * and rollback capability.
 * 
 * Week 12 Day 7
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Deploy approved link suggestions
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
    const { 
      userId, 
      suggestionIds, 
      deploymentMethod = 'manual',
      autoApply = false 
    } = req.body;

    // Validation
    if (!userId || !suggestionIds || suggestionIds.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, suggestionIds' 
      });
    }

    console.log(`[Deploy] Starting deployment for ${suggestionIds.length} suggestions`);

    // Fetch approved suggestions
    const { data: suggestions, error: fetchError } = await supabase
      .from('link_suggestions')
      .select(`
        *,
        anchor_phrases!inner(
          phrase_text,
          phrase_position,
          context_before,
          context_after
        ),
        site_pages!link_suggestions_source_page_id_fkey(
          id,
          url,
          title,
          content_html,
          content_markdown
        ),
        target_pages:site_pages!link_suggestions_target_page_id_fkey(
          url,
          title
        )
      `)
      .in('id', suggestionIds)
      .eq('status', 'approved');

    if (fetchError) {
      throw new Error(`Failed to fetch suggestions: ${fetchError.message}`);
    }

    if (!suggestions || suggestions.length === 0) {
      return res.status(404).json({ 
        error: 'No approved suggestions found' 
      });
    }

    console.log(`[Deploy] Processing ${suggestions.length} approved suggestions`);

    const results = [];
    const appliedLinks = [];

    // Group suggestions by source page
    const pageGroups = groupBySourcePage(suggestions);

    // Process each page
    for (const [pageId, pageSuggestions] of Object.entries(pageGroups)) {
      try {
        const result = await deployPageLinks(
          pageId,
          pageSuggestions,
          deploymentMethod,
          autoApply
        );

        results.push(result);

        if (result.success) {
          appliedLinks.push(...result.applied_links);
        }

      } catch (error) {
        console.error(`[Deploy] Error deploying page ${pageId}:`, error);
        results.push({
          page_id: pageId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    // Update analytics
    await updateDeploymentAnalytics(userId, appliedLinks);

    return res.status(200).json({
      success: true,
      summary: {
        pages_processed: results.length,
        successful: successCount,
        failed: results.length - successCount,
        total_links_applied: appliedLinks.length
      },
      results,
      deployment_method: deploymentMethod
    });

  } catch (error) {
    console.error('[Deploy] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

/**
 * Group suggestions by source page
 */
function groupBySourcePage(suggestions) {
  const groups = {};
  
  for (const suggestion of suggestions) {
    const pageId = suggestion.source_page_id;
    if (!groups[pageId]) {
      groups[pageId] = [];
    }
    groups[pageId].push(suggestion);
  }
  
  return groups;
}

/**
 * Deploy links for a single page
 */
async function deployPageLinks(pageId, suggestions, deploymentMethod, autoApply) {
  // Get current page content
  const { data: page, error: pageError } = await supabase
    .from('site_pages')
    .select('*')
    .eq('id', pageId)
    .single();

  if (pageError || !page) {
    throw new Error(`Failed to fetch page: ${pageError?.message}`);
  }

  // Create version snapshot (before changes)
  const versionSnapshot = {
    page_id: pageId,
    content_html: page.content_html,
    content_markdown: page.content_markdown,
    snapshot_type: 'before_deployment',
    created_at: new Date().toISOString()
  };

  // Apply links to content
  let modifiedHtml = page.content_html;
  let modifiedMarkdown = page.content_markdown;
  const appliedLinks = [];

  for (const suggestion of suggestions) {
    try {
      // Get the best rewrite variation
      const bestVariation = getBestVariation(suggestion.rewritten_content);
      
      if (!bestVariation) {
        console.warn(`[Deploy] No variation found for suggestion ${suggestion.id}`);
        continue;
      }

      // Apply link to HTML content
      const anchorText = suggestion.anchor_phrases.phrase_text;
      const targetUrl = suggestion.target_pages.url;
      const linkHtml = `<a href="${targetUrl}">${anchorText}</a>`;

      // Simple replacement (in production, use more sophisticated HTML parsing)
      modifiedHtml = modifiedHtml.replace(
        new RegExp(`\\b${escapeRegex(anchorText)}\\b`, 'i'),
        linkHtml
      );

      // Apply link to Markdown content
      const linkMarkdown = `[${anchorText}](${targetUrl})`;
      modifiedMarkdown = modifiedMarkdown.replace(
        new RegExp(`\\b${escapeRegex(anchorText)}\\b`, 'i'),
        linkMarkdown
      );

      // Record applied link
      const appliedLink = {
        suggestion_id: suggestion.id,
        source_page_id: pageId,
        target_page_id: suggestion.target_page_id,
        anchor_text: anchorText,
        target_url: targetUrl,
        link_type: 'internal',
        deployment_method: deploymentMethod,
        applied_at: new Date().toISOString(),
        version_snapshot: versionSnapshot
      };

      appliedLinks.push(appliedLink);

      // Update suggestion status
      await supabase
        .from('link_suggestions')
        .update({
          status: 'applied',
          applied_at: new Date().toISOString()
        })
        .eq('id', suggestion.id);

    } catch (error) {
      console.error(`[Deploy] Error applying suggestion ${suggestion.id}:`, error);
    }
  }

  // Save applied links to database
  if (appliedLinks.length > 0) {
    const { error: insertError } = await supabase
      .from('applied_links')
      .insert(appliedLinks);

    if (insertError) {
      console.error('[Deploy] Error saving applied links:', insertError);
    }
  }

  // Update page content (if auto-apply is enabled)
  if (autoApply && appliedLinks.length > 0) {
    const { error: updateError } = await supabase
      .from('site_pages')
      .update({
        content_html: modifiedHtml,
        content_markdown: modifiedMarkdown,
        updated_at: new Date().toISOString()
      })
      .eq('id', pageId);

    if (updateError) {
      throw new Error(`Failed to update page content: ${updateError.message}`);
    }
  }

  return {
    success: true,
    page_id: pageId,
    page_url: page.url,
    links_applied: appliedLinks.length,
    applied_links: appliedLinks,
    auto_applied: autoApply
  };
}

/**
 * Get best rewrite variation based on quality score
 */
function getBestVariation(variations) {
  if (!variations || variations.length === 0) {
    return null;
  }

  return variations.reduce((best, current) => {
    return (current.quality_score || 0) > (best.quality_score || 0) ? current : best;
  }, variations[0]);
}

/**
 * Escape special regex characters
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Update deployment analytics
 */
async function updateDeploymentAnalytics(userId, appliedLinks) {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Get or create today's analytics record
    const { data: existing, error: fetchError } = await supabase
      .from('link_building_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[Deploy] Error fetching analytics:', fetchError);
      return;
    }

    const linksAdded = appliedLinks.length;
    const pagesModified = new Set(appliedLinks.map(l => l.source_page_id)).size;

    if (existing) {
      // Update existing record
      await supabase
        .from('link_building_analytics')
        .update({
          links_added: existing.links_added + linksAdded,
          pages_modified: existing.pages_modified + pagesModified,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      // Create new record
      await supabase
        .from('link_building_analytics')
        .insert({
          user_id: userId,
          date: today,
          links_added: linksAdded,
          pages_modified: pagesModified
        });
    }

  } catch (error) {
    console.error('[Deploy] Error updating analytics:', error);
  }
}
