-- Rename columns in conversations table to use patient nomenclature
ALTER TABLE public.conversations 
  RENAME COLUMN contact_name TO patient_name;

ALTER TABLE public.conversations 
  RENAME COLUMN contact_phone TO patient_phone;

ALTER TABLE public.conversations 
  RENAME COLUMN contact_avatar_url TO patient_avatar_url;