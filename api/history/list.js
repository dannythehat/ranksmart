/**
 * List Audit History
 * Get paginated list of user's audit history with filtering
 */

const { verifyAuth, getUserAudits, supabase } = require('../utils/db-commonjs');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts GET requests' 
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    const authResult = await verifyAuth(authHeader);

    if (authResult.error || !authResult.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: authResult.error || 'Please log in to view audit history' 
      });
    }

    const userId = authResult.user.id;

    // Parse query parameters
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
      .eq('user_id', userId);

    // Apply filters
    if (min_score) {
      query = query.gte('overall_score', parseFloat(min_score));
    }
    if (max_score) {
      query = query.lte('overall_score', parseFloat(max_score));
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
      console.error('List audits error:', error);
      return res.status(400).json({ 
        error: 'Failed to fetch audits',
        message: error.message 
      });
    }

    // Calculate summary stats
    const { data: allAudits } = await supabase
      .from('audits')
      .select('overall_score')
      .eq('user_id', userId);

    const avgScore = allAudits && allAudits.length > 0
      ? allAudits.reduce((sum, a) => sum + (a.overall_score || 0), 0) / allAudits.length
      : 0;

    const scoreDistribution = {
      excellent: allAudits?.filter(a => a.overall_score >= 90).length || 0,
      good: allAudits?.filter(a => a.overall_score >= 70 && a.overall_score < 90).length || 0,
      fair: allAudits?.filter(a => a.overall_score >= 50 && a.overall_score < 70).length || 0,
      poor: allAudits?.filter(a => a.overall_score < 50).length || 0
    };

    // Format audits for response
    const formattedAudits = audits.map(audit => ({
      id: audit.id,
      url: audit.url,
      title: audit.title,
      overall_score: audit.overall_score,
      created_at: audit.created_at,
      eeat_score: audit.analysis?.eeat?.overall || null,
      technical_score: audit.analysis?.technical?.overallScore || null,
      has_recommendations: audit.analysis?.eeat?.recommendations?.length > 0 || false,
      word_count: audit.page_data?.wordCount || 0,
    }));

    return res.status(200).json({
      success: true,
      audits: formattedAudits,
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

  } catch (error) {
    console.error('List audits error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
