-- Versão de debug da função get_user_subscription_info
CREATE OR REPLACE FUNCTION public.get_user_subscription_info_debug(p_user_id uuid DEFAULT NULL::uuid)
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
begin
    RAISE NOTICE 'DEBUG: Iniciando função com user_id: %', v_user_id;
    
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

    -- Buscar cliente
    select * into v_cliente from public.clientes where user_id = v_user_id;
    if found then
      v_cliente_id := v_cliente.id;
      RAISE NOTICE 'DEBUG: Cliente encontrado: %', v_cliente_id;
    else
      v_cliente_id := null;
      RAISE NOTICE 'DEBUG: Cliente NÃO encontrado';
    end if;

    -- Buscar assinatura ativa do usuário
    if v_cliente_id is not null then
      select a.* into v_subscription
      from public.assinaturas a
      where a.cliente_id = v_cliente_id 
      and a.status = 'active'
      order by a.created_at desc
      limit 1;
      
      if found then
        RAISE NOTICE 'DEBUG: Assinatura encontrada: % - Status: % - Plano: %', v_subscription.id, v_subscription.status, v_subscription.plano_id;
      else
        RAISE NOTICE 'DEBUG: Nenhuma assinatura ativa encontrada';
      end if;
    end if;

    if v_subscription.id is not null then
        -- Buscar dados do plano
        select * into v_plano from public.planos where id = v_subscription.plano_id;
        RAISE NOTICE 'DEBUG: Plano encontrado: % - Nome: %', v_plano.id, v_plano.nome;
        
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
        
        RAISE NOTICE 'DEBUG: Retornando assinatura ativa';
    else
        RAISE NOTICE 'DEBUG: Retornando plano gratuito';
        -- Retornar plano gratuito padrão
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
                'max_assistentes', 1,
                'max_instancias_whatsapp', 1,
                'max_conversas_mes', 100,
                'max_agendamentos_mes', 50,
                'recursos', '{}'::jsonb
            )
        ) into v_result;
    end if;

    return v_result;
end;
$function$

-- Testar a função de debug
SELECT public.get_user_subscription_info_debug('160a2547-7ab6-4b5a-9eb8-c7f23c3c55bf');