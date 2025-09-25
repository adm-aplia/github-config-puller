-- Migração para implementar identificação de origem dos agendamentos
-- Atualizar agendamentos vindos do Google Calendar para usar 'google_sync'
UPDATE public.appointments 
SET appointment_type = 'google_sync' 
WHERE appointment_type = 'blocked' 
  AND google_event_id IS NOT NULL;

-- Comentário: Esta migração preserva agendamentos manuais e marca corretamente
-- os agendamentos importados do Google Calendar com 'google_sync'