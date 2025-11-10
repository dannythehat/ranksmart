/**
 * Fetch Performance Data from Google Search Console
 * Retrieves search analytics data for tracked articles
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
  process.env.GOOGLE_REDIRECT_URI
);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { userId, url, keyword, startDate, endDate } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Get GSC connection
    const { data: connection, error: connError } = await supabase
      .from('gsc_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('connected', true)
      .single();

    if (connError || !connection) {
      return res.status(400).json({
        success: false,
        error: 'Google Search Console not connected'
      });
    }

    // Check if token is expired
    const tokenExpiry = new Date(connection.token_expiry);
    const now = new Date();

    if (tokenExpiry <= now) {
      // Refresh token
      oauth2Client.setCredentials({
        refresh_token: connection.refresh_token
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update tokens in database
      const newExpiry = new Date();
      newExpiry.setSeconds(newExpiry.getSeconds() + (credentials.expiry_date || 3600));

      await supabase
        .from('gsc_connections')
        .update({
          access_token: credentials.access_token,
          token_expiry: newExpiry.toISOString()
        })
        .eq('user_id', userId);

      oauth2Client.setCredentials(credentials);
    } else {
      oauth2Client.setCredentials({
        access_token: connection.access_token
      });
    }

    // Initialize Search Console API
    const searchconsole = google.searchconsole({
      version: 'v1',
      auth: oauth2Client
    });

    // Prepare request
    const requestBody = {
      startDate: startDate || getDateDaysAgo(30),
      endDate: endDate || getDateDaysAgo(0),
      dimensions: ['date', 'query', 'page'],
      rowLimit: 25000
    };

    // Add filters if provided
    if (url) {
      requestBody.dimensionFilterGroups = [{
        filters: [{
          dimension: 'page',
          operator: 'equals',
          expression: url
        }]
      }];
    }

    if (keyword) {
      if (!requestBody.dimensionFilterGroups) {
        requestBody.dimensionFilterGroups = [{ filters: [] }];
      }
      requestBody.dimensionFilterGroups[0].filters.push({
        dimension: 'query',
        operator: 'equals',
        expression: keyword
      });
    }

    // Fetch data from GSC
    const response = await searchconsole.searchanalytics.query({
      siteUrl: connection.property_url,
      requestBody
    });

    const rows = response.data.rows || [];

    // Process data
    const processedData = processGSCData(rows);

    // Update last sync time
    await supabase
      .from('gsc_connections')
      .update({ last_sync: new Date().toISOString() })
      .eq('user_id', userId);

    return res.status(200).json({
      success: true,
      data: processedData,
      rawRows: rows.length,
      dateRange: {
        start: requestBody.startDate,
        end: requestBody.endDate
      }
    });

  } catch (error) {
    console.error('Fetch Performance Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch performance data'
    });
  }
};

// Helper: Get date N days ago in YYYY-MM-DD format
function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

// Helper: Process GSC data
function processGSCData(rows) {
  if (!rows || rows.length === 0) {
    return {
      summary: {
        totalClicks: 0,
        totalImpressions: 0,
        avgCTR: 0,
        avgPosition: 0
      },
      daily: [],
      queries: [],
      pages: []
    };
  }

  // Calculate summary
  const totalClicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const totalImpressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgPosition = rows.reduce((sum, row) => sum + row.position, 0) / rows.length;

  // Group by date
  const dailyData = {};
  rows.forEach(row => {
    const date = row.keys[0]; // First dimension is date
    if (!dailyData[date]) {
      dailyData[date] = {
        date,
        clicks: 0,
        impressions: 0,
        positions: []
      };
    }
    dailyData[date].clicks += row.clicks;
    dailyData[date].impressions += row.impressions;
    dailyData[date].positions.push(row.position);
  });

  const daily = Object.values(dailyData).map(day => ({
    date: day.date,
    clicks: day.clicks,
    impressions: day.impressions,
    ctr: day.impressions > 0 ? (day.clicks / day.impressions) * 100 : 0,
    avgPosition: day.positions.reduce((a, b) => a + b, 0) / day.positions.length
  })).sort((a, b) => a.date.localeCompare(b.date));

  // Group by query
  const queryData = {};
  rows.forEach(row => {
    const query = row.keys[1]; // Second dimension is query
    if (!queryData[query]) {
      queryData[query] = {
        query,
        clicks: 0,
        impressions: 0,
        positions: []
      };
    }
    queryData[query].clicks += row.clicks;
    queryData[query].impressions += row.impressions;
    queryData[query].positions.push(row.position);
  });

  const queries = Object.values(queryData)
    .map(q => ({
      query: q.query,
      clicks: q.clicks,
      impressions: q.impressions,
      ctr: q.impressions > 0 ? (q.clicks / q.impressions) * 100 : 0,
      avgPosition: q.positions.reduce((a, b) => a + b, 0) / q.positions.length
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 50); // Top 50 queries

  // Group by page
  const pageData = {};
  rows.forEach(row => {
    const page = row.keys[2]; // Third dimension is page
    if (!pageData[page]) {
      pageData[page] = {
        page,
        clicks: 0,
        impressions: 0,
        positions: []
      };
    }
    pageData[page].clicks += row.clicks;
    pageData[page].impressions += row.impressions;
    pageData[page].positions.push(row.position);
  });

  const pages = Object.values(pageData)
    .map(p => ({
      page: p.page,
      clicks: p.clicks,
      impressions: p.impressions,
      ctr: p.impressions > 0 ? (p.clicks / p.impressions) * 100 : 0,
      avgPosition: p.positions.reduce((a, b) => a + b, 0) / p.positions.length
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 50); // Top 50 pages

  return {
    summary: {
      totalClicks,
      totalImpressions,
      avgCTR: avgCTR.toFixed(2),
      avgPosition: avgPosition.toFixed(1)
    },
    daily,
    queries,
    pages
  };
}
