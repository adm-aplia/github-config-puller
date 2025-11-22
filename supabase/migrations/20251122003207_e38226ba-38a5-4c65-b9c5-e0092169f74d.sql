-- Adicionar coluna is_google_connected na tabela professional_profiles
ALTER TABLE public.professional_profiles 
ADD COLUMN is_google_connected boolean DEFAULT false;

-- Popular valores iniciais baseado nos links existentes
UPDATE public.professional_profiles pp
SET is_google_connected = EXISTS (
  SELECT 1 FROM public.google_profile_links gpl
  WHERE gpl.professional_profile_id = pp.id
);

-- Função para atualizar o status de conexão Google automaticamente
CREATE OR REPLACE FUNCTION public.update_profile_google_status()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Quando adicionar um link, marcar o perfil como conectado
    UPDATE public.professional_profiles
    SET is_google_connected = true
    WHERE id = NEW.professional_profile_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Quando remover um link, verificar se ainda existem outros links
    UPDATE public.professional_profiles
    SET is_google_connected = EXISTS (
      SELECT 1 FROM public.google_profile_links
      WHERE professional_profile_id = OLD.professional_profile_id
      AND id != OLD.id
    )
    WHERE id = OLD.professional_profile_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger para quando adicionar link Google
CREATE TRIGGER on_google_profile_link_insert
  AFTER INSERT ON public.google_profile_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_google_status();

-- Trigger para quando remover link Google
CREATE TRIGGER on_google_profile_link_delete
  AFTER DELETE ON public.google_profile_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_google_status();