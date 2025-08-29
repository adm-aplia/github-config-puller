
-- 1) Backfill: garantir que bloqueios tenham appointment_type = 'blocked'
UPDATE public.appointments
SET appointment_type = 'blocked'
WHERE status = 'blocked'
  AND (appointment_type IS NULL OR appointment_type = '');

-- 2) Atualizar a função: get_real_user_usage_summary
CREATE OR REPLACE FUNCTION public.get_real_user_usage_summary(p_user_id uuid DEFAULT NULL::uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
    v_user_id uuid := coalesce(p_user_id, auth.uid());
    v_usage json;
begin
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

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
                select count(*)
                from public.appointments 
                where user_id = v_user_id 
                  and appointment_date >= date_trunc('month', current_date)
                  and appointment_date < date_trunc('month', current_date) + interval '1 month'
                  and coalesce(appointment_type, '') <> 'blocked'
            ),
            'limite', coalesce((select max_agendamentos_mes from public.usuario_limites where user_id = v_user_id), 50)
        )
    ) into v_usage;

    return v_usage;
end;
$function$;

-- 3) Atualizar a função: check_user_limits (ignorar bloqueios)
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
               AND appointment_date < date_trunc('month', current_date) + interval '1 month'
               AND coalesce(appointment_type, '') <> 'blocked';
            SELECT COALESCE(v_limit_record.max_agendamentos_mes, 50) INTO v_limit_value;
            RETURN v_current_count < v_limit_value;

        ELSE
            RETURN FALSE;
    END CASE;
END;
$function$;

-- 4) Atualizar a função: get_dashboard_stats (não contar bloqueios nos total_appointments)
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(user_id_param uuid)
RETURNS TABLE(
  total_conversations bigint,
  total_appointments bigint,
  total_profiles bigint,
  total_instances bigint,
  active_conversations bigint,
  total_messages bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE((
      SELECT COUNT(*)::bigint 
      FROM conversations c 
      WHERE c.user_id = user_id_param
    ), 0) as total_conversations,
    
    COALESCE((
      SELECT COUNT(*)::bigint 
      FROM appointments a 
      WHERE a.user_id = user_id_param
        AND coalesce(a.appointment_type, '') <> 'blocked'
    ), 0) as total_appointments,
    
    COALESCE((
      SELECT COUNT(*)::bigint 
      FROM professional_profiles p 
      WHERE p.user_id = user_id_param
    ), 0) as total_profiles,
    
    COALESCE((
      SELECT COUNT(*)::bigint 
      FROM whatsapp_instances w 
      WHERE w.user_id = user_id_param
    ), 0) as total_instances,
    
    COALESCE((
      SELECT COUNT(DISTINCT c.id)::bigint 
      FROM conversations c 
      INNER JOIN messages m ON c.id = m.conversation_id 
      WHERE c.user_id = user_id_param 
        AND m.created_at >= NOW() - INTERVAL '30 days'
    ), 0) as active_conversations,
    
    COALESCE((
      SELECT COUNT(*)::bigint 
      FROM messages m 
      INNER JOIN conversations c ON m.conversation_id = c.id 
      WHERE c.user_id = user_id_param
    ), 0) as total_messages;
END;
$function$;
