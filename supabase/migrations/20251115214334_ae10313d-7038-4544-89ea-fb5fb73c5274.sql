-- Renomear agent_id para professional_profile_id na tabela conversations
ALTER TABLE public.conversations 
RENAME COLUMN agent_id TO professional_profile_id;

-- Atualizar comentário da coluna para clareza
COMMENT ON COLUMN public.conversations.professional_profile_id IS 'Referência ao perfil profissional (assistente) responsável pela conversa';