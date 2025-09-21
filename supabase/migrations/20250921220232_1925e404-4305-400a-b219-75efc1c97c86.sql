-- Atualizar a função de verificação de limites para tratar valores altos como "ilimitado"
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

    SELECT * INTO v_limit_record
      FROM public.usuario_limites 
     WHERE user_id = v_user_id;

    v_limit_value := 0;

    CASE p_resource_type
        WHEN 'assistente' THEN
            SELECT COUNT(*) INTO v_current_count
              FROM public.professional_profiles
             WHERE user_id = v_user_id;
            SELECT COALESCE(v_limit_record.max_assistentes, 1) INTO v_limit_value;
            -- Se o limite for 999999 ou maior, consideramos ilimitado
            IF v_limit_value >= 999999 THEN
                RETURN TRUE;
            END IF;
            RETURN v_current_count < v_limit_value;

        WHEN 'instancia' THEN
            SELECT COUNT(*) INTO v_current_count
              FROM public.whatsapp_instances
             WHERE user_id = v_user_id;
            SELECT COALESCE(v_limit_record.max_instancias_whatsapp, 1) INTO v_limit_value;
            -- Se o limite for 999999 ou maior, consideramos ilimitado
            IF v_limit_value >= 999999 THEN
                RETURN TRUE;
            END IF;
            RETURN v_current_count < v_limit_value;

        WHEN 'conversa' THEN
            SELECT COUNT(*) INTO v_current_count
              FROM public.conversations 
             WHERE user_id = v_user_id
               AND created_at >= date_trunc('month', current_date)
               AND created_at < date_trunc('month', current_date) + interval '1 month';
            SELECT COALESCE(v_limit_record.max_conversas_mes, 100) INTO v_limit_value;
            -- Se o limite for 999999 ou maior, consideramos ilimitado
            IF v_limit_value >= 999999 THEN
                RETURN TRUE;
            END IF;
            RETURN v_current_count < v_limit_value;

        WHEN 'agendamento' THEN
            SELECT COUNT(*) INTO v_current_count
              FROM public.appointments 
             WHERE user_id = v_user_id 
               AND appointment_date >= date_trunc('month', current_date)
               AND appointment_date < date_trunc('month', current_date) + interval '1 month'
               AND coalesce(appointment_type, '') <> 'blocked';
            SELECT COALESCE(v_limit_record.max_agendamentos_mes, 50) INTO v_limit_value;
            -- Se o limite for 999999 ou maior, consideramos ilimitado
            IF v_limit_value >= 999999 THEN
                RETURN TRUE;
            END IF;
            RETURN v_current_count < v_limit_value;

        ELSE
            RETURN FALSE;
    END CASE;
END;
$function$;

-- Atualizar triggers para também considerar valores altos como ilimitado
CREATE OR REPLACE FUNCTION public.enforce_limit_assistentes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

  -- Se o limite for 999999 ou maior, consideramos ilimitado
  IF v_limite >= 999999 THEN
    RETURN NEW;
  END IF;

  IF v_qtd >= COALESCE(v_limite, 1) THEN
    RAISE EXCEPTION 'Você atingiu o limite de Assistentes do seu plano.';
  END IF;

  RETURN NEW;
END;
$function$;

-- Atualizar função para forçar a sincronização dos limites do usuário atual
CREATE OR REPLACE FUNCTION public.force_update_user_limits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_subscription RECORD;
    v_plan RECORD;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Buscar assinatura ativa do usuário
    SELECT a.* INTO v_subscription
    FROM public.assinaturas a
    JOIN public.clientes c ON c.id = a.cliente_id
    WHERE c.user_id = v_user_id 
    AND a.status = 'active'
    ORDER BY a.created_at DESC
    LIMIT 1;
    
    IF FOUND THEN
        -- Buscar dados do plano
        SELECT * INTO v_plan FROM public.planos WHERE id = v_subscription.plano_id;
        
        -- Atualizar limites do usuário
        INSERT INTO public.usuario_limites (
            user_id, 
            assinatura_id,
            max_assistentes,
            max_instancias_whatsapp,
            max_conversas_mes,
            max_agendamentos_mes
        ) VALUES (
            v_user_id,
            v_subscription.id,
            v_plan.max_assistentes,
            v_plan.max_instancias_whatsapp,
            v_plan.max_conversas_mes,
            v_plan.max_agendamentos_mes
        )
        ON CONFLICT (user_id) DO UPDATE SET
            assinatura_id = EXCLUDED.assinatura_id,
            max_assistentes = EXCLUDED.max_assistentes,
            max_instancias_whatsapp = EXCLUDED.max_instancias_whatsapp,
            max_conversas_mes = EXCLUDED.max_conversas_mes,
            max_agendamentos_mes = EXCLUDED.max_agendamentos_mes,
            updated_at = NOW();
    ELSE
        -- Se não houver assinatura ativa, aplicar limites do plano gratuito
        INSERT INTO public.usuario_limites (
            user_id, 
            max_assistentes,
            max_instancias_whatsapp,
            max_conversas_mes,
            max_agendamentos_mes
        ) VALUES (
            v_user_id,
            1,
            1,
            100,
            50
        )
        ON CONFLICT (user_id) DO UPDATE SET
            assinatura_id = NULL,
            max_assistentes = 1,
            max_instancias_whatsapp = 1,
            max_conversas_mes = 100,
            max_agendamentos_mes = 50,
            updated_at = NOW();
    END IF;
END;
$function$;