-- Auto-Update Monitoring Tables
-- Tracks URLs for content changes and maintains change history

-- Monitored Content Table
CREATE TABLE IF NOT EXISTS monitored_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    url TEXT NOT NULL,
    check_frequency TEXT NOT NULL DEFAULT 'daily', -- hourly, daily, weekly
    notify_on_change BOOLEAN DEFAULT true,
    status TEXT NOT NULL DEFAULT 'active', -- active, paused
    last_snapshot JSONB,
    last_checked TIMESTAMP WITH TIME ZONE,
    last_change_detected TIMESTAMP WITH TIME ZONE,
    changes_detected INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, url)
);

-- Content Changes History Table
CREATE TABLE IF NOT EXISTS content_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID NOT NULL REFERENCES monitored_content(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    url TEXT NOT NULL,
    changes JSONB NOT NULL, -- Array of change details
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed BOOLEAN DEFAULT false,
    applied BOOLEAN DEFAULT false
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monitored_content_user_id ON monitored_content(user_id);
CREATE INDEX IF NOT EXISTS idx_monitored_content_status ON monitored_content(status);
CREATE INDEX IF NOT EXISTS idx_monitored_content_check_frequency ON monitored_content(check_frequency);
CREATE INDEX IF NOT EXISTS idx_monitored_content_last_checked ON monitored_content(last_checked);
CREATE INDEX IF NOT EXISTS idx_content_changes_monitor_id ON content_changes(monitor_id);
CREATE INDEX IF NOT EXISTS idx_content_changes_user_id ON content_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_content_changes_detected_at ON content_changes(detected_at);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_monitored_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER monitored_content_updated_at
    BEFORE UPDATE ON monitored_content
    FOR EACH ROW
    EXECUTE FUNCTION update_monitored_content_timestamp();

-- Row Level Security (RLS)
ALTER TABLE monitored_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_changes ENABLE ROW LEVEL SECURITY;

-- Policies for monitored_content
CREATE POLICY "Users can view their own monitored content"
    ON monitored_content FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monitored content"
    ON monitored_content FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monitored content"
    ON monitored_content FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monitored content"
    ON monitored_content FOR DELETE
    USING (auth.uid() = user_id);

-- Policies for content_changes
CREATE POLICY "Users can view their own content changes"
    ON content_changes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own content changes"
    ON content_changes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content changes"
    ON content_changes FOR UPDATE
    USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE monitored_content IS 'Tracks URLs being monitored for content changes';
COMMENT ON TABLE content_changes IS 'History of detected content changes';
COMMENT ON COLUMN monitored_content.last_snapshot IS 'JSON snapshot of content metrics for comparison';
COMMENT ON COLUMN content_changes.changes IS 'Array of detected changes with details';
