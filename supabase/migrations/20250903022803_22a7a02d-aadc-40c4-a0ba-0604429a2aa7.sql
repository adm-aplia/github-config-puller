
-- Add optional avatar URL to conversations
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS contact_avatar_url text;
