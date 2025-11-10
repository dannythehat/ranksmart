-- =====================================================
-- RankSmart Link Building Database Schema
-- Week 12: AI-Driven Link Building Process
-- =====================================================

-- =====================================================
-- 1. Site Content Storage
-- =====================================================
CREATE TABLE IF NOT EXISTS site_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    site_domain TEXT NOT NULL,
    page_url TEXT NOT NULL,
    page_title TEXT,
    page_content TEXT NOT NULL,
    page_html TEXT,
    word_count INTEGER,
    existing_links JSONB DEFAULT '[]'::jsonb, -- Array of existing links
    metadata JSONB DEFAULT '{}'::jsonb, -- Keywords, headings, etc.
    embedding VECTOR(1536), -- Semantic embedding for matching
    last_scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, page_url)
);

-- Index for fast lookups
CREATE INDEX idx_site_pages_user_domain ON site_pages(user_id, site_domain);
CREATE INDEX idx_site_pages_url ON site_pages(page_url);
CREATE INDEX idx_site_pages_embedding ON site_pages USING ivfflat (embedding vector_cosine_ops);

-- =====================================================
-- 2. Anchor Phrases
-- =====================================================
CREATE TABLE IF NOT EXISTS anchor_phrases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES site_pages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anchor_text TEXT NOT NULL,
    context_before TEXT, -- Text before anchor
    context_after TEXT, -- Text after anchor
    position_in_content INTEGER, -- Character position
    relevance_score FLOAT DEFAULT 0.0, -- TF-IDF or similar
    phrase_type TEXT, -- 'noun_phrase', 'named_entity', 'keyword'
    embedding VECTOR(1536), -- Semantic embedding
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_anchor_phrases_page ON anchor_phrases(page_id);
CREATE INDEX idx_anchor_phrases_user ON anchor_phrases(user_id);
CREATE INDEX idx_anchor_phrases_embedding ON anchor_phrases USING ivfflat (embedding vector_cosine_ops);

-- =====================================================
-- 3. Link Suggestions
-- =====================================================
CREATE TABLE IF NOT EXISTS link_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source_page_id UUID NOT NULL REFERENCES site_pages(id) ON DELETE CASCADE,
    target_page_id UUID REFERENCES site_pages(id) ON DELETE SET NULL, -- NULL for external links
    anchor_phrase_id UUID NOT NULL REFERENCES anchor_phrases(id) ON DELETE CASCADE,
    
    -- Link details
    link_type TEXT NOT NULL CHECK (link_type IN ('internal', 'external')),
    target_url TEXT NOT NULL,
    anchor_text TEXT NOT NULL,
    
    -- Content rewrite
    original_content TEXT NOT NULL, -- Original paragraph/section
    rewritten_content TEXT NOT NULL, -- ChatGPT-5 generated content with link
    content_position INTEGER, -- Position in page content
    
    -- Scoring
    confidence_score FLOAT DEFAULT 0.0, -- 0-1 confidence
    relevance_score FLOAT DEFAULT 0.0, -- 0-1 relevance
    seo_impact_score FLOAT DEFAULT 0.0, -- Predicted SEO impact
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied', 'failed')),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    applied_at TIMESTAMP WITH TIME ZONE,
    
    -- User feedback
    user_feedback TEXT,
    user_edited_content TEXT, -- If user manually edited
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_link_suggestions_user ON link_suggestions(user_id);
CREATE INDEX idx_link_suggestions_source ON link_suggestions(source_page_id);
CREATE INDEX idx_link_suggestions_status ON link_suggestions(status);
CREATE INDEX idx_link_suggestions_created ON link_suggestions(created_at DESC);

-- =====================================================
-- 4. Applied Links Tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS applied_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    suggestion_id UUID NOT NULL REFERENCES link_suggestions(id) ON DELETE CASCADE,
    source_page_id UUID NOT NULL REFERENCES site_pages(id) ON DELETE CASCADE,
    
    -- Link details
    link_type TEXT NOT NULL,
    target_url TEXT NOT NULL,
    anchor_text TEXT NOT NULL,
    
    -- Version control
    content_before TEXT NOT NULL,
    content_after TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    removed_at TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_applied_links_user ON applied_links(user_id);
CREATE INDEX idx_applied_links_source ON applied_links(source_page_id);
CREATE INDEX idx_applied_links_active ON applied_links(is_active);

-- =====================================================
-- 5. Link Building Scans
-- =====================================================
CREATE TABLE IF NOT EXISTS link_building_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    site_domain TEXT NOT NULL,
    
    -- Scan configuration
    scan_type TEXT DEFAULT 'full' CHECK (scan_type IN ('full', 'partial', 'new_content')),
    include_external BOOLEAN DEFAULT true,
    max_links_per_page INTEGER DEFAULT 5,
    
    -- Scan results
    pages_scanned INTEGER DEFAULT 0,
    anchors_extracted INTEGER DEFAULT 0,
    suggestions_generated INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_link_scans_user ON link_building_scans(user_id);
CREATE INDEX idx_link_scans_status ON link_building_scans(status);
CREATE INDEX idx_link_scans_created ON link_building_scans(created_at DESC);

