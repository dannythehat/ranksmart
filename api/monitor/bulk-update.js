/**
 * Bulk Update API
 * Apply updates to multiple monitored URLs at once
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method } = req;

    // GET: Get bulk update status
    if (method === 'GET') {
      const { userId, bulkId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      let query = supabase
        .from('bulk_updates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (bulkId) {
        query = query.eq('id', bulkId).single();
      }

      const { data, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        bulkUpdates: bulkId ? data : data,
        count: bulkId ? 1 : data.length
      });
    }

    // POST: Create and execute bulk update
    if (method === 'POST') {
      const { 
        userId, 
        name, 
        description,
        monitorIds, 
        updateType = 'refresh' 
      } = req.body;

      if (!userId || !monitorIds || monitorIds.length === 0) {
        return res.status(400).json({ 
          error: 'userId and monitorIds required' 
        });
      }

      // Create bulk update record
      const { data: bulkUpdate, error: createError } = await supabase
        .from('bulk_updates')
        .insert({
          user_id: userId,
          name: name || `Bulk ${updateType} - ${new Date().toLocaleDateString()}`,
          description,
          monitor_ids: monitorIds,
          update_type: updateType,
          status: 'pending',
          total: monitorIds.length,
          progress: 0
        })
        .select()
        .single();

      if (createError) throw createError;

      // Start processing asynchronously
      processBulkUpdate(bulkUpdate.id, userId, monitorIds, updateType);

      return res.status(202).json({
        success: true,
        message: 'Bulk update started',
        bulkUpdate: {
          id: bulkUpdate.id,
          status: 'processing',
          total: monitorIds.length,
          progress: 0
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Bulk update API error:', error);
    return res.status(500).json({
      error: 'Failed to process bulk update',
      details: error.message
    });
  }
}

/**
 * Process bulk update asynchronously
 */
