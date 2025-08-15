-- Inserir os planos na tabela planos
INSERT INTO public.planos (nome, descricao, preco, periodo, max_assistentes, max_instancias_whatsapp, max_conversas_mes, max_agendamentos_mes, recursos, is_active) VALUES 
(
  'Básico',
  'Para profissionais individuais que buscam eficiência e baixo custo.',
  199.00,
  'monthly',
  1,
  1,
  300,
  300,
  '{"whatsapp_numbers": 1, "support": "email", "features": ["1 Número de whatsapp", "Até 300 agendamentos/mês", "1 Assistente personalizado", "Suporte por e-mail"]}'::jsonb,
  true
),
(
  'Profissional',
  'Recomendado para clínicas que desejam crescer.',
  399.00,
  'monthly',
  3,
  3,
  1000,
  1000,
  '{"whatsapp_numbers": 3, "support": "priority", "features": ["3 Números de whatsApp", "Até 1.000 agendamentos/mês", "3 assistentes personalizado", "Suporte prioritário", "Relatórios Avançados"]}'::jsonb,
  true
),
(
  'Empresarial',
  'Desenvolvido para clínicas e hospitais de grande porte.',
  899.00,
  'monthly',
  999999,
  999999,
  999999,
  999999,
  '{"whatsapp_numbers": "unlimited", "support": "24_7_dedicated", "features": ["+10 Números de whatsApp", "Agendamentos ilimitados", "Assistentes ilimitados", "Suporte 24/7 dedicado", "Integração com sistemas hospitalares", "Personalização avançada"]}'::jsonb,
  true
);