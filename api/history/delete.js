/**
 * Delete Audit(s)
 * Delete one or multiple audits from history
 */

const { verifyAuth, deleteAudit, deleteAudits } = require('../utils/db-commonjs');

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'This endpoint only accepts DELETE requests' 
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    const authResult = await verifyAuth(authHeader);

    if (authResult.error || !authResult.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: authResult.error || 'Please log in to delete audits' 
      });
    }

    const userId = authResult.user.id;

    // Get audit ID(s) from request body
    const { audit_id, audit_ids } = req.body;

    // Handle single audit deletion
    if (audit_id && !audit_ids) {
      const result = await deleteAudit(audit_id, userId);

      if (result.error) {
        return res.status(400).json({ 
          error: 'Failed to delete audit',
          message: result.error 
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Audit deleted successfully',
        deleted_count: 1
      });
    }

    // Handle multiple audit deletion
    if (audit_ids && Array.isArray(audit_ids)) {
      if (audit_ids.length === 0) {
        return res.status(400).json({ 
          error: 'Empty audit list',
          message: 'Please provide at least one audit ID to delete' 
        });
      }

      const result = await deleteAudits(audit_ids, userId);

      if (result.error) {
        return res.status(400).json({ 
          error: 'Failed to delete audits',
          message: result.error 
        });
      }

      return res.status(200).json({
        success: true,
        message: `Deleted ${result.count} audit(s) successfully`,
        deleted_count: result.count
      });
    }

    // No valid ID provided
    return res.status(400).json({ 
      error: 'Missing audit ID',
      message: 'Please provide either audit_id (single) or audit_ids (array) in the request body' 
    });

  } catch (error) {
    console.error('Delete audit error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
