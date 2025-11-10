-- Mode 3: Dynamic Content Monitor Schema
-- Tables for tracking content changes and automated updates

-- Create monitored_content table
CREATE TABLE IF NOT EXISTS monitored_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  check_frequency TEXT DEFAULT 'daily' CHECK (check_frequency IN ('hourly', 'daily', 'weekly', 'monthly')),
  notify_on_change BOOLEAN DEFAULT true,
  auto_update BOOLEAN DEFAULT false,
  last_snapshot JSONB,
  last_checked TIMESTAMP WITH TIME ZONE,
  last_change_detected TIMESTAMP WITH TIME ZONE,
  changes_detected INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, url)
);

-- Create content_changes table (history)
CREATE TABLE IF NOT EXISTS content_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitor_id UUID NOT NULL REFERENCES monitored_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  changes JSONB NOT NULL,
  snapshot_before JSONB,
  snapshot_after JSONB,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied BOOLEAN DEFAULT false,
  applied_at TIMESTAMP WITH TIME ZONE
);

-- Create monitoring_rules table (custom rules)
CREATE TABLE IF NOT EXISTS monitoring_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitor_id UUID NOT NULL REFERENCES monitored_content(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('keyword', 'word_count', 'heading', 'link', 'image', 'custom')),
  rule_config JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bulk_updates table (batch operations)
CREATE TABLE IF NOT EXISTS bulk_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  monitor_ids UUID[] NOT NULL,
  update_type TEXT NOT NULL CHECK (update_type IN ('refresh', 'optimize', 'fix')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_monitored_content_user_id ON monitored_content(user_id);
CREATE INDEX IF NOT EXISTS idx_monitored_content_status ON monitored_content(status);
CREATE INDEX IF NOT EXISTS idx_monitored_content_last_checked ON monitored_content(last_checked);
CREATE INDEX IF NOT EXISTS idx_content_changes_monitor_id ON content_changes(monitor_id);
CREATE INDEX IF NOT EXISTS idx_content_changes_user_id ON content_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_content_changes_detected_at ON content_changes(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_monitoring_rules_monitor_id ON monitoring_rules(monitor_id);
CREATE INDEX IF NOT EXISTS idx_bulk_updates_user_id ON bulk_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_updates_status ON bulk_updates(status);

-- Create trigger for updated_at
CREATE TRIGGER update_monitored_content_updated_at
  BEFORE UPDATE ON monitored_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE monitored_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_updates ENABLE ROW LEVEL SECURITY;

-- RLS policies for monitored_content
CREATE POLICY "Users can view own monitored content"
  ON monitored_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own monitored content"
  ON monitored_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monitored content"
  ON monitored_content FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monitored content"
  ON monitored_content FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for content_changes
CREATE POLICY "Users can view own content changes"
  ON content_changes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own content changes"
  ON content_changes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for monitoring_rules
CREATE POLICY "Users can view own monitoring rules"
  ON monitoring_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own monitoring rules"
  ON monitoring_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monitoring rules"
  ON monitoring_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monitoring rules"
  ON monitoring_rules FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for bulk_updates
CREATE POLICY "Users can view own bulk updates"
  ON bulk_updates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bulk updates"
  ON bulk_updates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bulk updates"
  ON bulk_updates FOR UPDATE
  USING (auth.uid() = user_id);
