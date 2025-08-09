-- Enable RLS and add a safe SELECT policy on google_credentials_safe
ALTER TABLE public.google_credentials_safe ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'google_credentials_safe' AND policyname = 'Users can view own sanitized google credentials'
  ) THEN
    CREATE POLICY "Users can view own sanitized google credentials"
    ON public.google_credentials_safe
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;