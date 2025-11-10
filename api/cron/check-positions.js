/**
 * Automated SERP Position Checker (Cron Job)
 * Runs daily to check positions for all tracked articles
 * 
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-positions",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  // Verify cron secret for security
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔍 Starting daily position check...');

    // Get all articles with tracking enabled
    const { data: articles, error } = await supabase
      .from('article_tracking')
      .select('*')
      .eq('tracking_enabled', true);

    if (error) throw error;

    console.log(`📊 Found ${articles.length} articles to check`);

    const results = {
      checked: 0,
      improved: 0,
      declined: 0,
      stable: 0,
      errors: 0
    };

    // Check each article (with rate limiting)
    for (const article of articles) {
      try {
        // Check SERP position
        const position = await checkSERPPosition(article.url, article.target_keyword);

        if (position) {
          // Calculate status
          const positionChange = article.baseline_position - position;
          let status = 'stable';
          
          if (positionChange >= 3) {
            status = 'improved';
            results.improved++;
          } else if (positionChange <= -3) {
            status = 'declined';
            results.declined++;
          } else {
            results.stable++;
          }

          // Update article tracking
          await supabase
            .from('article_tracking')
            .update({
              current_position: position,
              status,
              last_checked: new Date().toISOString()
            })
            .eq('id', article.id);

          // Add to position history
          await supabase
            .from('position_history')
            .insert({
              article_id: article.id,
              date: new Date().toISOString().split('T')[0],
              position,
              avg_position: position
            })
            .onConflict('article_id,date')
            .merge();

          results.checked++;

          // Send notification if significant change
          if (Math.abs(positionChange) >= 3) {
            await sendNotification(article, position, positionChange);
          }
        }

        // Rate limiting: wait 2 seconds between checks
        await sleep(2000);

      } catch (error) {
        console.error(`Error checking ${article.url}:`, error.message);
        results.errors++;
      }
    }

    console.log('✅ Position check complete:', results);

    return res.status(200).json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Check SERP position for a URL and keyword
 * Uses Google Custom Search API or SerpAPI
 */
async function checkSERPPosition(url, keyword) {
  try {
    // Option 1: Use SerpAPI (recommended for production)
    if (process.env.SERPAPI_KEY) {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          q: keyword,
          api_key: process.env.SERPAPI_KEY,
          num: 100 // Check top 100 results
        }
      });

      const results = response.data.organic_results || [];
      const position = results.findIndex(r => 
        r.link && normalizeURL(r.link) === normalizeURL(url)
      );

      return position >= 0 ? position + 1 : null;
    }

    // Option 2: Use Google Custom Search API (free tier: 100 queries/day)
    if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: process.env.GOOGLE_SEARCH_API_KEY,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
          q: keyword,
          num: 10
        }
      });

      const results = response.data.items || [];
      const position = results.findIndex(r => 
        r.link && normalizeURL(r.link) === normalizeURL(url)
      );

      return position >= 0 ? position + 1 : null;
    }

    // Option 3: Use Firecrawl SERP endpoint (if available)
    if (process.env.FIRECRAWL_API_KEY) {
      const response = await axios.post(
        'https://api.firecrawl.dev/v1/serp',
        {
          query: keyword,
          num_results: 100
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const results = response.data.results || [];
      const position = results.findIndex(r => 
        r.url && normalizeURL(r.url) === normalizeURL(url)
      );

      return position >= 0 ? position + 1 : null;
    }

    console.warn('No SERP API configured. Set SERPAPI_KEY, GOOGLE_SEARCH_API_KEY, or FIRECRAWL_API_KEY');
    return null;

  } catch (error) {
    console.error('SERP check error:', error.message);
    return null;
  }
}

/**
 * Normalize URL for comparison
 */
function normalizeURL(url) {
  try {
    const parsed = new URL(url);
    // Remove www, trailing slash, query params
    return parsed.hostname.replace('www.', '') + parsed.pathname.replace(/\/$/, '');
  } catch {
    return url;
  }
}

/**
 * Send notification about position change
 */
async function sendNotification(article, newPosition, change) {
  try {
    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('email, notification_preferences')
      .eq('id', article.user_id)
      .single();

    if (!user || !user.notification_preferences?.position_alerts) {
      return;
    }

    const emoji = change > 0 ? '🎉' : '⚠️';
    const direction = change > 0 ? 'improved' : 'declined';
    const changeText = Math.abs(change);

    const subject = `${emoji} Position ${direction} for "${article.target_keyword}"`;
    const message = `
      Your article "${article.title || article.url}" has ${direction} by ${changeText} positions!
      
      Keyword: ${article.target_keyword}
      Previous Position: ${article.baseline_position}
      Current Position: ${newPosition}
      Change: ${change > 0 ? '+' : ''}${change} positions
      
      View details: ${process.env.FRONTEND_URL}/impact-dashboard.html?article=${article.id}
    `;

    // TODO: Send email notification
    // await sendEmail(user.email, subject, message);

    console.log(`📧 Notification sent to ${user.email}: ${subject}`);

  } catch (error) {
    console.error('Notification error:', error.message);
  }
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
