-- ============================================
-- WEEK 10: AI LINK OPTIMIZER DATABASE SCHEMA
-- ============================================
-- Automatic link discovery, AI content rewrites, and learning system
-- Date: November 10, 2025

-- ============================================
-- LINK SUGGESTIONS TABLE
-- ============================================
-- Stores AI-generated link suggestions for user review

CREATE TABLE IF NOT EXISTS link_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Page context
  page_url TEXT NOT NULL,
  page_title TEXT,
  page_id UUID, -- Reference to pages table if exists
  
  -- Link details
  anchor_text TEXT NOT NULL,
  target_url TEXT NOT NULL,
  link_type TEXT NOT NULL, -- 'internal', 'external', 'affiliate'
  
  -- Content context
  original_paragraph TEXT NOT NULL, -- Original content where link should be added
  context_before TEXT, -- 2-3 sentences before
  context_after TEXT, -- 2-3 sentences after
  
  -- AI-generated rewrites
  ai_rewrite_1 TEXT NOT NULL, -- Primary suggestion
  ai_rewrite_2 TEXT, -- Alternative 1
  ai_rewrite_3 TEXT, -- Alternative 2
  selected_rewrite INTEGER DEFAULT 1, -- Which rewrite user selected (1-3)
  
  -- Scoring & metadata
  confidence_score FLOAT DEFAULT 0.0, -- 0-100, AI confidence in suggestion
  seo_impact_score FLOAT DEFAULT 0.0, -- Estimated SEO impact
  relevance_score FLOAT DEFAULT 0.0, -- Content relevance score
  naturalness_score FLOAT DEFAULT 0.0, -- How natural the rewrite is
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'modified', 'applied'
  rejection_reason TEXT, -- Why user rejected (for learning)
  user_modification TEXT, -- If user edited the suggestion
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ, -- When user made decision
  applied_at TIMESTAMPTZ, -- When change was deployed
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb -- Additional data (competitor analysis, etc.)
);

-- Enable RLS
ALTER TABLE link_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own link suggestions"
  ON link_suggestions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own link suggestions"
  ON link_suggestions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own link suggestions"
  ON link_suggestions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own link suggestions"
  ON link_suggestions FOR DELETE
  USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_link_suggestions_user_id ON link_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_link_suggestions_page_url ON link_suggestions(page_url);
