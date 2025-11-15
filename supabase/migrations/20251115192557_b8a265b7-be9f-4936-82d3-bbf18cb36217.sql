-- Remover a coluna antiga reminder_hours_before se existir
ALTER TABLE public.professional_profiles 
DROP COLUMN IF EXISTS reminder_hours_before;

-- Alterar a coluna custom_reminder_time para text (armazenar horários como "10:00")
ALTER TABLE public.professional_profiles 
ALTER COLUMN custom_reminder_time TYPE text USING custom_reminder_time::text;

-- Definir valor padrão como "10:00"
ALTER TABLE public.professional_profiles 
ALTER COLUMN custom_reminder_time SET DEFAULT '10:00';