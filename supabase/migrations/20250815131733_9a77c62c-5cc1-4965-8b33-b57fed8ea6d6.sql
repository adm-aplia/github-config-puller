-- Criar função para inicializar dados do usuário se estiverem faltando
CREATE OR REPLACE FUNCTION public.initialize_user_data(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
    -- Criar registro de cliente se não existir
    INSERT INTO public.clientes (user_id, nome, email)
    SELECT 
        p_user_id,
        COALESCE(au.raw_user_meta_data->>'full_name', 'Usuário'),
        au.email
    FROM auth.users au
    WHERE au.id = p_user_id
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Criar limites do usuário se não existir
    INSERT INTO public.usuario_limites (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Criar configurações do usuário se não existir
    INSERT INTO public.user_settings (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
END;
$function$

-- Criar função para obter resumo de uso real do usuário
CREATE OR REPLACE FUNCTION public.get_real_user_usage_summary(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_limits RECORD;
    v_usage JSON;
    v_current_month_start DATE := DATE_TRUNC('month', CURRENT_DATE);
    v_current_month_end DATE := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Inicializar dados se não existirem
    PERFORM public.initialize_user_data(v_user_id);

    -- Buscar limites atuais
    SELECT * INTO v_limits FROM public.usuario_limites WHERE user_id = v_user_id;

    -- Calcular uso atual real
    SELECT json_build_object(
        'assistentes', json_build_object(
            'usado', (SELECT COUNT(*) FROM public.professional_profiles WHERE user_id = v_user_id),
            'limite', v_limits.max_assistentes
        ),
        'instancias', json_build_object(
            'usado', (SELECT COUNT(*) FROM public.whatsapp_instances WHERE user_id = v_user_id),
            'limite', v_limits.max_instancias_whatsapp
        ),
        'conversas_mes', json_build_object(
            'usado', (
                SELECT COUNT(*) FROM public.conversations 
                WHERE user_id = v_user_id 
                AND created_at >= v_current_month_start 
                AND created_at < v_current_month_end
            ),
            'limite', v_limits.max_conversas_mes
        ),
        'agendamentos_mes', json_build_object(
            'usado', (
                SELECT COUNT(*) FROM public.appointments 
                WHERE user_id = v_user_id 
                AND appointment_date >= v_current_month_start 
                AND appointment_date < v_current_month_end
            ),
            'limite', v_limits.max_agendamentos_mes
        )
    ) INTO v_usage;

    RETURN v_usage;
END;
$function$

-- Criar função para obter informações da assinatura do usuário
CREATE OR REPLACE FUNCTION public.get_user_subscription_info(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_subscription RECORD;
    v_client RECORD;
    v_result JSON;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Inicializar dados se não existirem
    PERFORM public.initialize_user_data(v_user_id);

    -- Buscar cliente
    SELECT * INTO v_client FROM public.clientes WHERE user_id = v_user_id;

    -- Buscar assinatura ativa com plano
    SELECT 
        a.*,
        p.nome as plano_nome,
        p.preco as plano_preco,
        p.recursos as plano_recursos,
        p.max_assistentes,
        p.max_instancias_whatsapp,
        p.max_conversas_mes,
        p.max_agendamentos_mes
    INTO v_subscription
    FROM public.assinaturas a
    JOIN public.planos p ON p.id = a.plano_id
    WHERE a.cliente_id = v_client.id
    AND a.status = 'active'
    ORDER BY a.created_at DESC
    LIMIT 1;

    IF FOUND THEN
        SELECT json_build_object(
            'has_subscription', true,
            'subscription_id', v_subscription.id,
            'plano_nome', v_subscription.plano_nome,
            'preco', v_subscription.plano_preco,
            'status', v_subscription.status,
            'data_inicio', v_subscription.data_inicio,
            'data_fim', v_subscription.data_fim,
            'proxima_cobranca', v_subscription.proxima_cobranca,
            'limites', json_build_object(
                'max_assistentes', v_subscription.max_assistentes,
                'max_instancias_whatsapp', v_subscription.max_instancias_whatsapp,
                'max_conversas_mes', v_subscription.max_conversas_mes,
                'max_agendamentos_mes', v_subscription.max_agendamentos_mes
            )
        ) INTO v_result;
    ELSE
        SELECT json_build_object(
            'has_subscription', false,
            'plano_nome', 'Gratuito',
            'status', 'inactive',
            'limites', json_build_object(
                'max_assistentes', 1,
                'max_instancias_whatsapp', 1,
                'max_conversas_mes', 100,
                'max_agendamentos_mes', 50
            )
        ) INTO v_result;
    END IF;

    RETURN v_result;
END;
$function$