-- Link Building Tables
-- Stores link deployment history, analytics, and version control

-- Link Deployments Table
CREATE TABLE IF NOT EXISTS link_deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    original_content TEXT NOT NULL,
    updated_content TEXT NOT NULL,
    links_added JSONB NOT NULL DEFAULT '[]'::jsonb,
    deployed_by UUID REFERENCES auth.users(id),
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'superseded', 'rolled_back')),
    rolled_back_at TIMESTAMP WITH TIME ZONE,
    rolled_back_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link Deployment Analytics Table
CREATE TABLE IF NOT EXISTS link_deployment_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID REFERENCES link_deployments(id) ON DELETE CASCADE,
    page_id TEXT NOT NULL,
    links_count INTEGER DEFAULT 0,
    content_length_before INTEGER DEFAULT 0,
    content_length_after INTEGER DEFAULT 0,
    word_count_before INTEGER DEFAULT 0,
    word_count_after INTEGER DEFAULT 0,
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link Opportunities Table (stores AI-generated opportunities)
CREATE TABLE IF NOT EXISTS link_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    page_id TEXT NOT NULL,
    content TEXT NOT NULL,
    target_page TEXT NOT NULL,
    target_url TEXT NOT NULL,
    anchor_text TEXT NOT NULL,
    context TEXT,
    relevance_score INTEGER DEFAULT 0,
    position_percentage INTEGER DEFAULT 0,
    reasoning TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deployed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link Rewrites Table (stores generated content variations)
CREATE TABLE IF NOT EXISTS link_rewrites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID REFERENCES link_opportunities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    original_content TEXT NOT NULL,
    rewritten_content TEXT NOT NULL,
    variation_number INTEGER DEFAULT 1,
    quality_score INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    link_position INTEGER DEFAULT 0,
    position_percentage INTEGER DEFAULT 0,
    is_selected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_link_deployments_page_id ON link_deployments(page_id);
CREATE INDEX IF NOT EXISTS idx_link_deployments_user_id ON link_deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_link_deployments_status ON link_deployments(status);
CREATE INDEX IF NOT EXISTS idx_link_deployments_deployed_at ON link_deployments(deployed_at DESC);

CREATE INDEX IF NOT EXISTS idx_link_analytics_deployment_id ON link_deployment_analytics(deployment_id);
CREATE INDEX IF NOT EXISTS idx_link_analytics_page_id ON link_deployment_analytics(page_id);
CREATE INDEX IF NOT EXISTS idx_link_analytics_deployed_at ON link_deployment_analytics(deployed_at DESC);

CREATE INDEX IF NOT EXISTS idx_link_opportunities_user_id ON link_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_page_id ON link_opportunities(page_id);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_status ON link_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_link_opportunities_relevance ON link_opportunities(relevance_score DESC);

CREATE INDEX IF NOT EXISTS idx_link_rewrites_opportunity_id ON link_rewrites(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_link_rewrites_user_id ON link_rewrites(user_id);

-- Row Level Security (RLS)
ALTER TABLE link_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_deployment_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_rewrites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for link_deployments
CREATE POLICY "Users can view their own deployments"
    ON link_deployments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deployments"
    ON link_deployments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deployments"
    ON link_deployments FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policies for link_deployment_analytics
CREATE POLICY "Users can view analytics for their deployments"
    ON link_deployment_analytics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM link_deployments
            WHERE link_deployments.id = link_deployment_analytics.deployment_id
            AND link_deployments.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert analytics"
    ON link_deployment_analytics FOR INSERT
    WITH CHECK (true);

-- RLS Policies for link_opportunities
CREATE POLICY "Users can view their own opportunities"
    ON link_opportunities FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own opportunities"
    ON link_opportunities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own opportunities"
    ON link_opportunities FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own opportunities"
    ON link_opportunities FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for link_rewrites
CREATE POLICY "Users can view their own rewrites"
    ON link_rewrites FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rewrites"
    ON link_rewrites FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewrites"
    ON link_rewrites FOR UPDATE
    USING (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_link_deployments_updated_at
    BEFORE UPDATE ON link_deployments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_link_opportunities_updated_at
    BEFORE UPDATE ON link_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE link_deployments IS 'Stores link deployment history with version control';
COMMENT ON TABLE link_deployment_analytics IS 'Analytics data for link deployments';
COMMENT ON TABLE link_opportunities IS 'AI-generated link insertion opportunities';
COMMENT ON TABLE link_rewrites IS 'Content variations with natural link insertions';
