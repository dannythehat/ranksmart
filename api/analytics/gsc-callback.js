/**
 * Google Search Console OAuth Callback
 * Handles OAuth callback and stores tokens
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

module.exports = async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code) {
      return res.status(400).send('Authorization code is missing');
    }

    if (!userId) {
      return res.status(400).send('User ID is missing');
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user's GSC properties
    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: oauth2Client
    });

    const response = await searchconsole.sites.list();
    const sites = response.data.siteEntry || [];

    if (sites.length === 0) {
      return res.status(400).send('No Search Console properties found for this account');
    }

    // Use the first property (or let user choose later)
    const primaryProperty = sites[0].siteUrl;

    // Calculate token expiry
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + (tokens.expiry_date || 3600));

    // Store connection in database
    const { error } = await supabase
      .from('gsc_connections')
      .upsert({
        user_id: userId,
        property_url: primaryProperty,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expiry: expiryDate.toISOString(),
        connected: true,
        last_sync: new Date().toISOString()
      }, {
        onConflict: 'user_id,property_url'
      });

    if (error) throw error;

    // Redirect back to dashboard with success message
    const redirectUrl = `${process.env.FRONTEND_URL || 'https://dannythehat.github.io/ranksmart'}/impact-dashboard.html?gsc=connected`;
    
    return res.redirect(redirectUrl);

  } catch (error) {
    console.error('GSC Callback Error:', error);
    
    // Redirect with error
    const redirectUrl = `${process.env.FRONTEND_URL || 'https://dannythehat.github.io/ranksmart'}/impact-dashboard.html?gsc=error&message=${encodeURIComponent(error.message)}`;
    
    return res.redirect(redirectUrl);
  }
};
