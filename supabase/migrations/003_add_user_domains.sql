-- Migration: Add domains column to profiles table
-- Purpose: Store user's internal domains for URL detection
-- Date: 2025-11-10

-- Add domains column (array of text)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS domains TEXT[] DEFAULT '{}';

-- Add index for faster domain lookups
CREATE INDEX IF NOT EXISTS idx_profiles_domains ON profiles USING GIN (domains);

-- Add comment
COMMENT ON COLUMN profiles.domains IS 'Array of user domains for internal/external URL detection';

-- Example usage:
-- UPDATE profiles SET domains = ARRAY['example.com', 'mysite.io'] WHERE id = 'user-id';
-- SELECT * FROM profiles WHERE 'example.com' = ANY(domains);
