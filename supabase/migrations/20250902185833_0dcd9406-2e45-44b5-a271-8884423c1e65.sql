-- Habilitar Row Level Security na tabela conversations
-- A tabela tem políticas definidas mas RLS estava desabilitado
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;