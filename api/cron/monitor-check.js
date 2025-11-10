/**
 * Automated Monitoring Cron Job
 * Runs periodically to check monitored URLs for changes
 * 
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/monitor-check",
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
      skipped: 0
    };

    // Get all active monitored content
    const { data: monitored, error: fetchError } = await supabase
      .from('monitored_content')
      .select('*')
      .eq('status', 'active');

    if (fetchError) throw fetchError;

    console.log(`Found ${monitored.length} active monitors`);

    for (const monitor of monitored) {
      try {
        // Check if it's time to check based on frequency
        if (!shouldCheck(monitor, now)) {
          results.skipped++;
          continue;
        }

        // Fetch current snapshot
        const snapshot = await fetchContentSnapshot(monitor.url);

        // Detect changes
        const changes = detectChanges(monitor.last_snapshot, snapshot);

        // Update database
        const updates = {
          last_checked: now.toISOString(),
          last_snapshot: snapshot
        };

        if (changes.hasChanges) {
          updates.changes_detected = (monitor.changes_detected || 0) + 1;
          updates.last_change_detected = now.toISOString();

          // Save change history
          await supabase.from('content_changes').insert({
            monitor_id: monitor.id,
            user_id: monitor.user_id,
            url: monitor.url,
            changes: changes.details,
            snapshot_before: monitor.last_snapshot,
            snapshot_after: snapshot,
            detected_at: now.toISOString()
          });

          results.changes++;

          // Auto-apply fixes if enabled
          if (monitor.auto_update) {
            await autoApplyFixes(monitor);
          }

          // Send notification if enabled
          if (monitor.notify_on_change) {
            await sendNotification(monitor, changes);
          }
        }

        await supabase
          .from('monitored_content')
          .update(updates)
          .eq('id', monitor.id);

        results.checked++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error checking monitor ${monitor.id}:`, error);
        
        // Update error status
        await supabase
          .from('monitored_content')
          .update({
            status: 'error',
            error_message: error.message,
            last_checked: now.toISOString()
          })
          .eq('id', monitor.id);

        results.errors++;
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Monitoring check completed',
      results,
      timestamp: now.toISOString()
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
 * Check if monitor should be checked based on frequency
 */
function shouldCheck(monitor, now) {
  if (!monitor.last_checked) return true;

  const lastCheck = new Date(monitor.last_checked);
  const hoursSince = (now - lastCheck) / (1000 * 60 * 60);

  switch (monitor.check_frequency) {
    case 'hourly':
      return hoursSince >= 1;
    case 'daily':
      return hoursSince >= 24;
    case 'weekly':
      return hoursSince >= 168;
    case 'monthly':
      return hoursSince >= 720;
    default:
      return hoursSince >= 24;
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
 * Auto-apply fixes to content
 */
async function autoApplyFixes(monitor) {
  try {
    // Call self-audit API
    const auditResponse = await fetch(`${process.env.VERCEL_URL}/api/audit/self-scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: monitor.url })
    });

    if (!auditResponse.ok) return;

    const audit = await auditResponse.json();

    // Filter high-priority fixes
    const highPriorityFixes = audit.fixes?.filter(f => f.priority === 'high') || [];

    if (highPriorityFixes.length === 0) return;

    // Apply fixes
    await fetch(`${process.env.VERCEL_URL}/api/audit/apply-fixes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: monitor.url,
        fixes: highPriorityFixes,
        content: audit.originalContent
      })
    });

    console.log(`Auto-applied ${highPriorityFixes.length} fixes to ${monitor.url}`);

  } catch (error) {
    console.error('Auto-apply fixes error:', error);
  }
}

/**
 * Send notification about changes
 */
async function sendNotification(monitor, changes) {
  try {
    // TODO: Implement notification system (email, webhook, etc.)
    console.log(`Notification: ${changes.details.length} changes detected in ${monitor.url}`);
    
    // Example: Send webhook
    if (process.env.WEBHOOK_URL) {
      await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'content_change',
          monitor_id: monitor.id,
          url: monitor.url,
          changes: changes.details,
          timestamp: new Date().toISOString()
        })
      });
    }

  } catch (error) {
    console.error('Notification error:', error);
  }
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
