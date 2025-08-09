-- Add google_event_id column to appointments table for idempotency
ALTER TABLE public.appointments 
ADD COLUMN google_event_id TEXT;

-- Create unique index for Google Calendar event sync idempotency
CREATE UNIQUE INDEX appointments_google_event_id_uidx 
ON public.appointments (google_event_id) 
WHERE google_event_id IS NOT NULL;