-- Update the get_dashboard_stats function to work without status field
DROP FUNCTION IF EXISTS get_dashboard_stats(uuid);

CREATE OR REPLACE FUNCTION get_dashboard_stats(user_id_param uuid)
RETURNS TABLE (
  total_conversations bigint,
  total_appointments bigint,
  total_profiles bigint,
  total_instances bigint,
  active_conversations bigint,
  total_messages bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total conversations for the user
    COALESCE((
      SELECT COUNT(*)::bigint 
      FROM conversations c 
      WHERE c.user_id = user_id_param
    ), 0) as total_conversations,
    
    -- Total appointments for the user
    COALESCE((
      SELECT COUNT(*)::bigint 
      FROM appointments a 
      WHERE a.user_id = user_id_param
    ), 0) as total_appointments,
    
    -- Total professional profiles for the user
    COALESCE((
      SELECT COUNT(*)::bigint 
      FROM professional_profiles p 
      WHERE p.user_id = user_id_param
    ), 0) as total_profiles,
    
    -- Total WhatsApp instances for the user
    COALESCE((
      SELECT COUNT(*)::bigint 
      FROM whatsapp_instances w 
      WHERE w.user_id = user_id_param
    ), 0) as total_instances,
    
    -- Active conversations (conversations with messages in the last 30 days)
    COALESCE((
      SELECT COUNT(DISTINCT c.id)::bigint 
      FROM conversations c 
      INNER JOIN messages m ON c.id = m.conversation_id 
      WHERE c.user_id = user_id_param 
        AND m.created_at >= NOW() - INTERVAL '30 days'
    ), 0) as active_conversations,
    
    -- Total messages for the user
    COALESCE((
      SELECT COUNT(*)::bigint 
      FROM messages m 
      INNER JOIN conversations c ON m.conversation_id = c.id 
      WHERE c.user_id = user_id_param
    ), 0) as total_messages;
END;
$$;