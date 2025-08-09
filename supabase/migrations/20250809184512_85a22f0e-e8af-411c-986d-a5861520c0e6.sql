-- Adicionar foreign key entre appointments.agent_id e professional_profiles.id
-- para garantir integridade referencial
ALTER TABLE public.appointments 
ADD CONSTRAINT fk_appointments_professional_profile 
FOREIGN KEY (agent_id) REFERENCES public.professional_profiles(id) ON DELETE SET NULL;

-- Criar índice para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_appointments_agent_id ON public.appointments(agent_id);

-- Comentários para documentação
COMMENT ON COLUMN public.appointments.agent_id IS 'References professional_profiles.id - the professional associated with this appointment';