-- Analytics & Impact Tracking Schema
-- Week 11: Google Search Console Integration & SERP Tracking

-- Article Tracking Table
-- Stores baseline and current performance for each tracked article
CREATE TABLE IF NOT EXISTS article_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Article Info
  url TEXT NOT NULL,
  title TEXT,
  target_keyword TEXT NOT NULL,
  
  -- Baseline (Before Optimization)
  baseline_position INTEGER,
  baseline_impressions INTEGER DEFAULT 0,
  baseline_clicks INTEGER DEFAULT 0,
  baseline_ctr DECIMAL(5,2) DEFAULT 0,
  baseline_date TIMESTAMP WITH TIME ZONE,
  
  -- Current Performance
  current_position INTEGER,
  current_impressions INTEGER DEFAULT 0,
  current_clicks INTEGER DEFAULT 0,
  current_ctr DECIMAL(5,2) DEFAULT 0,
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Optimization Info
  optimization_date TIMESTAMP WITH TIME ZONE,
  fixes_applied INTEGER DEFAULT 0,
  mode_used TEXT, -- 'mode1', 'mode2', 'mode3'
  
  -- Status
  status TEXT DEFAULT 'tracking', -- 'tracking', 'improved', 'declined', 'stable'
  tracking_enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, url, target_keyword)
);

-- Position History Table
-- Daily snapshots of SERP positions and GSC metrics
CREATE TABLE IF NOT EXISTS position_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID NOT NULL REFERENCES article_tracking(id) ON DELETE CASCADE,
  
  -- Date
  date DATE NOT NULL,
  
  -- SERP Position
  position INTEGER,
  
  -- Google Search Console Metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  avg_position DECIMAL(5,2),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(article_id, date)
);

-- GSC Connection Table
-- Store Google Search Console OAuth tokens
CREATE TABLE IF NOT EXISTS gsc_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- GSC Property
  property_url TEXT NOT NULL, -- e.g., 'https://example.com/'
  
  -- OAuth Tokens (encrypted)
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  
  -- Status
  connected BOOLEAN DEFAULT true,
  last_sync TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, property_url)
);

-- Impact Reports Table
-- Store generated impact reports for quick access
CREATE TABLE IF NOT EXISTS impact_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Report Data
  report_type TEXT NOT NULL, -- 'weekly', 'monthly', 'custom'
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  
  -- Metrics
  total_articles INTEGER DEFAULT 0,
  articles_improved INTEGER DEFAULT 0,
  articles_declined INTEGER DEFAULT 0,
  articles_stable INTEGER DEFAULT 0,
  avg_position_change DECIMAL(5,2) DEFAULT 0,
  total_traffic_increase INTEGER DEFAULT 0,
  
  -- Report Data (JSON)
  report_data JSONB,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, report_type, date_from, date_to)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_article_tracking_user_id ON article_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_article_tracking_status ON article_tracking(status);
CREATE INDEX IF NOT EXISTS idx_article_tracking_last_checked ON article_tracking(last_checked);
CREATE INDEX IF NOT EXISTS idx_position_history_article_id ON position_history(article_id);
CREATE INDEX IF NOT EXISTS idx_position_history_date ON position_history(date);
CREATE INDEX IF NOT EXISTS idx_gsc_connections_user_id ON gsc_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_impact_reports_user_id ON impact_reports(user_id);

-- Row Level Security (RLS)
ALTER TABLE article_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own data

-- article_tracking policies
CREATE POLICY "Users can view own article tracking"
  ON article_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own article tracking"
  ON article_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own article tracking"
  ON article_tracking FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own article tracking"
  ON article_tracking FOR DELETE
  USING (auth.uid() = user_id);

-- position_history policies
CREATE POLICY "Users can view own position history"
  ON position_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM article_tracking
      WHERE article_tracking.id = position_history.article_id
      AND article_tracking.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own position history"
  ON position_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM article_tracking
      WHERE article_tracking.id = position_history.article_id
      AND article_tracking.user_id = auth.uid()
    )
  );

-- gsc_connections policies
CREATE POLICY "Users can view own GSC connections"
  ON gsc_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own GSC connections"
  ON gsc_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own GSC connections"
  ON gsc_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own GSC connections"
  ON gsc_connections FOR DELETE
  USING (auth.uid() = user_id);

-- impact_reports policies
CREATE POLICY "Users can view own impact reports"
  ON impact_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own impact reports"
  ON impact_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Functions

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_article_tracking_updated_at
  BEFORE UPDATE ON article_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gsc_connections_updated_at
  BEFORE UPDATE ON gsc_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function to calculate article status
CREATE OR REPLACE FUNCTION calculate_article_status(
  p_baseline_position INTEGER,
  p_current_position INTEGER
)
RETURNS TEXT AS $$
BEGIN
  IF p_baseline_position IS NULL OR p_current_position IS NULL THEN
    RETURN 'tracking';
  END IF;
  
  IF p_current_position < p_baseline_position - 2 THEN
    RETURN 'improved';
  ELSIF p_current_position > p_baseline_position + 2 THEN
    RETURN 'declined';
  ELSE
    RETURN 'stable';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get position change
CREATE OR REPLACE FUNCTION get_position_change(
  p_article_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  position_change INTEGER,
  impressions_change INTEGER,
  clicks_change INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(recent.position - old.position, 0)::INTEGER as position_change,
    COALESCE(recent.impressions - old.impressions, 0)::INTEGER as impressions_change,
    COALESCE(recent.clicks - old.clicks, 0)::INTEGER as clicks_change
  FROM
    (SELECT position, impressions, clicks FROM position_history 
     WHERE article_id = p_article_id 
     ORDER BY date DESC LIMIT 1) as recent,
    (SELECT position, impressions, clicks FROM position_history 
     WHERE article_id = p_article_id 
     AND date <= NOW() - INTERVAL '1 day' * p_days
     ORDER BY date DESC LIMIT 1) as old;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE article_tracking IS 'Tracks article performance before and after optimization';
COMMENT ON TABLE position_history IS 'Daily snapshots of SERP positions and GSC metrics';
COMMENT ON TABLE gsc_connections IS 'Google Search Console OAuth connections';
COMMENT ON TABLE impact_reports IS 'Generated impact reports for user dashboards';
