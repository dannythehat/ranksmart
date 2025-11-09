/**
 * Content Monitoring API
 * Track URLs for content changes and trigger updates
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method } = req;

    // GET: List monitored URLs
    if (method === 'GET') {
      const { userId, status } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      let query = supabase
        .from('monitored_content')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return res.status(200).json({
        success: true,
        monitored: data,
        count: data.length
      });
    }

    // POST: Add new URL to monitor
    if (method === 'POST') {
      const { userId, url, checkFrequency = 'daily', notifyOnChange = true } = req.body;

      if (!userId || !url) {
        return res.status(400).json({ error: 'userId and url required' });
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: 'Invalid URL format' });
      }

      // Check if already monitoring
      const { data: existing } = await supabase
        .from('monitored_content')
        .select('id')
        .eq('user_id', userId)
        .eq('url', url)
        .single();

      if (existing) {
        return res.status(400).json({ error: 'URL already being monitored' });
      }

      // Fetch initial snapshot
      const snapshot = await fetchContentSnapshot(url);

      // Save to database
      const { data, error } = await supabase
        .from('monitored_content')
        .insert({
          user_id: userId,
          url,
          check_frequency: checkFrequency,
          notify_on_change: notifyOnChange,
          last_snapshot: snapshot,
          last_checked: new Date().toISOString(),
          status: 'active',
          changes_detected: 0
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        success: true,
        message: 'URL added to monitoring',
        monitored: data
      });
    }

    // PUT: Update monitoring settings
    if (method === 'PUT') {
      const { id, checkFrequency, notifyOnChange, status } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'id required' });
      }

      const updates = {};
      if (checkFrequency) updates.check_frequency = checkFrequency;
      if (notifyOnChange !== undefined) updates.notify_on_change = notifyOnChange;
      if (status) updates.status = status;

      const { data, error } = await supabase
        .from('monitored_content')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Monitoring settings updated',
        monitored: data
      });
    }

    // DELETE: Stop monitoring URL
    if (method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'id required' });
      }

      const { error } = await supabase
        .from('monitored_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Stopped monitoring URL'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Monitor API error:', error);
    return res.status(500).json({
      error: 'Failed to process monitoring request',
      details: error.message
    });
  }
}

/**
 * Fetch content snapshot for comparison
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

    // Extract key metrics for change detection
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
 * Simple hash function for content comparison
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
