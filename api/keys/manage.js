/**
 * Vercel Serverless Function: API Key Management
 * GET /api/keys/manage - List user's API keys
 * POST /api/keys/manage - Create new API key
 * DELETE /api/keys/manage?id=xxx - Delete API key
 */

import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../utils/db.js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Hash API key for storage
function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Generate random API key
function generateApiKey() {
  return 'rs_' + crypto.randomBytes(32).toString('hex');
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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

    // GET - List API keys
    if (req.method === 'GET') {
      const { data: keys, error } = await supabase
        .from('api_keys')
        .select('id, name, created_at, last_used_at, expires_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: 'Failed to fetch API keys' });
      }

      return res.status(200).json({
        success: true,
        keys: keys.map(key => ({
          id: key.id,
          name: key.name,
          created_at: key.created_at,
          last_used_at: key.last_used_at,
          expires_at: key.expires_at,
          status: key.expires_at && new Date(key.expires_at) < new Date() ? 'expired' : 'active'
        }))
      });
    }

    // POST - Create new API key
    if (req.method === 'POST') {
      const { name, expires_in_days } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'API key name is required' });
      }

      // Generate new API key
      const apiKey = generateApiKey();
      const keyHash = hashApiKey(apiKey);

      // Calculate expiry date
      let expiresAt = null;
      if (expires_in_days) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expires_in_days);
      }

      // Save to database
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name,
          key_hash: keyHash,
          expires_at: expiresAt,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to create API key' });
      }

      return res.status(201).json({
        success: true,
        message: 'API key created successfully. Save it now - you won\'t see it again!',
        api_key: apiKey, // Only shown once
        key_info: {
          id: data.id,
          name: data.name,
          created_at: data.created_at,
          expires_at: data.expires_at
        }
      });
    }

    // DELETE - Delete API key
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'API key ID is required' });
      }

      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        return res.status(500).json({ error: 'Failed to delete API key' });
      }

      return res.status(200).json({
        success: true,
        message: 'API key deleted successfully'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API key management error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
