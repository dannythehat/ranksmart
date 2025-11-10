/**
 * RankSmart Analytics Dashboard
 * Comprehensive analytics and insights for user activity
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { timeframe = '30d' } = req.query;
    const daysAgo = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Fetch all audits for the timeframe
    const { data: audits, error: auditsError } = await supabase
      .from('audits')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (auditsError) {
      console.error('Audits fetch error:', auditsError);
    }

    // Fetch monitored content
    const { data: monitors, error: monitorsError } = await supabase
      .from('monitored_content')
      .select('*')
      .eq('user_id', user.id);

    if (monitorsError) {
      console.error('Monitors fetch error:', monitorsError);
    }

    // Fetch content changes
    const { data: changes, error: changesError } = await supabase
      .from('content_changes')
      .select('*')
      .gte('detected_at', startDate.toISOString())
      .order('detected_at', { ascending: true });

    if (changesError) {
      console.error('Changes fetch error:', changesError);
    }

    // Calculate analytics
    const analytics = calculateAnalytics(audits || [], monitors || [], changes || [], daysAgo);

    return res.status(200).json({
      success: true,
      timeframe,
      analytics
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

function calculateAnalytics(audits, monitors, changes, days) {
  // Overview stats
  const totalAudits = audits.length;
  const avgScore = audits.length > 0 
    ? audits.reduce((sum, a) => sum + (a.score || 0), 0) / audits.length 
    : 0;
  
  const activeMonitors = monitors.filter(m => m.status === 'active').length;
  const totalChanges = changes.length;

  // Score trend (daily averages)
  const scoreTrend = calculateDailyAverages(audits, days, 'score');

  // Audit volume trend
  const auditVolume = calculateDailyCounts(audits, days);

  // Top performing pages
  const topPages = audits
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 10)
    .map(a => ({
      url: a.url,
      score: a.score,
      date: a.created_at
    }));

  // Pages needing attention (lowest scores)
  const needsAttention = audits
    .filter(a => a.score < 70)
    .sort((a, b) => (a.score || 0) - (b.score || 0))
    .slice(0, 10)
    .map(a => ({
      url: a.url,
      score: a.score,
      date: a.created_at
    }));

  // Score distribution
  const scoreDistribution = {
    excellent: audits.filter(a => a.score >= 90).length,
    good: audits.filter(a => a.score >= 70 && a.score < 90).length,
    fair: audits.filter(a => a.score >= 50 && a.score < 70).length,
    poor: audits.filter(a => a.score < 50).length
  };

  // Monitor stats
  const monitorStats = {
    total: monitors.length,
    active: activeMonitors,
    paused: monitors.filter(m => m.status === 'paused').length,
    error: monitors.filter(m => m.status === 'error').length,
    changes_detected: totalChanges,
    avg_changes_per_monitor: activeMonitors > 0 ? (totalChanges / activeMonitors).toFixed(2) : 0
  };

  // Change severity breakdown
  const changeSeverity = {
    high: changes.filter(c => c.severity === 'high').length,
    medium: changes.filter(c => c.severity === 'medium').length,
    low: changes.filter(c => c.severity === 'low').length
  };

  // Recent activity
  const recentActivity = [
    ...audits.slice(-5).map(a => ({
      type: 'audit',
      url: a.url,
      score: a.score,
      date: a.created_at
    })),
    ...changes.slice(-5).map(c => ({
      type: 'change',
      severity: c.severity,
      date: c.detected_at
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  return {
    overview: {
      total_audits: totalAudits,
      average_score: Math.round(avgScore * 10) / 10,
      active_monitors: activeMonitors,
      changes_detected: totalChanges,
      score_trend: avgScore > 0 ? 'improving' : 'stable'
    },
    trends: {
      score_trend: scoreTrend,
      audit_volume: auditVolume
    },
    pages: {
      top_performing: topPages,
      needs_attention: needsAttention
    },
    score_distribution: scoreDistribution,
    monitors: monitorStats,
    changes: changeSeverity,
    recent_activity: recentActivity
  };
}

function calculateDailyAverages(audits, days, field) {
  const dailyData = {};
  const today = new Date();
  
  // Initialize all days
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyData[dateStr] = { sum: 0, count: 0 };
  }

  // Aggregate data
  audits.forEach(audit => {
    const dateStr = audit.created_at.split('T')[0];
    if (dailyData[dateStr]) {
      dailyData[dateStr].sum += audit[field] || 0;
      dailyData[dateStr].count += 1;
    }
  });

  // Calculate averages
  return Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      value: data.count > 0 ? Math.round((data.sum / data.count) * 10) / 10 : 0
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculateDailyCounts(audits, days) {
  const dailyData = {};
  const today = new Date();
  
  // Initialize all days
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyData[dateStr] = 0;
  }

  // Count audits per day
  audits.forEach(audit => {
    const dateStr = audit.created_at.split('T')[0];
    if (dailyData[dateStr] !== undefined) {
      dailyData[dateStr] += 1;
    }
  });

  return Object.entries(dailyData)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
