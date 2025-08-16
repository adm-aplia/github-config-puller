
-- 1) Guardar token de cartão do Asaas para futuras cobranças sem pedir cartão
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS asaas_card_token text;

-- 2) Corrigir a função de checagem de limites para usar contagens reais
CREATE OR REPLACE FUNCTION public.check_user_limits(p_user_id uuid, p_resource_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_limit_record RECORD;
    v_current_count INTEGER := 0;
    v_limit_value INTEGER := 0;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Buscar limites do usuário
    SELECT *
      INTO v_limit_record
      FROM public.usuario_limites 
     WHERE user_id = v_user_id;

    -- Se não houver registro de limites, usar limites do plano gratuito (fallback)
    v_limit_value := 0; -- default, será definido em cada caso

    CASE p_resource_type
        WHEN 'assistente' THEN
            SELECT COUNT(*) INTO v_current_count
              FROM public.professional_profiles
             WHERE user_id = v_user_id;

            SELECT COALESCE(v_limit_record.max_assistentes, 1) INTO v_limit_value;
            RETURN v_current_count < v_limit_value;

        WHEN 'instancia' THEN
            SELECT COUNT(*) INTO v_current_count
              FROM public.whatsapp_instances
             WHERE user_id = v_user_id;

            SELECT COALESCE(v_limit_record.max_instancias_whatsapp, 1) INTO v_limit_value;
            RETURN v_current_count < v_limit_value;

        WHEN 'conversa' THEN
            SELECT COUNT(*) INTO v_current_count
              FROM public.conversations 
             WHERE user_id = v_user_id
               AND created_at >= date_trunc('month', current_date)
               AND created_at < date_trunc('month', current_date) + interval '1 month';

            SELECT COALESCE(v_limit_record.max_conversas_mes, 100) INTO v_limit_value;
            RETURN v_current_count < v_limit_value;

        WHEN 'agendamento' THEN
            SELECT COUNT(*) INTO v_current_count
              FROM public.appointments 
             WHERE user_id = v_user_id 
               AND appointment_date >= date_trunc('month', current_date)
               AND appointment_date < date_trunc('month', current_date) + interval '1 month';

            SELECT COALESCE(v_limit_record.max_agendamentos_mes, 50) INTO v_limit_value;
            RETURN v_current_count < v_limit_value;

        ELSE
            RETURN FALSE;
    END CASE;
END;
$function$;

-- 3) Triggers de validação de limites (bloqueiam diretamente no banco)

-- 3.1 Assistentes (professional_profiles)
CREATE OR REPLACE FUNCTION public.enforce_limit_assistentes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $fn$
DECLARE
  v_qtd INT;
  v_limite INT;
BEGIN
  SELECT COUNT(*) INTO v_qtd
    FROM public.professional_profiles
   WHERE user_id = NEW.user_id;

  SELECT COALESCE(max_assistentes, 1) INTO v_limite
    FROM public.usuario_limites
   WHERE user_id = NEW.user_id;

  IF v_qtd >= COALESCE(v_limite, 1) THEN
    RAISE EXCEPTION 'Você atingiu o limite de Assistentes do seu plano.';
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS enforce_limit_assistentes_before_insert ON public.professional_profiles;
CREATE TRIGGER enforce_limit_assistentes_before_insert
BEFORE INSERT ON public.professional_profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_limit_assistentes();

-- 3.2 Instâncias WhatsApp (whatsapp_instances)
CREATE OR REPLACE FUNCTION public.enforce_limit_instancias()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $fn$
DECLARE
  v_qtd INT;
  v_limite INT;
BEGIN
  SELECT COUNT(*) INTO v_qtd
    FROM public.whatsapp_instances
   WHERE user_id = NEW.user_id;

  SELECT COALESCE(max_instancias_whatsapp, 1) INTO v_limite
    FROM public.usuario_limites
   WHERE user_id = NEW.user_id;

  IF v_qtd >= COALESCE(v_limite, 1) THEN
    RAISE EXCEPTION 'Você atingiu o limite de Números de WhatsApp do seu plano.';
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS enforce_limit_instancias_before_insert ON public.whatsapp_instances;
CREATE TRIGGER enforce_limit_instancias_before_insert
BEFORE INSERT ON public.whatsapp_instances
FOR EACH ROW
EXECUTE FUNCTION public.enforce_limit_instancias();

-- 3.3 Conversas por mês (conversations)
CREATE OR REPLACE FUNCTION public.enforce_limit_conversas_mes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $fn$
DECLARE
  v_qtd INT;
  v_limite INT;
BEGIN
  SELECT COUNT(*) INTO v_qtd
    FROM public.conversations
   WHERE user_id = NEW.user_id
     AND created_at >= date_trunc('month', current_date)
     AND created_at < date_trunc('month', current_date) + interval '1 month';

  SELECT COALESCE(max_conversas_mes, 100) INTO v_limite
    FROM public.usuario_limites
   WHERE user_id = NEW.user_id;

  IF v_qtd >= COALESCE(v_limite, 100) THEN
    RAISE EXCEPTION 'Você atingiu o limite mensal de Conversas do seu plano.';
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS enforce_limit_conversas_before_insert ON public.conversations;
CREATE TRIGGER enforce_limit_conversas_before_insert
BEFORE INSERT ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.enforce_limit_conversas_mes();

-- 3.4 Agendamentos por mês (appointments)
CREATE OR REPLACE FUNCTION public.enforce_limit_agendamentos_mes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $fn$
DECLARE
  v_qtd INT;
  v_limite INT;
BEGIN
  SELECT COUNT(*) INTO v_qtd
    FROM public.appointments 
   WHERE user_id = NEW.user_id 
     AND appointment_date >= date_trunc('month', current_date)
     AND appointment_date < date_trunc('month', current_date) + interval '1 month';

  SELECT COALESCE(max_agendamentos_mes, 50) INTO v_limite
    FROM public.usuario_limites
   WHERE user_id = NEW.user_id;

  IF v_qtd >= COALESCE(v_limite, 50) THEN
    RAISE EXCEPTION 'Você atingiu o limite mensal de Agendamentos do seu plano.';
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS enforce_limit_agendamentos_before_insert ON public.appointments;
CREATE TRIGGER enforce_limit_agendamentos_before_insert
BEFORE INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_limit_agendamentos_mes();
