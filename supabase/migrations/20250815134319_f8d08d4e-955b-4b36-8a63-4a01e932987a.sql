-- Função para obter resumo real do uso do usuário
CREATE OR REPLACE FUNCTION public.get_real_user_usage_summary(p_user_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid := COALESCE(p_user_id, auth.uid());
    v_limits RECORD;
    v_usage JSON;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Garantir que os dados do usuário existem
    PERFORM public.initialize_user_data(v_user_id);

    -- Buscar limites atuais
    SELECT * INTO v_limits FROM public.usuario_limites WHERE user_id = v_user_id;

    -- Calcular uso atual baseado nos dados reais
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
                AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
            ),
            'limite', v_limits.max_conversas_mes
        ),
        'agendamentos_mes', json_build_object(
            'usado', (
                SELECT COUNT(*) FROM public.appointments 
                WHERE user_id = v_user_id 
                AND appointment_date >= DATE_TRUNC('month', CURRENT_DATE)
                AND appointment_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
            ),
            'limite', v_limits.max_agendamentos_mes
        )
    ) INTO v_usage;

    RETURN v_usage;
END;
$function$;

-- Função para obter informações completas da assinatura do usuário
CREATE OR REPLACE FUNCTION public.get_user_subscription_info(p_user_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid := COALESCE(p_user_id, auth.uid());
    v_subscription RECORD;
    v_plano RECORD;
    v_cliente RECORD;
    v_result JSON;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Garantir que os dados do usuário existem
    PERFORM public.initialize_user_data(v_user_id);

    -- Buscar cliente
    SELECT * INTO v_cliente FROM public.clientes WHERE user_id = v_user_id;

    -- Buscar assinatura ativa do usuário
    SELECT a.* INTO v_subscription
    FROM public.assinaturas a
    WHERE a.cliente_id = v_cliente.id 
    AND a.status = 'active'
    ORDER BY a.created_at DESC
    LIMIT 1;

    IF FOUND THEN
        -- Buscar dados do plano
        SELECT * INTO v_plano FROM public.planos WHERE id = v_subscription.plano_id;
        
        SELECT json_build_object(
            'id', v_subscription.id,
            'cliente_id', v_subscription.cliente_id,
            'plano_id', v_subscription.plano_id,
            'status', v_subscription.status,
            'data_inicio', v_subscription.data_inicio,
            'data_fim', v_subscription.data_fim,
            'proxima_cobranca', v_subscription.proxima_cobranca,
            'asaas_subscription_id', v_subscription.asaas_subscription_id,
            'plano', json_build_object(
                'id', v_plano.id,
                'nome', v_plano.nome,
                'preco', v_plano.preco,
                'periodo', v_plano.periodo,
                'max_assistentes', v_plano.max_assistentes,
                'max_instancias_whatsapp', v_plano.max_instancias_whatsapp,
                'max_conversas_mes', v_plano.max_conversas_mes,
                'max_agendamentos_mes', v_plano.max_agendamentos_mes,
                'recursos', v_plano.recursos
            )
        ) INTO v_result;
    ELSE
        -- Retornar plano gratuito padrão se não houver assinatura
        SELECT json_build_object(
            'id', null,
            'cliente_id', v_cliente.id,
            'plano_id', null,
            'status', 'free',
            'data_inicio', null,
            'data_fim', null,
            'proxima_cobranca', null,
            'asaas_subscription_id', null,
            'plano', json_build_object(
                'id', null,
                'nome', 'Gratuito',
                'preco', 0,
                'periodo', 'monthly',
                'max_assistentes', 1,
                'max_instancias_whatsapp', 1,
                'max_conversas_mes', 100,
                'max_agendamentos_mes', 50,
                'recursos', '{}'::jsonb
            )
        ) INTO v_result;
    END IF;

    RETURN v_result;
END;
$function$;