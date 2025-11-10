-- Early Access Signups Table
-- Stores beta user signups with their information

CREATE TABLE IF NOT EXISTS early_access_signups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  website TEXT,
  use_case TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'onboarded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX idx_early_access_email ON early_access_signups(email);

-- Create index on status for filtering
CREATE INDEX idx_early_access_status ON early_access_signups(status);

-- Create index on created_at for sorting
CREATE INDEX idx_early_access_created ON early_access_signups(created_at DESC);

-- Enable Row Level Security
ALTER TABLE early_access_signups ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public inserts (for signup form)
CREATE POLICY "Allow public signups" ON early_access_signups
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow service role to read all
CREATE POLICY "Allow service role to read all" ON early_access_signups
  FOR SELECT
  TO service_role
  USING (true);

-- Policy: Allow service role to update
CREATE POLICY "Allow service role to update" ON early_access_signups
  FOR UPDATE
  TO service_role
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_early_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_early_access_timestamp
  BEFORE UPDATE ON early_access_signups
  FOR EACH ROW
  EXECUTE FUNCTION update_early_access_updated_at();

-- Add comment
COMMENT ON TABLE early_access_signups IS 'Stores early access beta signups for RankSmart launch';
