
ALTER TABLE public.whatsapp_instances
  ADD COLUMN IF NOT EXISTS evolution_instance_id text,
  ADD COLUMN IF NOT EXISTS evolution_instance_key text,
  ADD COLUMN IF NOT EXISTS qr_code text,
  ADD COLUMN IF NOT EXISTS webhook_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS groups_ignore boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS webhook_url text,
  ADD COLUMN IF NOT EXISTS integration_provider text DEFAULT 'evolution';

-- Observação: RLS já está habilitado na tabela e continuará se aplicando.
