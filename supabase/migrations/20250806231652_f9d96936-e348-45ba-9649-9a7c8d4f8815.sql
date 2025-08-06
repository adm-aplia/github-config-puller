-- Enable Row Level Security on planos table
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;

-- Fix security vulnerabilities in database functions by adding SECURITY DEFINER SET search_path = ''
-- This prevents search path injection attacks

-- 1. Fix check_user_limits function
DROP FUNCTION IF EXISTS public.check_user_limits(uuid, text);
CREATE OR REPLACE FUNCTION public.check_user_limits(p_user_id uuid, p_resource_type text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
    v_limits RECORD;
    v_current_usage INTEGER;
BEGIN
    -- Buscar limites do usuário
    SELECT * INTO v_limits 
    FROM public.usuario_limites 
    WHERE user_id = p_user_id;
    
    -- Se não encontrou limites, criar com valores padrão
    IF NOT FOUND THEN
        INSERT INTO public.usuario_limites (user_id) VALUES (p_user_id);
        SELECT * INTO v_limits FROM public.usuario_limites WHERE user_id = p_user_id;
    END IF;
    
    -- Verificar limite específico
    CASE p_resource_type
        WHEN 'assistente' THEN
            SELECT COUNT(*) INTO v_current_usage FROM public.profiles WHERE user_id = p_user_id;
            RETURN v_current_usage < v_limits.max_assistentes;
            
        WHEN 'instancia' THEN
            SELECT COUNT(*) INTO v_current_usage FROM public.whatsapp_instances WHERE user_id = p_user_id;
            RETURN v_current_usage < v_limits.max_instancias_whatsapp;
            
        WHEN 'conversa' THEN
            RETURN v_limits.uso_conversas_mes < v_limits.max_conversas_mes;
            
        WHEN 'agendamento' THEN
            RETURN v_limits.uso_agendamentos_mes < v_limits.max_agendamentos_mes;
            
        ELSE
            RETURN FALSE;
    END CASE;
END;
$function$;

-- 2. Fix increment_usage function
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id uuid, p_resource_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
    v_reset_needed BOOLEAN := FALSE;
BEGIN
    -- Verificar se precisa resetar uso mensal
    SELECT (ultimo_reset_uso < DATE_TRUNC('month', CURRENT_DATE)) INTO v_reset_needed
    FROM public.usuario_limites 
    WHERE user_id = p_user_id;
    
    -- Resetar uso se necessário
    IF v_reset_needed THEN
        UPDATE public.usuario_limites 
        SET uso_conversas_mes = 0,
            uso_agendamentos_mes = 0,
            ultimo_reset_uso = CURRENT_DATE
        WHERE user_id = p_user_id;
    END IF;
    
    -- Incrementar uso específico
    CASE p_resource_type
        WHEN 'conversa' THEN
            UPDATE public.usuario_limites 
            SET uso_conversas_mes = uso_conversas_mes + 1
            WHERE user_id = p_user_id;
            
        WHEN 'agendamento' THEN
            UPDATE public.usuario_limites 
            SET uso_agendamentos_mes = uso_agendamentos_mes + 1
            WHERE user_id = p_user_id;
    END CASE;
    
    -- Registrar no histórico
    INSERT INTO public.historico_uso (user_id, tipo_uso, metadata)
    VALUES (p_user_id, p_resource_type || '_usado', jsonb_build_object('timestamp', NOW()));
END;
$function$;

-- 3. Fix update_user_limits_from_subscription function
CREATE OR REPLACE FUNCTION public.update_user_limits_from_subscription(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
    v_subscription RECORD;
    v_plan RECORD;
BEGIN
    -- Buscar assinatura ativa do usuário
    SELECT a.* INTO v_subscription
    FROM public.assinaturas a
    JOIN public.clientes c ON c.id = a.cliente_id
    WHERE c.user_id = p_user_id 
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
            p_user_id,
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
    END IF;
END;
$function$;

-- 4. Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
    -- Criar configurações padrão do usuário
    INSERT INTO public.user_settings (user_id) VALUES (NEW.id);
    
    -- Criar limites padrão (plano gratuito)
    INSERT INTO public.usuario_limites (user_id) VALUES (NEW.id);
    
    -- Criar registro de cliente
    INSERT INTO public.clientes (user_id, nome, email) 
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'), NEW.email);
    
    RETURN NEW;
END;
$function$;

-- 5. Fix get_dashboard_stats function
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
    v_stats JSON;
BEGIN
    SELECT json_build_object(
        'total_assistentes', (SELECT COUNT(*) FROM public.profiles WHERE user_id = p_user_id),
        'total_instancias', (SELECT COUNT(*) FROM public.whatsapp_instances WHERE user_id = p_user_id),
        'instancias_ativas', (SELECT COUNT(*) FROM public.whatsapp_instances WHERE user_id = p_user_id AND status = 'connected'),
        'conversas_ativas', (SELECT COUNT(*) FROM public.conversations WHERE user_id = p_user_id AND status = 'active'),
        'agendamentos_mes', (
            SELECT COUNT(*) FROM public.appointments 
            WHERE user_id = p_user_id 
            AND appointment_date >= DATE_TRUNC('month', CURRENT_DATE)
            AND appointment_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        ),
        'mensagens_hoje', (
            SELECT COUNT(*) FROM public.messages m
            JOIN public.conversations c ON c.id = m.conversation_id
            WHERE c.user_id = p_user_id
            AND m.created_at >= CURRENT_DATE
        )
    ) INTO v_stats;
    
    RETURN v_stats;
END;
$function$;

-- 6. Fix get_user_usage_summary function
CREATE OR REPLACE FUNCTION public.get_user_usage_summary(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
    v_limits RECORD;
    v_usage JSON;
BEGIN
    -- Buscar limites atuais
    SELECT * INTO v_limits FROM public.usuario_limites WHERE user_id = p_user_id;
    
    -- Se não encontrou, criar com padrões
    IF NOT FOUND THEN
        INSERT INTO public.usuario_limites (user_id) VALUES (p_user_id);
        SELECT * INTO v_limits FROM public.usuario_limites WHERE user_id = p_user_id;
    END IF;
    
    -- Calcular uso atual
    SELECT json_build_object(
        'assistentes', json_build_object(
            'usado', (SELECT COUNT(*) FROM public.profiles WHERE user_id = p_user_id),
            'limite', v_limits.max_assistentes
        ),
        'instancias', json_build_object(
            'usado', (SELECT COUNT(*) FROM public.whatsapp_instances WHERE user_id = p_user_id),
            'limite', v_limits.max_instancias_whatsapp
        ),
        'conversas_mes', json_build_object(
            'usado', v_limits.uso_conversas_mes,
            'limite', v_limits.max_conversas_mes
        ),
        'agendamentos_mes', json_build_object(
            'usado', v_limits.uso_agendamentos_mes,
            'limite', v_limits.max_agendamentos_mes
        )
    ) INTO v_usage;
    
    RETURN v_usage;
END;
$function$;

-- 7. Recreate the on_auth_user_created trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();