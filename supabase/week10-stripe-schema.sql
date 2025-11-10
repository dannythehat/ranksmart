-- ============================================
-- WEEK 10: STRIPE PAYMENT INTEGRATION SCHEMA
-- ============================================
-- Subscription management, payment tracking, and billing
-- Date: November 10, 2025

-- ============================================
-- SUBSCRIPTION PLANS TABLE
-- ============================================
-- Define available subscription tiers

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Plan details
  name TEXT NOT NULL UNIQUE, -- 'starter', 'professional', 'agency', 'enterprise'
  display_name TEXT NOT NULL, -- 'Starter', 'Professional', 'Agency', 'Enterprise'
  description TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2), -- Annual pricing (discounted)
  currency TEXT DEFAULT 'USD',
  
  -- Stripe IDs
  stripe_price_id_monthly TEXT, -- Stripe Price ID for monthly
  stripe_price_id_yearly TEXT, -- Stripe Price ID for yearly
  stripe_product_id TEXT, -- Stripe Product ID
  
  -- Limits & features
  scans_per_month INTEGER DEFAULT 50,
  monitors_limit INTEGER DEFAULT 0,
  team_members_limit INTEGER DEFAULT 1,
  api_access BOOLEAN DEFAULT false,
  white_label BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  
  -- Link optimizer limits
  link_scans_per_month INTEGER DEFAULT 10,
  auto_apply_links BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  features JSONB DEFAULT '[]'::jsonb, -- Array of feature descriptions
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Insert default plans
INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, scans_per_month, monitors_limit, team_members_limit, api_access, white_label, link_scans_per_month, auto_apply_links, features, sort_order)
VALUES
  ('starter', 'Starter', 'Perfect for solo creators and small sites', 49.00, 470.00, 50, 0, 1, false, false, 10, false, 
   '["50 scans per month", "Mode 1: Competitor Generator", "Mode 2: Self-Audit & Fixes", "10 link scans per month", "Email support"]'::jsonb, 1),
  
  ('professional', 'Professional', 'For power users and growing sites', 149.00, 1430.00, 200, 10, 1, true, false, 50, true,
   '["200 scans per month", "All 3 modes", "10 content monitors", "50 link scans per month", "Auto-apply links", "API access", "Priority support"]'::jsonb, 2),
  
  ('agency', 'Agency', 'For agencies managing multiple clients', 499.00, 4790.00, 999999, 100, 10, true, true, 500, true,
   '["Unlimited scans", "All 3 modes", "100 content monitors", "500 link scans per month", "Auto-apply links", "Team collaboration", "White-label reports", "API access", "Priority support"]'::jsonb, 3),
  
  ('enterprise', 'Enterprise', 'Custom solutions for large organizations', 999.00, NULL, 999999, 999999, 999999, true, true, 999999, true,
   '["Unlimited everything", "Custom limits", "Dedicated support", "SLA guarantee", "Custom integrations", "On-premise option"]'::jsonb, 4);

-- ============================================
-- USER SUBSCRIPTIONS TABLE
-- ============================================
-- Track user subscription status

CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Subscription details
  plan_id UUID REFERENCES subscription_plans(id),
  billing_cycle TEXT DEFAULT 'monthly', -- 'monthly', 'yearly'
  
  -- Stripe details
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'trialing', -- 'trialing', 'active', 'past_due', 'canceled', 'unpaid'
  
  -- Dates
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  
  -- Usage tracking
  scans_used_this_period INTEGER DEFAULT 0,
  monitors_used INTEGER DEFAULT 0,
  link_scans_used_this_period INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscription"
  ON user_subscriptions FOR UPDATE
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- ============================================
-- PAYMENT HISTORY TABLE
-- ============================================
-- Track all payment transactions

CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Stripe details
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  stripe_charge_id TEXT,
  
  -- Status
  status TEXT NOT NULL, -- 'succeeded', 'pending', 'failed', 'refunded'
  failure_reason TEXT,
  
  -- Type
  payment_type TEXT NOT NULL, -- 'subscription', 'one_time', 'refund'
  description TEXT,
  
  -- Timestamps
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own payment history"
  ON payment_history FOR SELECT
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON payment_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at DESC);

-- ============================================
-- USAGE TRACKING TABLE
-- ============================================
-- Detailed usage logs for billing and analytics

CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Usage type
  feature_type TEXT NOT NULL, -- 'scan', 'monitor', 'link_scan', 'api_call', 'content_generation'
  feature_name TEXT, -- Specific feature used
  
  -- Resource details
  resource_url TEXT, -- URL being analyzed
  resource_id UUID, -- Reference to specific resource
  
  -- Consumption
  credits_used INTEGER DEFAULT 1,
  
  -- Result
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb -- Request details, response time, etc.
);

-- Enable RLS
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own usage logs"
  ON usage_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own usage logs"
  ON usage_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_feature_type ON usage_logs(feature_type);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);

-- ============================================
-- PROMO CODES TABLE
-- ============================================
-- Discount codes and promotions

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Code details
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Discount
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed_amount'
  discount_value DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  -- Stripe
  stripe_coupon_id TEXT,
  
  -- Restrictions
  max_redemptions INTEGER, -- NULL = unlimited
  redemptions_count INTEGER DEFAULT 0,
  applies_to_plans TEXT[], -- NULL = all plans
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes(is_active);

-- ============================================
-- PROMO CODE REDEMPTIONS TABLE
-- ============================================
-- Track who used which promo codes

CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  
  -- Discount applied
  discount_amount DECIMAL(10,2),
  
  -- Timestamps
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(promo_code_id, user_id) -- One redemption per user per code
);

