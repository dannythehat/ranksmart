/**
 * Cron Job: Check Monitored Content
 * Runs periodically to check all active monitored URLs for changes
 * 
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-monitored",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Verify cron secret for security
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date();
    const results = {
      checked: 0,
      changes: 0,
      errors: 0,
      details: []
    };

    // Get all active monitored content that needs checking
    const { data: monitored, error: fetchError } = await supabase
      .from('monitored_content')
      .select('*')
      .eq('status', 'active')
      .order('last_checked', { ascending: true, nullsFirst: true });

    if (fetchError) throw fetchError;

    console.log(`Found ${monitored.length} monitored URLs`);

    // Check each URL based on frequency
    for (const monitor of monitored) {
      try {
        if (!shouldCheck(monitor, now)) {
          continue;
        }

        results.checked++;

        // Fetch current snapshot
        const currentSnapshot = await fetchContentSnapshot(monitor.url);

        // Compare with last snapshot
        const changes = detectChanges(monitor.last_snapshot, currentSnapshot);

        // Update database
        const updates = {
          last_checked: now.toISOString(),
          last_snapshot: currentSnapshot
        };

        if (changes.hasChanges) {
          results.changes++;
          updates.changes_detected = (monitor.changes_detected || 0) + 1;
          updates.last_change_detected = now.toISOString();

          // Save change history
          await supabase.from('content_changes').insert({
            monitor_id: monitor.id,
            user_id: monitor.user_id,
            url: monitor.url,
            changes: changes.details,
            detected_at: now.toISOString()
          });

          results.details.push({
            url: monitor.url,
            changes: changes.details.length,
            severity: changes.details.some(c => c.severity === 'high') ? 'high' : 'medium'
          });
        }

        await supabase
          .from('monitored_content')
          .update(updates)
          .eq('id', monitor.id);

      } catch (error) {
        results.errors++;
        console.error(`Error checking ${monitor.url}:`, error);
      }
    }

    return res.status(200).json({
      success: true,
      timestamp: now.toISOString(),
      results
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({
      error: 'Cron job failed',
      details: error.message
    });
  }
}

/**
 * Determine if URL should be checked based on frequency
 */
function shouldCheck(monitor, now) {
  if (!monitor.last_checked) return true;

  const lastChecked = new Date(monitor.last_checked);
  const hoursSince = (now - lastChecked) / (1000 * 60 * 60);

  switch (monitor.check_frequency) {
    case 'hourly':
      return hoursSince >= 1;
    case 'daily':
      return hoursSince >= 24;
    case 'weekly':
      return hoursSince >= 168;
    default:
      return hoursSince >= 24;
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

  if (!oldSnapshot || !newSnapshot || !oldSnapshot.content_hash) {
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
