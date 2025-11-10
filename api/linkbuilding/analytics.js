/**
 * Link Building - Analytics Module
 * Track and analyze link building impact
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pageId, userId, timeRange = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    const daysAgo = parseInt(timeRange.replace('d', '')) || 30;
    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    // Build query
    let query = supabase
      .from('link_deployment_analytics')
      .select('*')
      .gte('deployed_at', startDate.toISOString())
      .order('deployed_at', { ascending: false });

    if (pageId) {
      query = query.eq('page_id', pageId);
    }

    const { data: deployments, error: fetchError } = await query;

    if (fetchError) {
      throw new Error('Failed to fetch analytics: ' + fetchError.message);
    }

    // Calculate aggregate metrics
    const totalDeployments = deployments.length;
    const totalLinksAdded = deployments.reduce((sum, d) => sum + (d.links_count || 0), 0);
    const avgLinksPerDeployment = totalDeployments > 0 
      ? Math.round(totalLinksAdded / totalDeployments) 
      : 0;

    // Calculate content changes
    const totalContentAdded = deployments.reduce((sum, d) => 
      sum + (d.content_length_after - d.content_length_before), 0
    );
    const avgContentChange = totalDeployments > 0 
      ? Math.round(totalContentAdded / totalDeployments) 
      : 0;

    // Group by page
    const pageStats = {};
    deployments.forEach(d => {
      if (!pageStats[d.page_id]) {
        pageStats[d.page_id] = {
          pageId: d.page_id,
          deployments: 0,
          linksAdded: 0,
          contentAdded: 0
        };
      }
      pageStats[d.page_id].deployments++;
      pageStats[d.page_id].linksAdded += d.links_count || 0;
      pageStats[d.page_id].contentAdded += (d.content_length_after - d.content_length_before);
    });

    const topPages = Object.values(pageStats)
      .sort((a, b) => b.linksAdded - a.linksAdded)
      .slice(0, 10);

    // Timeline data (group by day)
    const timeline = {};
    deployments.forEach(d => {
      const date = new Date(d.deployed_at).toISOString().split('T')[0];
      if (!timeline[date]) {
        timeline[date] = {
          date,
          deployments: 0,
          linksAdded: 0
        };
      }
      timeline[date].deployments++;
      timeline[date].linksAdded += d.links_count || 0;
    });

    const timelineData = Object.values(timeline).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Recent activity
    const recentActivity = deployments.slice(0, 10).map(d => ({
      deploymentId: d.deployment_id,
      pageId: d.page_id,
      linksAdded: d.links_count,
      contentChange: d.content_length_after - d.content_length_before,
      deployedAt: d.deployed_at
    }));

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalDeployments,
          totalLinksAdded,
          avgLinksPerDeployment,
          avgContentChange,
          timeRange: `${daysAgo} days`
        },
        topPages,
        timeline: timelineData,
        recentActivity,
        metadata: {
          startDate: startDate.toISOString(),
          endDate: now.toISOString(),
          generatedAt: now.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch analytics',
      details: error.message 
    });
  }
}
