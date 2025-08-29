-- Atualizar a função get_dashboard_stats para excluir agendamentos bloqueados
CREATE OR REPLACE FUNCTION get_dashboard_stats(user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    WITH stats AS (
        SELECT 
            (SELECT COUNT(*) FROM professional_profiles WHERE user_id = user_id_param) as total_assistentes,
            (SELECT COUNT(*) FROM whatsapp_instances WHERE user_id = user_id_param) as total_instancias,
            (SELECT COUNT(*) FROM whatsapp_instances WHERE user_id = user_id_param AND status = 'connected') as instancias_ativas,
            (SELECT COUNT(*) FROM conversations WHERE user_id = user_id_param AND (
                last_message_at >= NOW() - INTERVAL '7 days' OR 
                (last_message_at IS NULL AND created_at >= NOW() - INTERVAL '7 days')
            )) as conversas_ativas,
            (SELECT COUNT(*) FROM appointments 
             WHERE user_id = user_id_param 
             AND appointment_date >= DATE_TRUNC('month', CURRENT_DATE)
             AND (appointment_type IS NULL OR appointment_type != 'blocked')
            ) as agendamentos_mes,
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
$$;