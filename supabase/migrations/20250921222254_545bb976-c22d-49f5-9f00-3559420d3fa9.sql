-- Update get_user_subscription_info function to consider cancelled subscriptions within their paid period
CREATE OR REPLACE FUNCTION public.get_user_subscription_info(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
    v_user_id uuid := coalesce(p_user_id, auth.uid());
    v_subscription record;
    v_plano record;
    v_cliente record;
    v_cliente_id uuid;
    v_result json;
    v_subscription_found boolean := false;
begin
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

    -- Buscar cliente
    select * into v_cliente from public.clientes where user_id = v_user_id;
    if found then
      v_cliente_id := v_cliente.id;
    else
      v_cliente_id := null;
    end if;

    -- Buscar assinatura ativa ou cancelada mas ainda válida
    if v_cliente_id is not null then
      select a.* into v_subscription
      from public.assinaturas a
      where a.cliente_id = v_cliente_id 
      and (
        a.status = 'active' 
        OR (a.status = 'cancelled' AND (a.data_fim IS NULL OR a.data_fim >= CURRENT_DATE))
      )
      order by a.created_at desc
      limit 1;
      
      if found then
        v_subscription_found := true;
      end if;
    end if;

    if v_subscription_found then
        -- Buscar dados do plano
        select * into v_plano from public.planos where id = v_subscription.plano_id;
        
        select json_build_object(
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
        ) into v_result;
    else
        -- Retornar plano gratuito padrão com 0 assistentes
        select json_build_object(
            'id', null,
            'cliente_id', v_cliente_id,
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
                'max_assistentes', 0,
                'max_instancias_whatsapp', 1,
                'max_conversas_mes', 100,
                'max_agendamentos_mes', 50,
                'recursos', '{}'::jsonb
            )
        ) into v_result;
    end if;

    return v_result;
end;
$function$;

-- Update force_update_user_limits function to handle cancelled subscriptions
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

    -- Buscar assinatura ativa ou cancelada mas ainda válida
    SELECT a.* INTO v_subscription
    FROM public.assinaturas a
    JOIN public.clientes c ON c.id = a.cliente_id
    WHERE c.user_id = v_user_id 
    AND (
      a.status = 'active' 
      OR (a.status = 'cancelled' AND (a.data_fim IS NULL OR a.data_fim >= CURRENT_DATE))
    )
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
        -- Se não houver assinatura ativa ou válida, aplicar limites do plano gratuito
        INSERT INTO public.usuario_limites (
            user_id, 
            max_assistentes,
            max_instancias_whatsapp,
            max_conversas_mes,
            max_agendamentos_mes
        ) VALUES (
            v_user_id,
            0,
            1,
            100,
            50
        )
        ON CONFLICT (user_id) DO UPDATE SET
            assinatura_id = NULL,
            max_assistentes = 0,
            max_instancias_whatsapp = 1,
            max_conversas_mes = 100,
            max_agendamentos_mes = 50,
            updated_at = NOW();
    END IF;
END;
$function$;