-- Enable RLS
ALTER TABLE promo_code_redemptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own redemptions"
  ON promo_code_redemptions FOR SELECT
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promo_code_redemptions_user_id ON promo_code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_redemptions_promo_code_id ON promo_code_redemptions(promo_code_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to reset usage counters at period start
CREATE OR REPLACE FUNCTION reset_usage_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_period_start > OLD.current_period_start THEN
    NEW.scans_used_this_period := 0;
    NEW.link_scans_used_this_period := 0;
  END IF;
  
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to reset usage on new billing period
DROP TRIGGER IF EXISTS trigger_reset_usage_counters ON user_subscriptions;
CREATE TRIGGER trigger_reset_usage_counters
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION reset_usage_counters();

-- Function to increment usage counter
CREATE OR REPLACE FUNCTION increment_usage_counter()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment appropriate counter based on feature type
  UPDATE user_subscriptions
  SET
    scans_used_this_period = scans_used_this_period + 
      CASE WHEN NEW.feature_type = 'scan' THEN NEW.credits_used ELSE 0 END,
    link_scans_used_this_period = link_scans_used_this_period + 
      CASE WHEN NEW.feature_type = 'link_scan' THEN NEW.credits_used ELSE 0 END,
    monitors_used = monitors_used + 
      CASE WHEN NEW.feature_type = 'monitor' THEN NEW.credits_used ELSE 0 END,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment usage on log insert
DROP TRIGGER IF EXISTS trigger_increment_usage_counter ON usage_logs;
CREATE TRIGGER trigger_increment_usage_counter
  AFTER INSERT ON usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION increment_usage_counter();

-- Function to update promo code redemption count
CREATE OR REPLACE FUNCTION update_promo_redemption_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE promo_codes
  SET
    redemptions_count = redemptions_count + 1,
    updated_at = NOW()
  WHERE id = NEW.promo_code_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update redemption count
DROP TRIGGER IF EXISTS trigger_update_promo_redemption_count ON promo_code_redemptions;
CREATE TRIGGER trigger_update_promo_redemption_count
  AFTER INSERT ON promo_code_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION update_promo_redemption_count();

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- View: User subscription summary with plan details
CREATE OR REPLACE VIEW v_user_subscriptions_summary AS
SELECT
  us.user_id,
  us.status,
  us.billing_cycle,
  sp.name as plan_name,
  sp.display_name as plan_display_name,
  sp.price_monthly,
  sp.price_yearly,
  us.scans_used_this_period,
  sp.scans_per_month as scans_limit,
  us.link_scans_used_this_period,
  sp.link_scans_per_month as link_scans_limit,
  us.monitors_used,
  sp.monitors_limit,
  us.current_period_start,
  us.current_period_end,
  us.trial_ends_at
FROM user_subscriptions us
LEFT JOIN subscription_plans sp ON us.plan_id = sp.id;

-- View: Revenue analytics
CREATE OR REPLACE VIEW v_revenue_analytics AS
SELECT
  DATE_TRUNC('month', paid_at) as month,
  COUNT(*) as total_payments,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_payment,
  COUNT(*) FILTER (WHERE status = 'succeeded') as successful_payments,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_payments,
  COUNT(*) FILTER (WHERE payment_type = 'subscription') as subscription_payments,
  COUNT(*) FILTER (WHERE payment_type = 'refund') as refunds
FROM payment_history
WHERE paid_at IS NOT NULL
GROUP BY DATE_TRUNC('month', paid_at)
ORDER BY month DESC;

-- View: Usage analytics by feature
CREATE OR REPLACE VIEW v_usage_analytics AS
SELECT
  feature_type,
  COUNT(*) as total_uses,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE success = true) as successful_uses,
  COUNT(*) FILTER (WHERE success = false) as failed_uses,
  DATE_TRUNC('day', created_at) as day
FROM usage_logs
GROUP BY feature_type, DATE_TRUNC('day', created_at)
ORDER BY day DESC, total_uses DESC;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if user has reached usage limit
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_used INTEGER;
BEGIN
  -- Get limit and usage based on feature type
  SELECT
    CASE
      WHEN p_feature_type = 'scan' THEN sp.scans_per_month
      WHEN p_feature_type = 'link_scan' THEN sp.link_scans_per_month
      WHEN p_feature_type = 'monitor' THEN sp.monitors_limit
      ELSE 999999
    END,
    CASE
      WHEN p_feature_type = 'scan' THEN us.scans_used_this_period
      WHEN p_feature_type = 'link_scan' THEN us.link_scans_used_this_period
      WHEN p_feature_type = 'monitor' THEN us.monitors_used
      ELSE 0
    END
  INTO v_limit, v_used
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id;
  
  -- Return true if under limit
  RETURN v_used < v_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE PROMO CODES
-- ============================================

-- Insert sample promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_redemptions, valid_until)
VALUES
  ('LAUNCH50', 'Launch discount - 50% off first month', 'percentage', 50.00, 100, NOW() + INTERVAL '30 days'),
  ('BETA20', 'Beta tester discount - 20% off forever', 'percentage', 20.00, 50, NOW() + INTERVAL '90 days'),
  ('FRIEND25', 'Friend referral - $25 off', 'fixed_amount', 25.00, NULL, NOW() + INTERVAL '365 days');

-- ============================================
-- COMPLETION NOTES
-- ============================================
-- ✅ Subscription plans with Stripe integration
-- ✅ User subscription tracking
-- ✅ Payment history logging
-- ✅ Usage tracking and limits
-- ✅ Promo codes and redemptions
-- ✅ Automatic usage counter resets
-- ✅ Revenue and usage analytics views
-- ✅ Helper functions for limit checking
-- ✅ RLS policies for security
-- ✅ Comprehensive indexes
