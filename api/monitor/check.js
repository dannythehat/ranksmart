/**
 * Change Detection API
 * Check monitored URLs for content changes
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
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
    const { monitorId, userId } = req.body;

    if (!monitorId) {
      return res.status(400).json({ error: 'monitorId required' });
    }

    // Get monitored content
    const { data: monitored, error: fetchError } = await supabase
      .from('monitored_content')
      .select('*')
      .eq('id', monitorId)
      .single();

    if (fetchError || !monitored) {
      return res.status(404).json({ error: 'Monitored content not found' });
    }

    // Verify ownership
    if (userId && monitored.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Fetch current snapshot
    const currentSnapshot = await fetchContentSnapshot(monitored.url);

    // Compare with last snapshot
    const changes = detectChanges(monitored.last_snapshot, currentSnapshot);

    // Update database
    const updates = {
      last_checked: new Date().toISOString(),
      last_snapshot: currentSnapshot
    };

    if (changes.hasChanges) {
      updates.changes_detected = (monitored.changes_detected || 0) + 1;
      updates.last_change_detected = new Date().toISOString();

      // Save change history
      await supabase.from('content_changes').insert({
        monitor_id: monitorId,
        user_id: monitored.user_id,
        url: monitored.url,
        changes: changes.details,
        detected_at: new Date().toISOString()
      });
    }

    await supabase
      .from('monitored_content')
      .update(updates)
      .eq('id', monitorId);

    return res.status(200).json({
      success: true,
      hasChanges: changes.hasChanges,
      changes: changes.details,
      snapshot: currentSnapshot,
      message: changes.hasChanges 
        ? `${changes.details.length} change(s) detected`
        : 'No changes detected'
    });

  } catch (error) {
    console.error('Change detection error:', error);
    return res.status(500).json({
      error: 'Failed to check for changes',
      details: error.message
    });
  }
}

/**
 * Fetch content snapshot
 */
async function fetchContentSnapshot(url) {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
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
      content_preview: content.substring(0, 500),
      full_content: content
    };
  } catch (error) {
    console.error('Snapshot fetch error:', error);
    return {
      error: error.message,
      content_hash: null,
      last_modified: new Date().toISOString()
    };
  }
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

  // Content hash changed
  if (oldSnapshot.content_hash !== newSnapshot.content_hash) {
    hasChanges = true;
    details.push({
      type: 'content',
      field: 'Content',
      change: 'Content has been modified',
      severity: 'high'
    });
  }

  // Word count changed significantly (>5%)
  const wordCountDiff = Math.abs(newSnapshot.word_count - oldSnapshot.word_count);
  const wordCountPercent = (wordCountDiff / oldSnapshot.word_count) * 100;
  if (wordCountPercent > 5) {
    hasChanges = true;
    details.push({
      type: 'word_count',
      field: 'Word Count',
      old: oldSnapshot.word_count,
      new: newSnapshot.word_count,
      change: `${wordCountDiff > 0 ? '+' : ''}${wordCountDiff} words (${wordCountPercent.toFixed(1)}%)`,
      severity: wordCountPercent > 20 ? 'high' : 'medium'
    });
  }

  // Heading count changed
  if (oldSnapshot.heading_count !== newSnapshot.heading_count) {
    hasChanges = true;
    const diff = newSnapshot.heading_count - oldSnapshot.heading_count;
    details.push({
      type: 'headings',
      field: 'Headings',
      old: oldSnapshot.heading_count,
      new: newSnapshot.heading_count,
      change: `${diff > 0 ? '+' : ''}${diff} headings`,
      severity: 'low'
    });
  }

  // Link count changed
  if (oldSnapshot.link_count !== newSnapshot.link_count) {
    hasChanges = true;
    const diff = newSnapshot.link_count - oldSnapshot.link_count;
    details.push({
      type: 'links',
      field: 'Links',
      old: oldSnapshot.link_count,
      new: newSnapshot.link_count,
      change: `${diff > 0 ? '+' : ''}${diff} links`,
      severity: 'low'
    });
  }

  // Image count changed
  if (oldSnapshot.image_count !== newSnapshot.image_count) {
    hasChanges = true;
    const diff = newSnapshot.image_count - oldSnapshot.image_count;
    details.push({
      type: 'images',
      field: 'Images',
      old: oldSnapshot.image_count,
      new: newSnapshot.image_count,
      change: `${diff > 0 ? '+' : ''}${diff} images`,
      severity: 'low'
    });
  }

  return { hasChanges, details };
}

/**
 * Simple hash function
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
