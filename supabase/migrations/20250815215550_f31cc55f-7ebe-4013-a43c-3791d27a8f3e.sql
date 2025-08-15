
-- 1) Função para inicialização explícita (sem efeitos colaterais em funções de leitura)
create or replace function public.ensure_user_initialized(p_user_id uuid default null)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := coalesce(p_user_id, auth.uid());
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  perform public.initialize_user_data(v_user_id);
end;
$function$;

-- 2) Atualizar get_real_user_usage_summary para remover side effects e adicionar fallback seguro
create or replace function public.get_real_user_usage_summary(p_user_id uuid default null)
returns json
language plpgsql
security definer
set search_path to ''
as $function$
declare
    v_user_id uuid := coalesce(p_user_id, auth.uid());
    v_usage json;
begin
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

    -- Sem chamar initialize_user_data aqui (para evitar writes em consultas de leitura)
    -- Fallback para limites quando não houver registro em public.usuario_limites:
    -- plano gratuito: assistentes=1, instancias=1, conversas_mes=100, agendamentos_mes=50

    select json_build_object(
        'assistentes', json_build_object(
            'usado', (select count(*) from public.professional_profiles where user_id = v_user_id),
            'limite', coalesce((select max_assistentes from public.usuario_limites where user_id = v_user_id), 1)
        ),
        'instancias', json_build_object(
            'usado', (select count(*) from public.whatsapp_instances where user_id = v_user_id),
            'limite', coalesce((select max_instancias_whatsapp from public.usuario_limites where user_id = v_user_id), 1)
        ),
        'conversas_mes', json_build_object(
            'usado', (
                select count(*) from public.conversations 
                where user_id = v_user_id 
                and created_at >= date_trunc('month', current_date)
            ),
            'limite', coalesce((select max_conversas_mes from public.usuario_limites where user_id = v_user_id), 100)
        ),
        'agendamentos_mes', json_build_object(
            'usado', (
                select count(*) from public.appointments 
                where user_id = v_user_id 
                and appointment_date >= date_trunc('month', current_date)
                and appointment_date < date_trunc('month', current_date) + interval '1 month'
            ),
            'limite', coalesce((select max_agendamentos_mes from public.usuario_limites where user_id = v_user_id), 50)
        )
    ) into v_usage;

    return v_usage;
end;
$function$;

-- 3) Atualizar get_user_subscription_info para remover side effects e evitar null dereference
create or replace function public.get_user_subscription_info(p_user_id uuid default null)
returns json
language plpgsql
security definer
set search_path to ''
as $function$
declare
    v_user_id uuid := coalesce(p_user_id, auth.uid());
    v_subscription record;
    v_plano record;
    v_cliente record;
    v_cliente_id uuid;
    v_result json;
begin
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

    -- Sem chamar initialize_user_data aqui (para evitar writes em consultas de leitura)
    -- Buscar cliente (pode não existir ainda)
    select * into v_cliente from public.clientes where user_id = v_user_id;
    if found then
      v_cliente_id := v_cliente.id;
    else
      v_cliente_id := null;
    end if;

    -- Buscar assinatura ativa do usuário (só se houver cliente)
    if v_cliente_id is not null then
      select a.* into v_subscription
      from public.assinaturas a
      where a.cliente_id = v_cliente_id 
      and a.status = 'active'
      order by a.created_at desc
      limit 1;
    else
      v_subscription := null;
    end if;

    if v_subscription is not null then
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
        -- Retornar plano gratuito padrão se não houver assinatura (ou até cliente)
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
$function$;
