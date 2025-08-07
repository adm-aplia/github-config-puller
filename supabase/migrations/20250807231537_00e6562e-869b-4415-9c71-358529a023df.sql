-- Adicionar mais mensagens de exemplo para testar o chat
INSERT INTO public.messages (conversation_id, sender_type, content, message_type, created_at) VALUES
    ('634b8c71-4e85-4784-87d1-ea339f2edb44'::uuid, 'agent', 'Olá Maria! Como posso ajudá-la hoje?', 'text', '2024-01-07 14:00:00'),
    ('634b8c71-4e85-4784-87d1-ea339f2edb44'::uuid, 'user', 'Oi! Preciso agendar uma consulta', 'text', '2024-01-07 14:02:00'),
    ('634b8c71-4e85-4784-87d1-ea339f2edb44'::uuid, 'agent', 'Perfeito! Que tipo de consulta você precisa?', 'text', '2024-01-07 14:03:00'),
    ('634b8c71-4e85-4784-87d1-ea339f2edb44'::uuid, 'user', 'Consulta de dermatologia, por favor', 'text', '2024-01-07 14:05:00'),
    ('634b8c71-4e85-4784-87d1-ea339f2edb44'::uuid, 'agent', 'Ótimo! Temos disponibilidade na próxima semana. Que horário prefere?', 'text', '2024-01-07 14:06:00');