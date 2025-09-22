-- Atualizar o plano Empresarial para ter limite de 10 assistentes
UPDATE public.planos 
SET max_assistentes = 10
WHERE nome = 'Empresarial' AND is_active = true;