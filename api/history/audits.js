/**
 * RankSmart Audit History
 * View and manage audit history with filtering and pagination
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    // GET - Fetch audit history
    if (req.method === 'GET') {
      const { 
        page = 1, 
        limit = 20,
        sort = 'created_at',
        order = 'desc',
        min_score,
        max_score,
        url_filter,
        date_from,
        date_to
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      // Build query
      let query = supabase
        .from('audits')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);

      // Apply filters
      if (min_score) {
        query = query.gte('score', parseFloat(min_score));
      }
      if (max_score) {
        query = query.lte('score', parseFloat(max_score));
      }
      if (url_filter) {
        query = query.ilike('url', `%${url_filter}%`);
      }
      if (date_from) {
        query = query.gte('created_at', date_from);
      }
      if (date_to) {
        query = query.lte('created_at', date_to);
      }

      // Apply sorting and pagination
      query = query
        .order(sort, { ascending: order === 'asc' })
        .range(offset, offset + parseInt(limit) - 1);

      const { data: audits, error, count } = await query;

      if (error) {
        return res.status(400).json({ 
          error: 'Failed to fetch audits',
          details: error.message 
        });
      }

      // Calculate summary stats
      const { data: allAudits } = await supabase
        .from('audits')
        .select('score')
        .eq('user_id', user.id);

      const avgScore = allAudits && allAudits.length > 0
        ? allAudits.reduce((sum, a) => sum + (a.score || 0), 0) / allAudits.length
        : 0;

      const scoreDistribution = {
        excellent: allAudits?.filter(a => a.score >= 90).length || 0,
        good: allAudits?.filter(a => a.score >= 70 && a.score < 90).length || 0,
        fair: allAudits?.filter(a => a.score >= 50 && a.score < 70).length || 0,
        poor: allAudits?.filter(a => a.score < 50).length || 0
      };

      return res.status(200).json({
        success: true,
        audits: audits.map(audit => ({
          id: audit.id,
          url: audit.url,
          score: audit.score,
          created_at: audit.created_at,
          eeat_score: audit.eeat_score,
          technical_score: audit.technical_score,
          has_recommendations: audit.recommendations && audit.recommendations.length > 0
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          total_pages: Math.ceil(count / parseInt(limit)),
          has_more: offset + parseInt(limit) < count
        },
        summary: {
          total_audits: count,
          average_score: Math.round(avgScore * 10) / 10,
          score_distribution: scoreDistribution
        }
      });
    }

    // DELETE - Delete audit(s)
    if (req.method === 'DELETE') {
      const { audit_ids } = req.body;

      if (!audit_ids || !Array.isArray(audit_ids) || audit_ids.length === 0) {
        return res.status(400).json({ error: 'audit_ids array is required' });
      }

      // Verify ownership and delete
      const { error } = await supabase
        .from('audits')
        .delete()
        .eq('user_id', user.id)
        .in('id', audit_ids);

      if (error) {
        return res.status(400).json({ 
          error: 'Failed to delete audits',
          details: error.message 
        });
      }

      return res.status(200).json({
        success: true,
        message: `Deleted ${audit_ids.length} audit(s)`,
        deleted_count: audit_ids.length
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Audit history error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
