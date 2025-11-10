/**
 * RankSmart Stripe Checkout Session
 * Create Stripe checkout session for subscription purchase
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { planId, billingCycle = 'monthly', promoCode, successUrl, cancelUrl } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Get or create Stripe customer
    let stripeCustomerId;
    
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingSubscription?.stripe_customer_id) {
      stripeCustomerId = existingSubscription.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
          plan_name: plan.name
        }
      });
      stripeCustomerId = customer.id;
    }

    // Determine price ID based on billing cycle
    const priceId = billingCycle === 'yearly' 
      ? plan.stripe_price_id_yearly 
      : plan.stripe_price_id_monthly;

    if (!priceId) {
      return res.status(400).json({ 
        error: `${billingCycle} billing not available for this plan` 
      });
    }

    // Build checkout session params
    const sessionParams = {
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.APP_URL}/pricing`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
        billing_cycle: billingCycle
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: planId,
          billing_cycle: billingCycle
        },
        trial_period_days: 14 // 14-day free trial
      },
      allow_promotion_codes: true
    };

    // Apply promo code if provided
    if (promoCode) {
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (promo) {
        // Check if valid
        const now = new Date();
        const validFrom = new Date(promo.valid_from);
        const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;

        if (now >= validFrom && (!validUntil || now <= validUntil)) {
          // Check redemption limit
          if (!promo.max_redemptions || promo.redemptions_count < promo.max_redemptions) {
            // Check if user already redeemed
            const { data: existingRedemption } = await supabase
              .from('promo_code_redemptions')
              .select('id')
              .eq('promo_code_id', promo.id)
              .eq('user_id', user.id)
              .single();

            if (!existingRedemption && promo.stripe_coupon_id) {
              sessionParams.discounts = [{ coupon: promo.stripe_coupon_id }];
            }
          }
        }
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Store checkout session info
    await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
        plan_id: planId,
        billing_cycle: billingCycle,
        status: 'trialing',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
      customerId: stripeCustomerId
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
}
