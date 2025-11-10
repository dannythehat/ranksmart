/**
 * RankSmart Stripe Webhook Handler
 * Process Stripe events (payments, subscriptions, etc.)
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, need raw body for signature verification
  },
};

// Helper to get raw body
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(Buffer.from(data));
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    console.log('Stripe event received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Handle checkout session completed
async function handleCheckoutCompleted(session) {
  const userId = session.metadata.user_id;
  const planId = session.metadata.plan_id;
  const billingCycle = session.metadata.billing_cycle;

  await supabase
    .from('user_subscriptions')
    .update({
      stripe_subscription_id: session.subscription,
      stripe_price_id: session.line_items?.data[0]?.price?.id,
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  console.log(`Checkout completed for user ${userId}`);
}

// Handle subscription updates
async function handleSubscriptionUpdate(subscription) {
  const userId = subscription.metadata.user_id;

  const updateData = {
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    updated_at: new Date().toISOString()
  };

  await supabase
    .from('user_subscriptions')
    .update(updateData)
    .eq('stripe_subscription_id', subscription.id);

  console.log(`Subscription updated for ${subscription.id}: ${subscription.status}`);
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  console.log(`Subscription deleted: ${subscription.id}`);
}

// Handle successful payment
async function handleInvoicePaid(invoice) {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  // Get user from customer ID
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('user_id, id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!subscription) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Log payment
  await supabase
    .from('payment_history')
    .insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency.toUpperCase(),
      stripe_payment_intent_id: invoice.payment_intent,
      stripe_invoice_id: invoice.id,
      stripe_charge_id: invoice.charge,
      status: 'succeeded',
      payment_type: 'subscription',
      description: invoice.lines?.data[0]?.description || 'Subscription payment',
      paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString()
    });

  console.log(`Payment logged for user ${subscription.user_id}: $${invoice.amount_paid / 100}`);
}

// Handle failed payment
async function handleInvoicePaymentFailed(invoice) {
  const customerId = invoice.customer;

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('user_id, id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!subscription) return;

  // Update subscription status
  await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('id', subscription.id);

  // Log failed payment
  await supabase
    .from('payment_history')
    .insert({
      user_id: subscription.user_id,
      subscription_id: subscription.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency.toUpperCase(),
      stripe_invoice_id: invoice.id,
      status: 'failed',
      failure_reason: invoice.last_payment_error?.message || 'Payment failed',
      payment_type: 'subscription',
      description: 'Failed subscription payment'
    });

  console.log(`Payment failed for user ${subscription.user_id}`);
}

// Handle trial ending soon
async function handleTrialWillEnd(subscription) {
  const userId = subscription.metadata.user_id;

  // Could send email notification here
  console.log(`Trial ending soon for user ${userId}`);
  
  // TODO: Trigger email notification
}
