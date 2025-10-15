-- Adicionar coluna is_active na tabela professional_profiles
ALTER TABLE public.professional_profiles 
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Atualizar todos os perfis existentes para ativos por padrão
UPDATE public.professional_profiles 
SET is_active = true 
WHERE is_active IS NULL;