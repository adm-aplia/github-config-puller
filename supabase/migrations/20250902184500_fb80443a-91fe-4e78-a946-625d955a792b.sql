
DO $$
BEGIN
  -- 1) Garantir que as tabelas enviem todos os dados nas mudanças
  BEGIN
    ALTER TABLE public.messages REPLICA IDENTITY FULL;
  EXCEPTION WHEN others THEN
    -- ignora se já estiver configurado
    NULL;
  END;

  BEGIN
    ALTER TABLE public.conversations REPLICA IDENTITY FULL;
  EXCEPTION WHEN others THEN
    -- ignora se já estiver configurado
    NULL;
  END;

  -- 2) Adicionar tabelas à publicação de Realtime (idempotente)
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END $$;
