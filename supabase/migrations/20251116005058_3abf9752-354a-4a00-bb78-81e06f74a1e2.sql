-- Fix get_dashboard_stats function to use patient_phone instead of contact_phone
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(user_id_param uuid, days_param integer DEFAULT 30)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result JSON;
    start_date TIMESTAMPTZ;
BEGIN
    -- Calculate start date based on days parameter
    start_date := NOW() - (days_param || ' days')::INTERVAL;
    
    WITH stats AS (
        SELECT 
            (SELECT COUNT(*) FROM professional_profiles WHERE user_id = user_id_param) as total_assistentes,
            (SELECT COUNT(*) FROM whatsapp_instances WHERE user_id = user_id_param) as total_instancias,
            (SELECT COUNT(*) FROM whatsapp_instances WHERE user_id = user_id_param AND status = 'connected') as instancias_ativas,
            -- conversas_ativas: últimos 7 dias (mantido para compatibilidade)
            (SELECT COUNT(*) FROM conversations WHERE user_id = user_id_param AND (
                last_message_at >= NOW() - INTERVAL '7 days' OR 
                (last_message_at IS NULL AND created_at >= NOW() - INTERVAL '7 days')
            )) as conversas_ativas,
            -- conversas_periodo: baseado no parâmetro days_param - CORRIGIDO para patient_phone
            (SELECT COUNT(DISTINCT patient_phone) 
             FROM conversations c
             WHERE c.user_id = user_id_param 
             AND EXISTS (
                 SELECT 1 FROM messages m 
                 WHERE m.conversation_id = c.id 
                 AND m.created_at >= start_date
             )
            ) as conversas_periodo,
            -- agendamentos_mes: do mês atual (mantido para compatibilidade)
            (SELECT COUNT(*) FROM appointments 
             WHERE user_id = user_id_param 
             AND appointment_date >= DATE_TRUNC('month', CURRENT_DATE)
             AND (appointment_type IS NULL OR appointment_type != 'blocked')
            ) as agendamentos_mes,
            -- agendamentos_periodo: baseado no parâmetro days_param
            (SELECT COUNT(*) FROM appointments 
             WHERE user_id = user_id_param 
             AND appointment_date >= start_date
             AND (appointment_type IS NULL OR appointment_type != 'blocked')
            ) as agendamentos_periodo,
            (
                SELECT COUNT(*) 
                FROM messages m
                JOIN conversations c ON m.conversation_id = c.id
                WHERE c.user_id = user_id_param
                AND m.created_at >= CURRENT_DATE
                AND m.created_at < CURRENT_DATE + INTERVAL '1 day'
            ) as mensagens_hoje
    )
    SELECT row_to_json(stats.*) INTO result FROM stats;
    
    RETURN result;
END;
$function$;