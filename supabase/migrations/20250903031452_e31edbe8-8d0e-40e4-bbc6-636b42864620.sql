
-- 1) Espelho de eventos do Google com suporte a recorrência e multi-calendário
CREATE TABLE IF NOT EXISTS public.google_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  professional_profile_id uuid,
  google_calendar_id text NOT NULL,     -- ex.: 'primary' ou ID do calendário
  google_event_id text NOT NULL,        -- event.id do Google
  etag text,                            -- para sync incremental
  ical_uid text,                        -- iCalUID
  summary text,
  description text,
  location text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  timezone text,
  all_day boolean NOT NULL DEFAULT false,
  recurrence text[],                    -- ["RRULE:..."]
  rrule text,                           -- "FREQ=...;BYDAY=..."
  recurring_event_id text,              -- event.recurringEventId
  original_start_time timestamptz,      -- event.originalStartTime (para exceções)
  is_recurring_instance boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'confirmed',
  attendees jsonb NOT NULL DEFAULT '[]'::jsonb,
  reminders jsonb NOT NULL DEFAULT '{}'::jsonb,
  sequence integer NOT NULL DEFAULT 0,
  event_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ÍNDICE ÚNICO: idempotência por usuário + calendário + evento
CREATE UNIQUE INDEX IF NOT EXISTS google_calendar_events_unique_triple_idx
  ON public.google_calendar_events (user_id, google_calendar_id, google_event_id);

-- Índice para reconciliar séries e localizar instâncias
CREATE INDEX IF NOT EXISTS google_calendar_events_user_recurring_idx
  ON public.google_calendar_events (user_id, recurring_event_id);

-- (Opcional, útil para janelas de sincronização/consulta por data)
CREATE INDEX IF NOT EXISTS google_calendar_events_user_start_time_idx
  ON public.google_calendar_events (user_id, start_time);

-- RLS
ALTER TABLE public.google_calendar_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'google_calendar_events' 
      AND policyname = 'Users can view own google calendar events'
  ) THEN
    CREATE POLICY "Users can view own google calendar events"
      ON public.google_calendar_events
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'google_calendar_events' 
      AND policyname = 'Users can insert own google calendar events'
  ) THEN
    CREATE POLICY "Users can insert own google calendar events"
      ON public.google_calendar_events
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'google_calendar_events' 
      AND policyname = 'Users can update own google calendar events'
  ) THEN
    CREATE POLICY "Users can update own google calendar events"
      ON public.google_calendar_events
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'google_calendar_events' 
      AND policyname = 'Users can delete own google calendar events'
  ) THEN
    CREATE POLICY "Users can delete own google calendar events"
      ON public.google_calendar_events
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger de updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'set_updated_at_google_calendar_events'
  ) THEN
    CREATE TRIGGER set_updated_at_google_calendar_events
    BEFORE UPDATE ON public.google_calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 2) Enriquecer appointments com metadados de recorrência e multi-calendário
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS google_calendar_id text,
  ADD COLUMN IF NOT EXISTS google_recurring_event_id text,
  ADD COLUMN IF NOT EXISTS google_original_start_time timestamptz,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS all_day boolean DEFAULT false;

-- Idempotência de instâncias: evitar duplicar a mesma ocorrência
CREATE UNIQUE INDEX IF NOT EXISTS appointments_unique_triple_idx
  ON public.appointments (user_id, google_calendar_id, google_event_id)
  WHERE google_event_id IS NOT NULL AND google_calendar_id IS NOT NULL;

-- Busca eficiente por série + data para reconciliação/re-expansão
CREATE INDEX IF NOT EXISTS appointments_recurring_date_idx
  ON public.appointments (user_id, google_recurring_event_id, appointment_date);
