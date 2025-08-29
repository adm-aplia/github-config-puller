-- Corrigir bloqueios antigos que não foram pegos na primeira migração
-- Identificar por patient_name = 'Bloqueado' 
UPDATE public.appointments
SET appointment_type = 'blocked'
WHERE patient_name = 'Bloqueado'
  AND (appointment_type IS NULL OR appointment_type = '');

-- Também verificar se há outros indicadores de bloqueio
UPDATE public.appointments  
SET appointment_type = 'blocked'
WHERE (patient_name ILIKE '%bloqu%' OR notes ILIKE '%bloqu%' OR notes ILIKE '%bloque%')
  AND (appointment_type IS NULL OR appointment_type = '');