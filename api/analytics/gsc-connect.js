/**
 * Google Search Console OAuth Connection
 * Handles OAuth flow for connecting user's GSC account
 */

const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// OAuth2 Client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'https://ranksmart.vercel.app/api/analytics/gsc-callback'
);

// Scopes required for GSC
const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',
  'https://www.googleapis.com/auth/webmasters'
];

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, userId } = req.query;

    // Action: initiate - Start OAuth flow
    if (action === 'initiate') {
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      // Generate authorization URL
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        state: userId, // Pass userId in state for callback
        prompt: 'consent' // Force consent screen to get refresh token
      });

      return res.status(200).json({
        success: true,
        authUrl,
        message: 'Redirect user to this URL to authorize GSC access'
      });
    }

    // Action: status - Check connection status
    if (action === 'status') {
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      // Check if user has GSC connection
      const { data: connection, error } = await supabase
        .from('gsc_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('connected', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return res.status(200).json({
        success: true,
        connected: !!connection,
        connection: connection ? {
          propertyUrl: connection.property_url,
          lastSync: connection.last_sync,
          connectedAt: connection.created_at
        } : null
      });
    }

    // Action: disconnect - Remove GSC connection
    if (action === 'disconnect') {
      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      // Delete connection
      const { error } = await supabase
        .from('gsc_connections')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'GSC connection removed successfully'
      });
    }

    // Action: properties - List available GSC properties
    if (action === 'properties') {
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({
          success: false,
          error: 'Access token is required'
        });
      }

      // Set credentials
      oauth2Client.setCredentials({ access_token: accessToken });

      // Initialize Search Console API
      const searchconsole = google.searchconsole({
        version: 'v1',
        auth: oauth2Client
      });

      // List sites
      const response = await searchconsole.sites.list();
      const sites = response.data.siteEntry || [];

      return res.status(200).json({
        success: true,
        properties: sites.map(site => ({
          url: site.siteUrl,
          permissionLevel: site.permissionLevel
        }))
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid action. Use: initiate, status, disconnect, or properties'
    });

  } catch (error) {
    console.error('GSC Connect Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process GSC connection'
    });
  }
};