-- =====================================================
-- 6. User Preferences & Automation Rules
-- =====================================================
CREATE TABLE IF NOT EXISTS link_building_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- General preferences
    auto_approve_internal BOOLEAN DEFAULT false,
    auto_approve_external BOOLEAN DEFAULT false,
    min_confidence_threshold FLOAT DEFAULT 0.7,
    max_links_per_page INTEGER DEFAULT 5,
    
    -- Link density control
    max_link_density_percent FLOAT DEFAULT 2.0, -- Max 2% of content as links
    avoid_duplicate_targets BOOLEAN DEFAULT true,
    
    -- Content preferences
    preserve_tone BOOLEAN DEFAULT true,
    maintain_readability BOOLEAN DEFAULT true,
    
    -- Automation rules
    always_approve_domains TEXT[] DEFAULT ARRAY[]::TEXT[], -- Auto-approve these domains
    never_link_domains TEXT[] DEFAULT ARRAY[]::TEXT[], -- Never link to these
    
    -- Notification preferences
    notify_on_suggestions BOOLEAN DEFAULT true,
    notify_on_applied BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- =====================================================
-- 7. Link Building Analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS link_building_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    site_domain TEXT NOT NULL,
    
    -- Date tracking
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Metrics
    total_internal_links INTEGER DEFAULT 0,
    total_external_links INTEGER DEFAULT 0,
    links_added_today INTEGER DEFAULT 0,
    links_removed_today INTEGER DEFAULT 0,
    
    -- Suggestions
    suggestions_generated INTEGER DEFAULT 0,
    suggestions_approved INTEGER DEFAULT 0,
    suggestions_rejected INTEGER DEFAULT 0,
    approval_rate FLOAT DEFAULT 0.0,
    
    -- SEO impact
    avg_confidence_score FLOAT DEFAULT 0.0,
    avg_relevance_score FLOAT DEFAULT 0.0,
    pages_improved INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, site_domain, date)
);

-- Index
CREATE INDEX idx_link_analytics_user_date ON link_building_analytics(user_id, date DESC);

-- =====================================================
-- Row-Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE anchor_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE applied_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_building_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_building_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_building_analytics ENABLE ROW LEVEL SECURITY;

-- Site Pages Policies
CREATE POLICY "Users can view their own site pages"
    ON site_pages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own site pages"
    ON site_pages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own site pages"
    ON site_pages FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own site pages"
    ON site_pages FOR DELETE
    USING (auth.uid() = user_id);

-- Anchor Phrases Policies
CREATE POLICY "Users can view their own anchor phrases"
    ON anchor_phrases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own anchor phrases"
    ON anchor_phrases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Link Suggestions Policies
CREATE POLICY "Users can view their own link suggestions"
    ON link_suggestions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own link suggestions"
    ON link_suggestions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own link suggestions"
    ON link_suggestions FOR UPDATE
    USING (auth.uid() = user_id);

-- Applied Links Policies
CREATE POLICY "Users can view their own applied links"
    ON applied_links FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own applied links"
    ON applied_links FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applied links"
    ON applied_links FOR UPDATE
    USING (auth.uid() = user_id);

-- Link Building Scans Policies
CREATE POLICY "Users can view their own scans"
    ON link_building_scans FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scans"
    ON link_building_scans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scans"
    ON link_building_scans FOR UPDATE
    USING (auth.uid() = user_id);

-- Preferences Policies
CREATE POLICY "Users can view their own preferences"
    ON link_building_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON link_building_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON link_building_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- Analytics Policies
CREATE POLICY "Users can view their own analytics"
    ON link_building_analytics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
    ON link_building_analytics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics"
    ON link_building_analytics FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- Triggers for automatic timestamp updates
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_site_pages_updated_at
    BEFORE UPDATE ON site_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_suggestions_updated_at
    BEFORE UPDATE ON link_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_preferences_updated_at
    BEFORE UPDATE ON link_building_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_analytics_updated_at
    BEFORE UPDATE ON link_building_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to calculate approval rate
CREATE OR REPLACE FUNCTION calculate_approval_rate(p_user_id UUID, p_site_domain TEXT)
RETURNS FLOAT AS $$
DECLARE
    total_suggestions INTEGER;
    approved_suggestions INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_suggestions
    FROM link_suggestions ls
    JOIN site_pages sp ON ls.source_page_id = sp.id
    WHERE ls.user_id = p_user_id 
    AND sp.site_domain = p_site_domain
    AND ls.status IN ('approved', 'rejected');
    
    IF total_suggestions = 0 THEN
        RETURN 0.0;
    END IF;
    
    SELECT COUNT(*) INTO approved_suggestions
    FROM link_suggestions ls
    JOIN site_pages sp ON ls.source_page_id = sp.id
    WHERE ls.user_id = p_user_id 
    AND sp.site_domain = p_site_domain
    AND ls.status = 'approved';
    
    RETURN (approved_suggestions::FLOAT / total_suggestions::FLOAT) * 100.0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Initial Data
-- =====================================================

-- Create default preferences for existing users
INSERT INTO link_building_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE site_pages IS 'Stores crawled site content with semantic embeddings';
COMMENT ON TABLE anchor_phrases IS 'Extracted anchor phrase candidates from content';
COMMENT ON TABLE link_suggestions IS 'AI-generated link insertion suggestions';
COMMENT ON TABLE applied_links IS 'Successfully applied links with version control';
COMMENT ON TABLE link_building_scans IS 'Link building scan history and status';
COMMENT ON TABLE link_building_preferences IS 'User preferences and automation rules';
COMMENT ON TABLE link_building_analytics IS 'Daily analytics for link building activity';
