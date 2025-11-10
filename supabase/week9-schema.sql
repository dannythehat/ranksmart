-- Week 9: Enterprise Features Database Schema
-- Analytics, Team Management, API Keys, Audit History

-- ============================================
-- USER PROFILES (Enhanced)
-- ============================================

-- Add new columns to existing user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS team_id UUID;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS notification_email TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Create index for team lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_team_id ON user_profiles(team_id);

-- ============================================
-- TEAMS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'agency',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own team"
  ON teams FOR SELECT
  USING (owner_id = auth.uid() OR id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Team owners can update their team"
  ON teams FOR UPDATE
  USING (owner_id = auth.uid());

-- ============================================
-- TEAM MEMBERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- admin, editor, member, viewer
  permissions JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, suspended
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Team members can view their team"
  ON team_members FOR SELECT
  USING (user_id = auth.uid() OR team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Team admins can manage members"
  ON team_members FOR ALL
  USING (team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- ============================================
-- TEAM INVITATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '[]'::jsonb,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined, expired
  token TEXT UNIQUE,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Team members can view invitations"
  ON team_invitations FOR SELECT
  USING (team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  ) OR email = auth.email());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);

-- ============================================
-- API KEYS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the API key
  key_prefix TEXT NOT NULL, -- First 8 chars for identification
  scopes TEXT[] DEFAULT ARRAY['read'], -- read, write, admin
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active', -- active, revoked, expired
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own API keys"
  ON api_keys FOR ALL
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);

-- ============================================
-- API USAGE LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own API usage"
  ON api_usage_logs FOR SELECT
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_api_key_id ON api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);

-- ============================================
-- AUDIT HISTORY ENHANCEMENTS
-- ============================================

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audits_user_id_created_at ON audits(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audits_score ON audits(score);
CREATE INDEX IF NOT EXISTS idx_audits_url ON audits(url);

-- ============================================
-- ANALYTICS VIEWS
-- ============================================

-- Daily audit statistics view
CREATE OR REPLACE VIEW daily_audit_stats AS
SELECT 
  user_id,
  DATE(created_at) as date,
  COUNT(*) as total_audits,
  AVG(score) as avg_score,
  MIN(score) as min_score,
  MAX(score) as max_score,
  COUNT(CASE WHEN score >= 90 THEN 1 END) as excellent_count,
  COUNT(CASE WHEN score >= 70 AND score < 90 THEN 1 END) as good_count,
  COUNT(CASE WHEN score >= 50 AND score < 70 THEN 1 END) as fair_count,
  COUNT(CASE WHEN score < 50 THEN 1 END) as poor_count
FROM audits
GROUP BY user_id, DATE(created_at);

-- Monthly usage statistics view
CREATE OR REPLACE VIEW monthly_usage_stats AS
SELECT 
  user_id,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_audits,
  AVG(score) as avg_score,
  COUNT(DISTINCT url) as unique_urls
FROM audits
GROUP BY user_id, DATE_TRUNC('month', created_at);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update last_used_at for API keys
CREATE OR REPLACE FUNCTION update_api_key_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE api_keys
  SET 
    last_used_at = NOW(),
    usage_count = usage_count + 1,
    updated_at = NOW()
  WHERE id = NEW.api_key_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for API key usage tracking
DROP TRIGGER IF EXISTS trigger_update_api_key_usage ON api_usage_logs;
CREATE TRIGGER trigger_update_api_key_usage
  AFTER INSERT ON api_usage_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_api_key_usage();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_teams_updated_at ON teams;
CREATE TRIGGER trigger_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_team_members_updated_at ON team_members;
CREATE TRIGGER trigger_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_api_keys_updated_at ON api_keys;
CREATE TRIGGER trigger_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- Note: In production, this would be handled by the application
-- This is just for reference

/*
-- Create a sample team
INSERT INTO teams (name, owner_id, plan) VALUES
  ('Acme SEO Agency', 'user-uuid-here', 'agency');

-- Add team members
INSERT INTO team_members (team_id, user_id, role, permissions) VALUES
  ('team-uuid-here', 'user-uuid-here', 'admin', '["all"]'::jsonb),
  ('team-uuid-here', 'user2-uuid-here', 'editor', '["read", "write"]'::jsonb);
*/

-- ============================================
-- GRANTS
-- ============================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON api_keys TO authenticated;
GRANT SELECT, INSERT ON api_usage_logs TO authenticated;

-- Grant access to views
GRANT SELECT ON daily_audit_stats TO authenticated;
GRANT SELECT ON monthly_usage_stats TO authenticated;
