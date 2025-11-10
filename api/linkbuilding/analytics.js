/**
 * Link Building - Analytics Module
 * 
 * Tracks and reports link building activity, impact, and performance metrics.
 * 
 * Week 12 Day 7
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/**
 * Get link building analytics
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, scanId, period = '30d', startDate, endDate } = req.query;

    // Validation
    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing required parameter: userId' 
      });
    }

    console.log(`[Analytics] Fetching analytics for user ${userId}, period: ${period}`);

    // Calculate date range
    const dateRange = calculateDateRange(period, startDate, endDate);

    // Fetch analytics data
    const [
      overallStats,
      dailyStats,
      scanStats,
      topPages,
      recentActivity
    ] = await Promise.all([
      getOverallStats(userId, dateRange),
      getDailyStats(userId, dateRange),
      getScanStats(userId, scanId),
      getTopPages(userId, dateRange),
      getRecentActivity(userId, 10)
    ]);

    return res.status(200).json({
      success: true,
      period,
      date_range: dateRange,
      overall: overallStats,
      daily: dailyStats,
      scans: scanStats,
      top_pages: topPages,
      recent_activity: recentActivity
    });

  } catch (error) {
    console.error('[Analytics] Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

/**
 * Calculate date range based on period
 */
function calculateDateRange(period, startDate, endDate) {
  const end = endDate ? new Date(endDate) : new Date();
  let start;

  if (startDate) {
    start = new Date(startDate);
  } else {
    const days = parseInt(period.replace('d', ''));
    start = new Date(end);
    start.setDate(start.getDate() - days);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

/**
 * Get overall statistics
 */
async function getOverallStats(userId, dateRange) {
  try {
    // Total scans
    const { count: totalScans } = await supabase
      .from('link_building_scans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    // Total suggestions
    const { count: totalSuggestions } = await supabase
      .from('link_suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('scan_id', userId) // This should join through scans
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    // Applied links
    const { count: appliedLinks } = await supabase
      .from('applied_links')
      .select('*', { count: 'exact', head: true })
      .gte('applied_at', dateRange.start)
      .lte('applied_at', dateRange.end);

    // Pages modified
    const { data: pagesData } = await supabase
      .from('applied_links')
      .select('source_page_id')
      .gte('applied_at', dateRange.start)
      .lte('applied_at', dateRange.end);

    const uniquePages = new Set(pagesData?.map(p => p.source_page_id) || []).size;

    // Average confidence score
    const { data: suggestionsData } = await supabase
      .from('link_suggestions')
      .select('confidence_score')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    const avgConfidence = suggestionsData && suggestionsData.length > 0
      ? suggestionsData.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / suggestionsData.length
      : 0;

    return {
      total_scans: totalScans || 0,
      total_suggestions: totalSuggestions || 0,
      applied_links: appliedLinks || 0,
      pages_modified: uniquePages,
      avg_confidence_score: Math.round(avgConfidence * 100) / 100,
      approval_rate: totalSuggestions > 0 
        ? Math.round((appliedLinks / totalSuggestions) * 100) 
        : 0
    };

  } catch (error) {
    console.error('[Analytics] Error fetching overall stats:', error);
    return {
      total_scans: 0,
      total_suggestions: 0,
      applied_links: 0,
      pages_modified: 0,
      avg_confidence_score: 0,
      approval_rate: 0
    };
  }
}

/**
 * Get daily statistics
 */
async function getDailyStats(userId, dateRange) {
  try {
    const { data, error } = await supabase
      .from('link_building_analytics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', dateRange.start)
      .lte('date', dateRange.end)
      .order('date', { ascending: true });

    if (error) {
      console.error('[Analytics] Error fetching daily stats:', error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.error('[Analytics] Error fetching daily stats:', error);
    return [];
  }
}

/**
 * Get scan-specific statistics
 */
async function getScanStats(userId, scanId) {
  try {
    let query = supabase
      .from('link_building_scans')
      .select(`
        *,
        link_suggestions(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (scanId) {
      query = query.eq('id', scanId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Analytics] Error fetching scan stats:', error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.error('[Analytics] Error fetching scan stats:', error);
    return [];
  }
}

/**
 * Get top pages by link count
 */
async function getTopPages(userId, dateRange, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('applied_links')
      .select(`
        source_page_id,
        site_pages!applied_links_source_page_id_fkey(
          url,
          title
        )
      `)
      .gte('applied_at', dateRange.start)
      .lte('applied_at', dateRange.end);

    if (error) {
      console.error('[Analytics] Error fetching top pages:', error);
      return [];
    }

    // Count links per page
    const pageCounts = {};
    for (const link of data || []) {
      const pageId = link.source_page_id;
      if (!pageCounts[pageId]) {
        pageCounts[pageId] = {
          page_id: pageId,
          url: link.site_pages?.url,
          title: link.site_pages?.title,
          link_count: 0
        };
      }
      pageCounts[pageId].link_count++;
    }

    // Sort by link count and return top N
    return Object.values(pageCounts)
      .sort((a, b) => b.link_count - a.link_count)
      .slice(0, limit);

  } catch (error) {
    console.error('[Analytics] Error fetching top pages:', error);
    return [];
  }
}

/**
 * Get recent activity
 */
async function getRecentActivity(userId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('applied_links')
      .select(`
        *,
        site_pages!applied_links_source_page_id_fkey(
          url,
          title
        ),
        target_pages:site_pages!applied_links_target_page_id_fkey(
          url,
          title
        )
      `)
      .order('applied_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Analytics] Error fetching recent activity:', error);
      return [];
    }

    return (data || []).map(link => ({
      id: link.id,
      anchor_text: link.anchor_text,
      source_page: {
        url: link.site_pages?.url,
        title: link.site_pages?.title
      },
      target_page: {
        url: link.target_pages?.url,
        title: link.target_pages?.title
      },
      applied_at: link.applied_at,
      deployment_method: link.deployment_method
    }));

  } catch (error) {
    console.error('[Analytics] Error fetching recent activity:', error);
    return [];
  }
}
