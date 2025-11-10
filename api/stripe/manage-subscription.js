/**
 * RankSmart Subscription Management
 * Cancel, upgrade, downgrade subscriptions
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Route based on method
    switch (req.method) {
      case 'GET':
        return await getSubscription(user.id, res);
      case 'POST':
        return await updateSubscription(user.id, req.body, res);
      case 'DELETE':
        return await cancelSubscription(user.id, req.body, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Subscription management error:', error);
    return res.status(500).json({ 
      error: 'Failed to manage subscription',
      details: error.message 
    });
  }
}

// Get current subscription
async function getSubscription(userId, res) {
  const { data: subscription, error } = await supabase
    .from('v_user_subscriptions_summary')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  // Get usage stats
  const { data: usageStats } = await supabase
    .from('usage_logs')
    .select('feature_type, credits_used')
    .eq('user_id', userId)
    .gte('created_at', subscription.current_period_start);

  // Aggregate usage
  const usage = {
    scans: usageStats?.filter(u => u.feature_type === 'scan').reduce((sum, u) => sum + u.credits_used, 0) || 0,
    link_scans: usageStats?.filter(u => u.feature_type === 'link_scan').reduce((sum, u) => sum + u.credits_used, 0) || 0,
    monitors: usageStats?.filter(u => u.feature_type === 'monitor').reduce((sum, u) => sum + u.credits_used, 0) || 0
  };

  return res.status(200).json({
    success: true,
    subscription,
    usage
  });
}

// Update subscription (upgrade/downgrade)
async function updateSubscription(userId, body, res) {
  const { newPlanId, billingCycle } = body;

  if (!newPlanId) {
    return res.status(400).json({ error: 'New plan ID is required' });
  }

  // Get current subscription
  const { data: currentSub, error: subError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (subError || !currentSub) {
    return res.status(404).json({ error: 'Current subscription not found' });
  }

  // Get new plan details
  const { data: newPlan, error: planError } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', newPlanId)
    .eq('is_active', true)
    .single();

  if (planError || !newPlan) {
    return res.status(404).json({ error: 'New plan not found' });
  }

  // Determine new price ID
  const newPriceId = billingCycle === 'yearly' 
    ? newPlan.stripe_price_id_yearly 
    : newPlan.stripe_price_id_monthly;

  if (!newPriceId) {
    return res.status(400).json({ 
      error: `${billingCycle} billing not available for this plan` 
    });
  }

  // Update Stripe subscription
  const stripeSubscription = await stripe.subscriptions.retrieve(currentSub.stripe_subscription_id);
  
  const updatedSubscription = await stripe.subscriptions.update(
    currentSub.stripe_subscription_id,
    {
      items: [{
        id: stripeSubscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations', // Prorate the difference
      metadata: {
        user_id: userId,
        plan_id: newPlanId,
        billing_cycle: billingCycle || currentSub.billing_cycle
      }
    }
  );

  // Update database
  await supabase
    .from('user_subscriptions')
    .update({
      plan_id: newPlanId,
      billing_cycle: billingCycle || currentSub.billing_cycle,
      stripe_price_id: newPriceId,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  return res.status(200).json({
    success: true,
    message: 'Subscription updated successfully',
    subscription: updatedSubscription
  });
}

// Cancel subscription
async function cancelSubscription(userId, body, res) {
  const { immediately = false, reason } = body;

  // Get current subscription
  const { data: currentSub, error: subError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (subError || !currentSub) {
    return res.status(404).json({ error: 'Subscription not found' });
  }

  if (!currentSub.stripe_subscription_id) {
    return res.status(400).json({ error: 'No active Stripe subscription' });
  }

  // Cancel in Stripe
  let canceledSubscription;
  if (immediately) {
    // Cancel immediately
    canceledSubscription = await stripe.subscriptions.cancel(currentSub.stripe_subscription_id);
  } else {
    // Cancel at period end
    canceledSubscription = await stripe.subscriptions.update(
      currentSub.stripe_subscription_id,
      {
        cancel_at_period_end: true,
        cancellation_details: {
          comment: reason || 'User requested cancellation'
        }
      }
    );
  }

  // Update database
  await supabase
    .from('user_subscriptions')
    .update({
      status: immediately ? 'canceled' : 'active',
      cancel_at: canceledSubscription.cancel_at 
        ? new Date(canceledSubscription.cancel_at * 1000).toISOString() 
        : null,
      canceled_at: new Date().toISOString(),
      ended_at: immediately ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  return res.status(200).json({
    success: true,
    message: immediately 
      ? 'Subscription canceled immediately' 
      : 'Subscription will cancel at period end',
    subscription: canceledSubscription
  });
}
