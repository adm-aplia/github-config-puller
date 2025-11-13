-- Remove email column from professional_profiles table
ALTER TABLE public.professional_profiles 
DROP COLUMN IF EXISTS email;