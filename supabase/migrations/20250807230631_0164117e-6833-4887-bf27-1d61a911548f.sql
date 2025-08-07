-- Inserir conversas mockadas para nathancwb@gmail.com
INSERT INTO public.conversations (user_id, contact_phone, contact_name, status, last_message_at, instance_id, agent_id) VALUES
('160a2547-7ab6-4b5a-9eb8-c7f23c3c55bf', '+5541999887766', 'Maria Silva', 'active', '2024-01-07 14:30:00', NULL, NULL),
('160a2547-7ab6-4b5a-9eb8-c7f23c3c55bf', '+5541988776655', 'João Santos', 'pending', '2024-01-07 13:15:00', NULL, NULL),
('160a2547-7ab6-4b5a-9eb8-c7f23c3c55bf', '+5541977665544', 'Ana Oliveira', 'completed', '2024-01-07 12:00:00', NULL, NULL),
('160a2547-7ab6-4b5a-9eb8-c7f23c3c55bf', '+5541966554433', 'Carlos Pereira', 'active', '2024-01-07 15:45:00', NULL, NULL),
('160a2547-7ab6-4b5a-9eb8-c7f23c3c55bf', '+5541955443322', 'Fernanda Costa', 'pending', '2024-01-07 11:20:00', NULL, NULL);

-- Inserir algumas mensagens para as conversas
INSERT INTO public.messages (conversation_id, sender_type, content, message_type, created_at) 
SELECT 
    c.id,
    CASE 
        WHEN random() > 0.5 THEN 'user'
        ELSE 'assistant'
    END,
    CASE 
        WHEN c.contact_name = 'Maria Silva' THEN 'Olá, gostaria de agendar uma consulta para a próxima semana.'
        WHEN c.contact_name = 'João Santos' THEN 'Qual o valor da consulta de dermatologia?'
        WHEN c.contact_name = 'Ana Oliveira' THEN 'Obrigada pelo atendimento, foi muito esclarecedor!'
        WHEN c.contact_name = 'Carlos Pereira' THEN 'Preciso remarcar minha consulta de amanhã.'
        WHEN c.contact_name = 'Fernanda Costa' THEN 'Aceita convênio Unimed?'
    END,
    'text',
    c.last_message_at
FROM public.conversations c 
WHERE c.user_id = '160a2547-7ab6-4b5a-9eb8-c7f23c3c55bf';

-- Inserir resumos de IA para algumas conversas
INSERT INTO public.conversation_summaries (conversation_id, user_id, summary_text)
SELECT 
    c.id,
    c.user_id,
    CASE 
        WHEN c.contact_name = 'Maria Silva' THEN 'Paciente interessada em agendar consulta médica para a próxima semana. Demonstrou urgência moderada e disponibilidade flexível de horários. Necessário verificar agenda e confirmar agendamento.'
        WHEN c.contact_name = 'João Santos' THEN 'Consulta sobre valores de consulta dermatológica. Paciente interessado em tratamento para problemas de pele. Fornecidas informações sobre preços e formas de pagamento.'
        WHEN c.contact_name = 'Ana Oliveira' THEN 'Consulta finalizada com sucesso. Paciente demonstrou satisfação com o atendimento recebido. Todas as dúvidas foram esclarecidas e orientações médicas foram fornecidas adequadamente.'
        WHEN c.contact_name = 'Carlos Pereira' THEN 'Solicitação de reagendamento de consulta. Paciente precisa alterar horário devido a compromisso profissional. Necessário verificar disponibilidade na agenda e confirmar novo horário.'
    END
FROM public.conversations c 
WHERE c.user_id = '160a2547-7ab6-4b5a-9eb8-c7f23c3c55bf' 
AND c.contact_name IN ('Maria Silva', 'João Santos', 'Ana Oliveira', 'Carlos Pereira');