
-- Corrige a função para não depender do campo inexistente conversations.status
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_stats JSON;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT json_build_object(
        'total_assistentes', (
            SELECT COUNT(*) 
            FROM public.professional_profiles 
            WHERE user_id = v_user_id
        ),
        'total_instancias', (
            SELECT COUNT(*) 
            FROM public.whatsapp_instances 
            WHERE user_id = v_user_id
        ),
        'instancias_ativas', (
            SELECT COUNT(*) 
            FROM public.whatsapp_instances 
            WHERE user_id = v_user_id 
              AND status = 'connected'
        ),
        'conversas_ativas', (
            SELECT COUNT(*) 
            FROM public.conversations 
            WHERE user_id = v_user_id 
              AND (
                (last_message_at IS NOT NULL AND last_message_at >= NOW() - INTERVAL '7 days')
                OR (last_message_at IS NULL AND created_at >= NOW() - INTERVAL '7 days')
              )
        ),
        'agendamentos_mes', (
            SELECT COUNT(*) 
            FROM public.appointments 
            WHERE user_id = v_user_id 
              AND appointment_date >= DATE_TRUNC('month', CURRENT_DATE)
              AND appointment_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
        ),
        'mensagens_hoje', (
            SELECT COUNT(*) 
            FROM public.messages m
            JOIN public.conversations c ON c.id = m.conversation_id
            WHERE c.user_id = v_user_id
              AND m.created_at >= DATE_TRUNC('day', NOW())
              AND m.created_at < DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
        )
    ) INTO v_stats;

    RETURN v_stats;
END;
$function$;
