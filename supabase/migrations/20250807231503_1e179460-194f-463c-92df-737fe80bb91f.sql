-- Adicionar mais mensagens de exemplo para testar o chat
INSERT INTO public.messages (conversation_id, sender_type, content, message_type, created_at) 
SELECT 
    '634b8c71-4e85-4784-87d1-ea339f2edb44', -- ID da conversa da Maria Silva
    'agent',
    'Olá Maria! Como posso ajudá-la hoje?',
    'text',
    '2024-01-07 14:00:00'
UNION ALL
SELECT 
    '634b8c71-4e85-4784-87d1-ea339f2edb44',
    'user', 
    'Oi! Preciso agendar uma consulta',
    'text',
    '2024-01-07 14:02:00'
UNION ALL
SELECT 
    '634b8c71-4e85-4784-87d1-ea339f2edb44',
    'agent',
    'Perfeito! Que tipo de consulta você precisa?',
    'text',
    '2024-01-07 14:03:00'
UNION ALL
SELECT 
    '634b8c71-4e85-4784-87d1-ea339f2edb44',
    'user',
    'Consulta de dermatologia, por favor',
    'text',
    '2024-01-07 14:05:00'
UNION ALL
SELECT 
    '634b8c71-4e85-4784-87d1-ea339f2edb44',
    'agent',
    'Ótimo! Temos disponibilidade na próxima semana. Que horário prefere?',
    'text',
    '2024-01-07 14:06:00';