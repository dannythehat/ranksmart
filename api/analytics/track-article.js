/**
 * Article Tracking Management
 * Add, update, remove, and list tracked articles
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;

    // Action: add - Start tracking an article
    if (action === 'add' && req.method === 'POST') {
      const {
        userId,
        url,
        title,
        targetKeyword,
        baselinePosition,
        baselineImpressions,
        baselineClicks,
        baselineCTR,
        modeUsed
      } = req.body;

      if (!userId || !url || !targetKeyword) {
        return res.status(400).json({
          success: false,
          error: 'userId, url, and targetKeyword are required'
        });
      }

      // Insert article tracking
      const { data, error } = await supabase
        .from('article_tracking')
        .insert({
          user_id: userId,
          url,
          title,
          target_keyword: targetKeyword,
          baseline_position: baselinePosition,
          baseline_impressions: baselineImpressions || 0,
          baseline_clicks: baselineClicks || 0,
          baseline_ctr: baselineCTR || 0,
          baseline_date: new Date().toISOString(),
          current_position: baselinePosition,
          current_impressions: baselineImpressions || 0,
          current_clicks: baselineClicks || 0,
          current_ctr: baselineCTR || 0,
          mode_used: modeUsed,
          status: 'tracking',
          tracking_enabled: true
        })
        .select()
        .single();

      if (error) {
        // Check if already exists
        if (error.code === '23505') {
          return res.status(400).json({
            success: false,
            error: 'Article is already being tracked for this keyword'
          });
        }
        throw error;
      }

      // Create initial position history entry
      await supabase
        .from('position_history')
        .insert({
          article_id: data.id,
          date: new Date().toISOString().split('T')[0],
          position: baselinePosition,
          impressions: baselineImpressions || 0,
          clicks: baselineClicks || 0,
          ctr: baselineCTR || 0,
          avg_position: baselinePosition
        });

      return res.status(200).json({
        success: true,
        article: data,
        message: 'Article tracking started successfully'
      });
    }

    // Action: list - Get all tracked articles for user
    if (action === 'list' && req.method === 'GET') {
      const { userId, status, limit = 50 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required'
        });
      }

      let query = supabase
        .from('article_tracking')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(parseInt(limit));

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate stats
      const stats = {
        total: data.length,
        improved: data.filter(a => a.status === 'improved').length,
        declined: data.filter(a => a.status === 'declined').length,
        stable: data.filter(a => a.status === 'stable').length,
        tracking: data.filter(a => a.status === 'tracking').length
      };

      return res.status(200).json({
        success: true,
        articles: data,
        stats
      });
    }

    // Action: get - Get single article details with history
    if (action === 'get' && req.method === 'GET') {
      const { articleId } = req.query;

      if (!articleId) {
        return res.status(400).json({
          success: false,
          error: 'articleId is required'
        });
      }

      // Get article
      const { data: article, error: articleError } = await supabase
        .from('article_tracking')
        .select('*')
        .eq('id', articleId)
        .single();

      if (articleError) throw articleError;

      // Get position history
      const { data: history, error: historyError } = await supabase
        .from('position_history')
        .select('*')
        .eq('article_id', articleId)
        .order('date', { ascending: true });

      if (historyError) throw historyError;

      return res.status(200).json({
        success: true,
        article,
        history
      });
    }

    // Action: update - Update article tracking data
    if (action === 'update' && req.method === 'PUT') {
      const {
        articleId,
        currentPosition,
        currentImpressions,
        currentClicks,
        currentCTR,
        status
      } = req.body;

      if (!articleId) {
        return res.status(400).json({
          success: false,
          error: 'articleId is required'
        });
      }

      const updates = {
        last_checked: new Date().toISOString()
      };

      if (currentPosition !== undefined) updates.current_position = currentPosition;
      if (currentImpressions !== undefined) updates.current_impressions = currentImpressions;
      if (currentClicks !== undefined) updates.current_clicks = currentClicks;
      if (currentCTR !== undefined) updates.current_ctr = currentCTR;
      if (status) updates.status = status;

      const { data, error } = await supabase
        .from('article_tracking')
        .update(updates)
        .eq('id', articleId)
        .select()
        .single();

      if (error) throw error;

      // Add to position history if position data provided
      if (currentPosition !== undefined) {
        await supabase
          .from('position_history')
          .insert({
            article_id: articleId,
            date: new Date().toISOString().split('T')[0],
            position: currentPosition,
            impressions: currentImpressions || 0,
            clicks: currentClicks || 0,
            ctr: currentCTR || 0,
            avg_position: currentPosition
          })
          .onConflict('article_id,date')
          .merge();
      }

      return res.status(200).json({
        success: true,
        article: data,
        message: 'Article tracking updated successfully'
      });
    }

    // Action: delete - Stop tracking an article
    if (action === 'delete' && req.method === 'DELETE') {
      const { articleId } = req.body;

      if (!articleId) {
        return res.status(400).json({
          success: false,
          error: 'articleId is required'
        });
      }

      const { error } = await supabase
        .from('article_tracking')
        .delete()
        .eq('id', articleId);

      if (error) throw error;

      return res.status(200).json({
        success: true,
        message: 'Article tracking stopped successfully'
      });
    }

    // Action: toggle - Enable/disable tracking
    if (action === 'toggle' && req.method === 'PUT') {
      const { articleId, enabled } = req.body;

      if (!articleId || enabled === undefined) {
        return res.status(400).json({
          success: false,
          error: 'articleId and enabled are required'
        });
      }

      const { data, error } = await supabase
        .from('article_tracking')
        .update({ tracking_enabled: enabled })
        .eq('id', articleId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        article: data,
        message: `Tracking ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid action. Use: add, list, get, update, delete, or toggle'
    });

  } catch (error) {
    console.error('Track Article Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to manage article tracking'
    });
  }
};
