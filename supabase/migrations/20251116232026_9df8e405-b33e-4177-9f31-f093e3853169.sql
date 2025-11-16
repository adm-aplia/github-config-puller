-- Atualizar features dos planos com emojis corretos

-- Plano Básico
UPDATE planos
SET recursos = jsonb_build_object(
  'features', jsonb_build_array(
    '📞 1 Número de WhatsApp',
    '🤖 1 Assistente Personalizado',
    '🎧 Reconhece Áudio',
    '👍 Reconhece Emoji',
    '📅 Agendamentos ilimitados',
    '🔔 Lembretes de Consultas Automáticas',
    '🔗 Integração Google Agenda',
    '📊 Estatísticas Detalhadas',
    '✉️ Suporte por e-mail'
  )
)
WHERE nome = 'Básico';

-- Plano Profissional
UPDATE planos
SET recursos = jsonb_build_object(
  'features', jsonb_build_array(
    '😊 3 Números de WhatsApp',
    '🤖 3 Assistentes Personalizado',
    '🎧 Reconhece Áudio',
    '👍 Reconhece Emoji',
    '📅 Agendamentos ilimitados',
    '📝 Relatórios Avançados',
    '🔔 Lembretes de Consultas Automáticas',
    '📊 Estatísticas Detalhadas',
    '🔗 Integração Google Agenda',
    '📩 Suporte prioritário',
    '✉️ Suporte por e-mail'
  )
)
WHERE nome = 'Profissional';

-- Plano Premium (Empresarial)
UPDATE planos
SET recursos = jsonb_build_object(
  'features', jsonb_build_array(
    '🚫 +10 Números de WhatsApp',
    '🤖 +10 Assistentes Personalizados',
    '🎧 Reconhece Áudio',
    '👍 Reconhece Emoji',
    '🎧 Suporte 24/7 dedicado',
    '📅 Agendamentos ilimitados',
    '🔔 Lembretes de Consultas Automáticas',
    '📊 Estatísticas Detalhadas',
    '🔗 Integração Google Agenda',
    '✉️ Suporte por e-mail'
  )
)
WHERE nome = 'Premium';