CREATE INDEX IF NOT EXISTS idx_link_suggestions_status ON link_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_link_suggestions_link_type ON link_suggestions(link_type);
CREATE INDEX IF NOT EXISTS idx_link_suggestions_confidence ON link_suggestions(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_link_suggestions_created_at ON link_suggestions(created_at DESC);

-- ============================================
-- LINK FEEDBACK TABLE
-- ============================================
-- Tracks user decisions for AI learning

CREATE TABLE IF NOT EXISTS link_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID NOT NULL REFERENCES link_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User action
  action TEXT NOT NULL, -- 'accept', 'reject', 'modify', 'skip'
  
  -- Modification details
  user_modification TEXT, -- User's edited version
  modification_type TEXT, -- 'anchor_text', 'content', 'both', 'none'
  
  -- Feedback
  feedback_reason TEXT, -- Why rejected/modified
  feedback_category TEXT, -- 'too_generic', 'unnatural', 'wrong_context', 'other'
  feedback_rating INTEGER, -- 1-5 stars for accepted suggestions
  
  -- Learning data
  time_to_decision INTEGER, -- Seconds taken to decide
  rewrite_selected INTEGER, -- Which AI rewrite was chosen (1-3)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE link_feedback ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own feedback"
  ON link_feedback FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own feedback"
  ON link_feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_link_feedback_suggestion_id ON link_feedback(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_link_feedback_user_id ON link_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_link_feedback_action ON link_feedback(action);
CREATE INDEX IF NOT EXISTS idx_link_feedback_created_at ON link_feedback(created_at DESC);

-- ============================================
-- LINK PERFORMANCE TABLE
-- ============================================
-- Tracks SEO impact and performance of applied links

CREATE TABLE IF NOT EXISTS link_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id UUID NOT NULL REFERENCES link_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Performance metrics
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr FLOAT DEFAULT 0.0, -- Click-through rate
  
  -- SEO impact
  rank_before INTEGER, -- Page rank before link
  rank_after INTEGER, -- Page rank after link
  rank_change INTEGER, -- Positive = improvement
  rank_impact_score FLOAT, -- Overall impact score
  
  -- Engagement metrics
  avg_time_on_page FLOAT, -- Seconds
  bounce_rate FLOAT, -- Percentage
  pages_per_session FLOAT,
  
  -- Link health
  link_status TEXT DEFAULT 'active', -- 'active', 'broken', 'redirected', 'removed'
  last_checked_at TIMESTAMPTZ,
  
  -- Timestamps
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE link_performance ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own link performance"
  ON link_performance FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own link performance"
  ON link_performance FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own link performance"
  ON link_performance FOR UPDATE
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_link_performance_suggestion_id ON link_performance(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_link_performance_user_id ON link_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_link_performance_measured_at ON link_performance(measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_performance_rank_impact ON link_performance(rank_impact_score DESC);

-- ============================================
-- SITE CRAWL RESULTS TABLE
-- ============================================
-- Stores results from full site scans

CREATE TABLE IF NOT EXISTS site_crawl_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Crawl details
  site_url TEXT NOT NULL,
  crawl_type TEXT NOT NULL, -- 'full', 'partial', 'single_page'
  pages_crawled INTEGER DEFAULT 0,
  pages_analyzed INTEGER DEFAULT 0,
  
  -- Link analysis
  total_internal_links INTEGER DEFAULT 0,
  total_external_links INTEGER DEFAULT 0,
  broken_links INTEGER DEFAULT 0,
  orphan_pages INTEGER DEFAULT 0, -- Pages with no internal links
  
  -- Opportunities found
  link_opportunities INTEGER DEFAULT 0,
  high_confidence_opportunities INTEGER DEFAULT 0,
  medium_confidence_opportunities INTEGER DEFAULT 0,
  low_confidence_opportunities INTEGER DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb -- Crawl settings, filters, etc.
);

-- Enable RLS
ALTER TABLE site_crawl_results ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own crawl results"
  ON site_crawl_results FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own crawl results"
  ON site_crawl_results FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own crawl results"
  ON site_crawl_results FOR UPDATE
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_site_crawl_results_user_id ON site_crawl_results(user_id);
CREATE INDEX IF NOT EXISTS idx_site_crawl_results_site_url ON site_crawl_results(site_url);
CREATE INDEX IF NOT EXISTS idx_site_crawl_results_status ON site_crawl_results(status);
CREATE INDEX IF NOT EXISTS idx_site_crawl_results_created_at ON site_crawl_results(created_at DESC);

-- ============================================
-- USER LINK PREFERENCES TABLE
-- ============================================
-- Stores learned user preferences for personalized suggestions

CREATE TABLE IF NOT EXISTS user_link_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Preference scores (0-100)
  prefers_internal_links INTEGER DEFAULT 50,
  prefers_external_links INTEGER DEFAULT 50,
  prefers_affiliate_links INTEGER DEFAULT 50,
  
  -- Style preferences
  preferred_anchor_style TEXT DEFAULT 'natural', -- 'natural', 'keyword_rich', 'branded'
  preferred_content_length TEXT DEFAULT 'medium', -- 'short', 'medium', 'long'
  preferred_tone TEXT DEFAULT 'professional', -- 'casual', 'professional', 'technical'
  
  -- Auto-apply settings
  auto_apply_high_confidence BOOLEAN DEFAULT false,
  auto_apply_threshold FLOAT DEFAULT 90.0, -- Only auto-apply if confidence > this
  
  -- Rejection patterns (learned from feedback)
  rejected_anchor_patterns TEXT[] DEFAULT ARRAY[]::TEXT[], -- e.g., ['click here', 'read more']
  rejected_link_types TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Acceptance patterns
  accepted_anchor_patterns TEXT[] DEFAULT ARRAY[]::TEXT[],
  preferred_link_positions TEXT[] DEFAULT ARRAY[]::TEXT[], -- e.g., ['intro', 'conclusion']
  
  -- Statistics
  total_suggestions_reviewed INTEGER DEFAULT 0,
  total_accepted INTEGER DEFAULT 0,
  total_rejected INTEGER DEFAULT 0,
  total_modified INTEGER DEFAULT 0,
  acceptance_rate FLOAT DEFAULT 0.0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE user_link_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own preferences"
  ON user_link_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
  ON user_link_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON user_link_preferences FOR UPDATE
  USING (user_id = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS idx_user_link_preferences_user_id ON user_link_preferences(user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update user preferences based on feedback
CREATE OR REPLACE FUNCTION update_user_link_preferences()
RETURNS TRIGGER AS $$
BEGIN
  -- Update preference scores based on action
  UPDATE user_link_preferences
  SET
    total_suggestions_reviewed = total_suggestions_reviewed + 1,
    total_accepted = total_accepted + CASE WHEN NEW.action = 'accept' THEN 1 ELSE 0 END,
    total_rejected = total_rejected + CASE WHEN NEW.action = 'reject' THEN 1 ELSE 0 END,
    total_modified = total_modified + CASE WHEN NEW.action = 'modify' THEN 1 ELSE 0 END,
    acceptance_rate = (total_accepted::FLOAT + CASE WHEN NEW.action = 'accept' THEN 1 ELSE 0 END) / 
                      (total_suggestions_reviewed::FLOAT + 1) * 100,
    updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  -- Create preferences record if doesn't exist
  INSERT INTO user_link_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update preferences on feedback
DROP TRIGGER IF EXISTS trigger_update_user_link_preferences ON link_feedback;
CREATE TRIGGER trigger_update_user_link_preferences
  AFTER INSERT ON link_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_user_link_preferences();

-- Function to update link suggestion status
CREATE OR REPLACE FUNCTION update_link_suggestion_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE link_suggestions
  SET
    status = CASE 
      WHEN NEW.action = 'accept' THEN 'accepted'
      WHEN NEW.action = 'reject' THEN 'rejected'
      WHEN NEW.action = 'modify' THEN 'modified'
      ELSE status
    END,
    reviewed_at = NOW(),
    user_modification = NEW.user_modification,
    rejection_reason = NEW.feedback_reason,
    updated_at = NOW()
  WHERE id = NEW.suggestion_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update suggestion status on feedback
DROP TRIGGER IF EXISTS trigger_update_link_suggestion_status ON link_feedback;
CREATE TRIGGER trigger_update_link_suggestion_status
  AFTER INSERT ON link_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_link_suggestion_status();

-- Function to calculate link performance metrics
CREATE OR REPLACE FUNCTION calculate_link_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate CTR
  IF NEW.impressions > 0 THEN
    NEW.ctr := (NEW.clicks::FLOAT / NEW.impressions::FLOAT) * 100;
  END IF;
  
  -- Calculate rank change
  IF NEW.rank_before IS NOT NULL AND NEW.rank_after IS NOT NULL THEN
    NEW.rank_change := NEW.rank_before - NEW.rank_after; -- Positive = improvement
    
    -- Calculate impact score (0-100)
    NEW.rank_impact_score := CASE
      WHEN NEW.rank_change > 0 THEN LEAST(NEW.rank_change * 5, 100) -- Cap at 100
      WHEN NEW.rank_change < 0 THEN GREATEST(NEW.rank_change * 5, -100) -- Floor at -100
      ELSE 0
    END;
  END IF;
  
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate performance metrics
DROP TRIGGER IF EXISTS trigger_calculate_link_performance ON link_performance;
CREATE TRIGGER trigger_calculate_link_performance
  BEFORE INSERT OR UPDATE ON link_performance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_link_performance();

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- View: Link suggestion summary by user
CREATE OR REPLACE VIEW v_link_suggestions_summary AS
SELECT
  user_id,
  COUNT(*) as total_suggestions,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
  COUNT(*) FILTER (WHERE status = 'modified') as modified,
  COUNT(*) FILTER (WHERE status = 'applied') as applied,
  AVG(confidence_score) as avg_confidence,
  AVG(confidence_score) FILTER (WHERE status = 'accepted') as avg_confidence_accepted,
  COUNT(*) FILTER (WHERE link_type = 'internal') as internal_links,
  COUNT(*) FILTER (WHERE link_type = 'external') as external_links,
  COUNT(*) FILTER (WHERE link_type = 'affiliate') as affiliate_links
FROM link_suggestions
GROUP BY user_id;

-- View: Top performing links
CREATE OR REPLACE VIEW v_top_performing_links AS
SELECT
  ls.id,
  ls.user_id,
  ls.page_url,
  ls.anchor_text,
  ls.target_url,
  ls.link_type,
  lp.rank_impact_score,
  lp.ctr,
  lp.clicks,
  lp.impressions,
  lp.rank_change
FROM link_suggestions ls
JOIN link_performance lp ON ls.id = lp.suggestion_id
WHERE lp.rank_impact_score > 0
ORDER BY lp.rank_impact_score DESC;

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Note: Uncomment below to insert sample data for testing
/*
INSERT INTO link_suggestions (user_id, page_url, page_title, anchor_text, target_url, link_type, original_paragraph, ai_rewrite_1, confidence_score, seo_impact_score)
VALUES (
  auth.uid(),
  'https://example.com/best-casinos',
  'Best Online Casinos 2025',
  'top-rated casino bonuses',
  'https://example.com/casino-bonuses',
  'internal',
  'Many players are looking for the best online casinos in 2025. The market is competitive and offers various options.',
  'Many players are looking for the best online casinos in 2025, especially those offering top-rated casino bonuses. The market is competitive and offers various options.',
  85.5,
  72.0
);
*/

-- ============================================
-- COMPLETION NOTES
-- ============================================
-- ✅ Link suggestions table with AI rewrites
-- ✅ Feedback tracking for learning
-- ✅ Performance monitoring
-- ✅ Site crawl results storage
-- ✅ User preference learning
-- ✅ Automatic triggers for updates
-- ✅ Analytics views
-- ✅ RLS policies for security
-- ✅ Comprehensive indexes for performance