async function processBulkUpdate(bulkId, userId, monitorIds, updateType) {
  try {
    // Update status to processing
    await supabase
      .from('bulk_updates')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', bulkId);

    const results = [];
    let completed = 0;

    for (const monitorId of monitorIds) {
      try {
        // Get monitored content
        const { data: monitored } = await supabase
          .from('monitored_content')
          .select('*')
          .eq('id', monitorId)
          .single();

        if (!monitored) {
          results.push({
            monitorId,
            url: 'unknown',
            success: false,
            error: 'Monitor not found'
          });
          completed++;
          continue;
        }

        let result;
        
        switch (updateType) {
          case 'refresh':
            result = await refreshContent(monitored);
            break;
          case 'optimize':
            result = await optimizeContent(monitored);
            break;
          case 'fix':
            result = await applyFixes(monitored);
            break;
          default:
            result = { success: false, error: 'Unknown update type' };
        }

        results.push({
          monitorId,
          url: monitored.url,
          title: monitored.title,
          ...result
        });

        completed++;

        // Update progress
        await supabase
          .from('bulk_updates')
          .update({ 
            progress: Math.round((completed / monitorIds.length) * 100),
            results: results
          })
          .eq('id', bulkId);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error processing monitor ${monitorId}:`, error);
        results.push({
          monitorId,
          success: false,
          error: error.message
        });
        completed++;
      }
    }

    // Mark as completed
    await supabase
      .from('bulk_updates')
      .update({ 
        status: 'completed',
        progress: 100,
        results: results,
        completed_at: new Date().toISOString()
      })
      .eq('id', bulkId);

  } catch (error) {
    console.error('Bulk update processing error:', error);
    
    // Mark as failed
    await supabase
      .from('bulk_updates')
      .update({ 
        status: 'failed',
        results: { error: error.message },
        completed_at: new Date().toISOString()
      })
      .eq('id', bulkId);
  }
}

/**
 * Refresh content - check for changes
 */
async function refreshContent(monitored) {
  try {
    // Fetch current snapshot
    const snapshot = await fetchContentSnapshot(monitored.url);

    // Detect changes
    const changes = detectChanges(monitored.last_snapshot, snapshot);

    // Update monitored content
    await supabase
      .from('monitored_content')
      .update({
        last_snapshot: snapshot,
        last_checked: new Date().toISOString(),
        ...(changes.hasChanges && {
          changes_detected: (monitored.changes_detected || 0) + 1,
          last_change_detected: new Date().toISOString()
        })
      })
      .eq('id', monitored.id);

    // Save change history if changes detected
    if (changes.hasChanges) {
      await supabase.from('content_changes').insert({
        monitor_id: monitored.id,
        user_id: monitored.user_id,
        url: monitored.url,
        changes: changes.details,
        snapshot_before: monitored.last_snapshot,
        snapshot_after: snapshot,
        detected_at: new Date().toISOString()
      });
    }

    return {
      success: true,
      hasChanges: changes.hasChanges,
      changeCount: changes.details.length,
      message: changes.hasChanges 
        ? `${changes.details.length} change(s) detected`
        : 'No changes detected'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Optimize content - run self-audit and get recommendations
 */
async function optimizeContent(monitored) {
  try {
    // Call self-audit API
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/audit/self-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: monitored.url })
    });

    if (!response.ok) {
      throw new Error(`Self-audit failed: ${response.status}`);
    }

    const audit = await response.json();

    return {
      success: true,
      currentScore: audit.currentScore,
      potentialScore: audit.potentialScore,
      fixCount: audit.fixes?.length || 0,
      message: `Score: ${audit.currentScore} → ${audit.potentialScore} (+${audit.potentialScore - audit.currentScore})`
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Apply fixes - run self-audit and apply all high-priority fixes
 */
async function applyFixes(monitored) {
  try {
    // Call self-audit API
    const auditResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/audit/self-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: monitored.url })
    });

    if (!auditResponse.ok) {
      throw new Error(`Self-audit failed: ${auditResponse.status}`);
    }

    const audit = await auditResponse.json();

    // Filter high-priority fixes
    const highPriorityFixes = audit.fixes?.filter(f => f.priority === 'high') || [];

    if (highPriorityFixes.length === 0) {
      return {
        success: true,
        appliedCount: 0,
        message: 'No high-priority fixes needed'
      };
    }

    // Apply fixes
    const fixResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/audit/apply-fixes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: monitored.url,
        fixes: highPriorityFixes,
        content: audit.originalContent
      })
    });

    if (!fixResponse.ok) {
      throw new Error(`Apply fixes failed: ${fixResponse.status}`);
    }

    const result = await fixResponse.json();

    return {
      success: true,
      appliedCount: highPriorityFixes.length,
      scoreImprovement: result.newScore - audit.currentScore,
      message: `Applied ${highPriorityFixes.length} fix(es), score improved by +${result.newScore - audit.currentScore}`
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Fetch content snapshot
 */
async function fetchContentSnapshot(url) {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      timeout: 30000
    })
  });

  if (!response.ok) {
    throw new Error(`Firecrawl API error: ${response.status}`);
  }

  const result = await response.json();
  const content = result.data?.markdown || '';

  return {
    content_hash: hashContent(content),
    word_count: content.split(/\s+/).length,
    heading_count: (content.match(/^#{1,6}\s/gm) || []).length,
    link_count: (content.match(/\[.*?\]\(.*?\)/g) || []).length,
    image_count: (content.match(/!\[.*?\]\(.*?\)/g) || []).length,
    last_modified: new Date().toISOString(),
    content_preview: content.substring(0, 500)
  };
}

/**
 * Detect changes between snapshots
 */
function detectChanges(oldSnapshot, newSnapshot) {
  const details = [];
  let hasChanges = false;

  if (!oldSnapshot || !newSnapshot) {
    return { hasChanges: false, details: [] };
  }

  if (oldSnapshot.content_hash !== newSnapshot.content_hash) {
    hasChanges = true;
    details.push({
      type: 'content',
      field: 'Content',
      change: 'Content modified',
      severity: 'high'
    });
  }

  const wordCountDiff = Math.abs(newSnapshot.word_count - oldSnapshot.word_count);
  const wordCountPercent = (wordCountDiff / oldSnapshot.word_count) * 100;
  if (wordCountPercent > 5) {
    hasChanges = true;
    details.push({
      type: 'word_count',
      field: 'Word Count',
      old: oldSnapshot.word_count,
      new: newSnapshot.word_count,
      change: `${wordCountDiff > 0 ? '+' : ''}${wordCountDiff} words`,
      severity: wordCountPercent > 20 ? 'high' : 'medium'
    });
  }

  return { hasChanges, details };
}

/**
 * Hash content for comparison
 */
function hashContent(content) {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}
