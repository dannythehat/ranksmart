/**
 * Vercel Serverless Function: User Profile Management
 * GET /api/user/profile - Get user profile
 * PUT /api/user/profile - Update user profile
 */

import { verifyAuth, getUserProfile, updateUserProfile } from '../utils/db.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify authentication
    const { error: authError, user } = await verifyAuth(req.headers.authorization);
    
    if (authError) {
      return res.status(401).json({ error: authError });
    }

    // GET - Fetch user profile
    if (req.method === 'GET') {
      const { data: profile, error } = await getUserProfile(user.id);
      
      if (error) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      return res.status(200).json({
        success: true,
        profile: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          plan: profile.plan,
          scans_used: profile.scans_used,
          scans_limit: profile.scans_limit,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        }
      });
    }

    // PUT - Update user profile
    if (req.method === 'PUT') {
      const { full_name, plan } = req.body;
      
      const updates = {};
      if (full_name) updates.full_name = full_name;
      if (plan && ['starter', 'professional', 'enterprise'].includes(plan)) {
        updates.plan = plan;
        // Update scan limits based on plan
        updates.scans_limit = plan === 'starter' ? 50 : plan === 'professional' ? 200 : 999999;
      }

      const { data: profile, error } = await updateUserProfile(user.id, updates);
      
      if (error) {
        return res.status(400).json({ error: 'Failed to update profile' });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        profile
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
