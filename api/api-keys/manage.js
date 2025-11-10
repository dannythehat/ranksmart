/**
 * RankSmart API Key Management
 * Create, list, and revoke API keys for programmatic access
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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

    // Check if user has API access (Professional or Agency plan)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('plan')
      .eq('user_id', user.id)
      .single();

    if (!profile || !['professional', 'agency'].includes(profile.plan)) {
      return res.status(403).json({ 
        error: 'API access requires Professional or Agency plan',
        upgrade_url: '/pricing'
      });
    }

    // GET - List API keys
    if (req.method === 'GET') {
      const { data: keys, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, scopes, last_used_at, created_at, expires_at, status')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(400).json({ 
          error: 'Failed to fetch API keys',
          details: error.message 
        });
      }

      return res.status(200).json({
        success: true,
        keys: keys.map(k => ({
          id: k.id,
          name: k.name,
          key_prefix: k.key_prefix,
          scopes: k.scopes,
          last_used: k.last_used_at,
          created_at: k.created_at,
          expires_at: k.expires_at,
          status: k.status,
          is_expired: k.expires_at && new Date(k.expires_at) < new Date()
        })),
        total: keys.length
      });
    }

    // POST - Create new API key
    if (req.method === 'POST') {
      const { name, scopes = ['read'], expires_in_days = 365 } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Key name is required' });
      }

      // Validate scopes
      const validScopes = ['read', 'write', 'admin'];
      const invalidScopes = scopes.filter(s => !validScopes.includes(s));
      if (invalidScopes.length > 0) {
        return res.status(400).json({ 
          error: `Invalid scopes: ${invalidScopes.join(', ')}`,
          valid_scopes: validScopes
        });
      }

      // Generate API key
      const apiKey = generateApiKey();
      const keyHash = hashApiKey(apiKey);
      const keyPrefix = apiKey.substring(0, 8);

      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);

      // Save to database
      const { data: newKey, error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          scopes,
          expires_at: expiresAt.toISOString(),
          status: 'active'
        })
        .select('id, name, key_prefix, scopes, created_at, expires_at')
        .single();

      if (error) {
        return res.status(400).json({ 
          error: 'Failed to create API key',
          details: error.message 
        });
      }

      return res.status(201).json({
        success: true,
        message: 'API key created successfully',
        key: {
          id: newKey.id,
          name: newKey.name,
          api_key: apiKey, // Only shown once!
          key_prefix: newKey.key_prefix,
          scopes: newKey.scopes,
          created_at: newKey.created_at,
          expires_at: newKey.expires_at
        },
        warning: 'Save this API key now. You won\'t be able to see it again!'
      });
    }

    // DELETE - Revoke API key
    if (req.method === 'DELETE') {
      const { key_id } = req.body;

      if (!key_id) {
        return res.status(400).json({ error: 'key_id is required' });
      }

      // Soft delete by updating status
      const { error } = await supabase
        .from('api_keys')
        .update({ status: 'revoked' })
        .eq('id', key_id)
        .eq('user_id', user.id);

      if (error) {
        return res.status(400).json({ 
          error: 'Failed to revoke API key',
          details: error.message 
        });
      }

      return res.status(200).json({
        success: true,
        message: 'API key revoked successfully'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API key management error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

function generateApiKey() {
  // Generate a secure random API key
  // Format: rs_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  const randomBytes = crypto.randomBytes(32);
  const key = randomBytes.toString('hex');
  return `rs_live_${key}`;
}

function hashApiKey(apiKey) {
  // Hash the API key for secure storage
  return crypto
    .createHash('sha256')
    .update(apiKey)
    .digest('hex');
}
