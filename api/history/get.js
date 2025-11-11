/**
 * Get Single Audit
 * Retrieve complete audit details by ID
 */

const { verifyAuth, getAudit } = require('../utils/db-commonjs');

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
        message: authResult.error || 'Please log in to view audit details' 
      });
    }

    const userId = authResult.user.id;

    // Get audit ID from query
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ 
        error: 'Missing audit ID',
        message: 'Please provide an audit ID in the query parameters' 
      });
    }

    // Fetch audit from database
    const result = await getAudit(id, userId);

    if (result.error) {
      return res.status(404).json({ 
        error: 'Audit not found',
        message: result.error 
      });
    }

    if (!result.data) {
      return res.status(404).json({ 
        error: 'Audit not found',
        message: 'No audit found with the provided ID' 
      });
    }

    const audit = result.data;

    // Format response
    return res.status(200).json({
      success: true,
      audit: {
        id: audit.id,
        url: audit.url,
        title: audit.title,
        overall_score: audit.overall_score,
        created_at: audit.created_at,
        
        // Analysis data
        analysis: audit.analysis || {},
        
        // Page data
        page_data: audit.page_data || {},
        
        // SERP data (if available)
        serp_data: audit.serp_data || null,
      }
    });

  } catch (error) {
    console.error('Get audit error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
