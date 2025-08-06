-- Remove API keys from user_settings table for security
-- Move sensitive configuration to Supabase secrets instead

-- First, let's update the user_settings table to remove sensitive API configuration
-- Keep only user preference settings
ALTER TABLE user_settings DROP COLUMN IF EXISTS api_url;
ALTER TABLE user_settings DROP COLUMN IF EXISTS api_key;
ALTER TABLE user_settings DROP COLUMN IF EXISTS ai_provider;
ALTER TABLE user_settings DROP COLUMN IF EXISTS ai_model;

-- Add comment to document the security change
COMMENT ON TABLE user_settings IS 'Stores user preferences only. API keys and sensitive configs moved to Supabase secrets for security.';