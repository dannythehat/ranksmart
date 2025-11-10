/**
 * Link Building - Deployment Module
 * Applies approved links with version control and rollback capability
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      pageId, 
      originalContent, 
      updatedContent, 
      links, 
      userId,
      action = 'deploy' // deploy or rollback
    } = req.body;

    // Validation
    if (!pageId || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: pageId, userId' 
      });
    }

    if (action === 'deploy' && (!originalContent || !updatedContent || !links)) {
      return res.status(400).json({ 
        error: 'Missing required fields for deployment: originalContent, updatedContent, links' 
      });
    }

    // Handle rollback
    if (action === 'rollback') {
      // Get the latest deployment
      const { data: latestDeployment, error: fetchError } = await supabase
        .from('link_deployments')
        .select('*')
        .eq('page_id', pageId)
        .eq('status', 'active')
        .order('deployed_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !latestDeployment) {
        return res.status(404).json({ error: 'No active deployment found to rollback' });
      }

      // Mark current deployment as rolled back
      const { error: updateError } = await supabase
        .from('link_deployments')
        .update({ 
          status: 'rolled_back',
          rolled_back_at: new Date().toISOString(),
          rolled_back_by: userId
        })
        .eq('id', latestDeployment.id);

      if (updateError) {
        throw new Error('Failed to rollback deployment');
      }

      return res.status(200).json({
        success: true,
        message: 'Deployment rolled back successfully',
        data: {
          deploymentId: latestDeployment.id,
          pageId,
          originalContent: latestDeployment.original_content,
          rolledBackAt: new Date().toISOString()
        }
      });
    }

    // Handle deployment
    // Create version snapshot
    const version = {
      page_id: pageId,
      original_content: originalContent,
      updated_content: updatedContent,
      links_added: links,
      deployed_by: userId,
      deployed_at: new Date().toISOString(),
      status: 'active'
    };

    // Save to database
    const { data: deployment, error: deployError } = await supabase
      .from('link_deployments')
      .insert(version)
      .select()
      .single();

    if (deployError) {
      throw new Error('Failed to save deployment: ' + deployError.message);
    }

    // Mark previous deployments as superseded
    const { error: updatePrevError } = await supabase
      .from('link_deployments')
      .update({ status: 'superseded' })
      .eq('page_id', pageId)
      .neq('id', deployment.id)
      .eq('status', 'active');

    if (updatePrevError) {
      console.error('Failed to update previous deployments:', updatePrevError);
    }

    // Track analytics
    const analyticsData = {
      deployment_id: deployment.id,
      page_id: pageId,
      links_count: links.length,
      content_length_before: originalContent.length,
      content_length_after: updatedContent.length,
      word_count_before: originalContent.split(/\s+/).length,
      word_count_after: updatedContent.split(/\s+/).length,
      deployed_at: new Date().toISOString()
    };

    const { error: analyticsError } = await supabase
      .from('link_deployment_analytics')
      .insert(analyticsData);

    if (analyticsError) {
      console.error('Failed to save analytics:', analyticsError);
    }

    // Calculate diff stats
    const linksAdded = links.length;
    const contentLengthChange = updatedContent.length - originalContent.length;
    const wordCountChange = updatedContent.split(/\s+/).length - originalContent.split(/\s+/).length;

    return res.status(200).json({
      success: true,
      message: 'Links deployed successfully',
      data: {
        deploymentId: deployment.id,
        pageId,
        version: deployment.id,
        stats: {
          linksAdded,
          contentLengthChange,
          wordCountChange,
          deployedAt: deployment.deployed_at
        },
        rollbackAvailable: true,
        links: links.map(link => ({
          anchorText: link.anchorText,
          targetUrl: link.targetUrl,
          position: link.position
        }))
      }
    });

  } catch (error) {
    console.error('Deployment error:', error);
    return res.status(500).json({ 
      error: 'Failed to deploy links',
      details: error.message 
    });
  }
}
