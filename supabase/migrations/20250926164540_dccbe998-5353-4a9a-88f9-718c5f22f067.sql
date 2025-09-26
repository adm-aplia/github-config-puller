-- Adicionar novos campos para sistema de parcelamento
ALTER TABLE public.professional_profiles 
ADD COLUMN installment_enabled BOOLEAN DEFAULT false,
ADD COLUMN max_installments INTEGER DEFAULT 1;

-- Comentário: Campos para controle de parcelamento nos perfis profissionais