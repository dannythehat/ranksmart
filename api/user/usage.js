/**
 * Vercel Serverless Function: Usage Tracking
 * GET /api/user/usage - Get user's usage statistics
 */

import { verifyAuth, getUserProfile, getUserAudits } from '../utils/db.js';

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
    // Verify authentication
    const { error: authError, user } = await verifyAuth(req.headers.authorization);
    
    if (authError) {
      return res.status(401).json({ error: authError });
    }

    // Get user profile for quota info
    const { data: profile, error: profileError } = await getUserProfile(user.id);
    
    if (profileError) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Get recent audits for activity
    const { data: audits, error: auditsError } = await getUserAudits(user.id, 30);
    
    if (auditsError) {
      console.error('Audits fetch error:', auditsError);
    }

    // Calculate usage statistics
    const scansUsed = profile.scans_used || 0;
    const scansLimit = profile.scans_limit || 50;
    const scansRemaining = scansLimit - scansUsed;
    const usagePercentage = Math.round((scansUsed / scansLimit) * 100);

    // Calculate this month's usage
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyScans = audits?.filter(audit => 
      new Date(audit.created_at) >= monthStart
    ).length || 0;

    return res.status(200).json({
      success: true,
      usage: {
        plan: profile.plan,
        scans: {
          used: scansUsed,
          limit: scansLimit,
          remaining: scansRemaining,
          percentage: usagePercentage
        },
        monthly: {
          scans: monthlyScans,
          period: `${monthStart.toLocaleDateString()} - ${now.toLocaleDateString()}`
        },
        recent_activity: audits?.slice(0, 5).map(audit => ({
          id: audit.id,
          url: audit.url,
          score: audit.overall_score,
          created_at: audit.created_at
        })) || []
      }
    });

  } catch (error) {
    console.error('Usage error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
