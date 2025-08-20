
-- 1) Adicionar coluna em google_credentials e FK
ALTER TABLE public.google_credentials
ADD COLUMN IF NOT EXISTS professional_profile_id uuid;

ALTER TABLE public.google_credentials
ADD CONSTRAINT google_credentials_professional_profile_id_fkey
FOREIGN KEY (professional_profile_id)
REFERENCES public.professional_profiles(id)
ON DELETE SET NULL;

-- 2) Backfill: copiar o vínculo mais recente do google_profile_links
WITH latest_links AS (
  SELECT DISTINCT ON (gpl.google_credential_id)
         gpl.google_credential_id,
         gpl.professional_profile_id
  FROM public.google_profile_links gpl
  ORDER BY gpl.google_credential_id, gpl.created_at DESC
)
UPDATE public.google_credentials gc
SET professional_profile_id = ll.professional_profile_id
FROM latest_links ll
WHERE ll.google_credential_id = gc.id
  AND (gc.professional_profile_id IS NULL OR gc.professional_profile_id <> ll.professional_profile_id);

-- 3) Função + triggers para manter sincronizado
CREATE OR REPLACE FUNCTION public.sync_google_credentials_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_next uuid;
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') THEN
    UPDATE public.google_credentials
       SET professional_profile_id = NEW.professional_profile_id
     WHERE id = NEW.google_credential_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT professional_profile_id
      INTO v_next
      FROM public.google_profile_links
     WHERE google_credential_id = OLD.google_credential_id
     ORDER BY created_at DESC
     LIMIT 1;

    UPDATE public.google_credentials
       SET professional_profile_id = v_next
     WHERE id = OLD.google_credential_id;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$function$;

-- Triggers: insert, update e delete em google_profile_links
DROP TRIGGER IF EXISTS trg_sync_credentials_profile_insert ON public.google_profile_links;
CREATE TRIGGER trg_sync_credentials_profile_insert
AFTER INSERT ON public.google_profile_links
FOR EACH ROW
EXECUTE FUNCTION public.sync_google_credentials_profile();

DROP TRIGGER IF EXISTS trg_sync_credentials_profile_update ON public.google_profile_links;
CREATE TRIGGER trg_sync_credentials_profile_update
AFTER UPDATE ON public.google_profile_links
FOR EACH ROW
EXECUTE FUNCTION public.sync_google_credentials_profile();

DROP TRIGGER IF EXISTS trg_sync_credentials_profile_delete ON public.google_profile_links;
CREATE TRIGGER trg_sync_credentials_profile_delete
AFTER DELETE ON public.google_profile_links
FOR EACH ROW
EXECUTE FUNCTION public.sync_google_credentials_profile();

-- 4) Índices úteis para performance
CREATE INDEX IF NOT EXISTS idx_google_profile_links_credential_id
  ON public.google_profile_links (google_credential_id);

CREATE INDEX IF NOT EXISTS idx_google_profile_links_created_at
  ON public.google_profile_links (created_at);
