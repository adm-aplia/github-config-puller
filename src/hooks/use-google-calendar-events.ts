import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Interface para eventos vindos do N8N (formato diferente)
export interface N8NEvent {
  id: string;
  summary?: string;
  start?: string; // String direta do N8N
  end?: string;   // String direta do N8N
  organizer?: string; // String direta do N8N
  attendees?: string[]; // Array de strings do N8N
  htmlLink?: string;
  location?: string;
  status?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  user_id: string;
  professional_profile_id?: string;
  google_calendar_id: string;
  google_event_id: string;
  etag?: string;
  ical_uid?: string;
  summary?: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  timezone?: string;
  all_day: boolean;
  recurrence?: string[];
  rrule?: string;
  recurring_event_id?: string;
  original_start_time?: string;
  is_recurring_instance: boolean;
  status: string;
  attendees: { email?: string; responseStatus?: string }[];
  reminders: { useDefault?: boolean; overrides?: Array<{ method?: string; minutes?: number }> };
  sequence: number;
  event_type?: string;
  created_at: string;
  updated_at: string;
}

export interface GCalendarWebhookEvent {
  id: string;
  summary?: string;
  description?: string;
  status?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  location?: string;
  attendees?: Array<{ email?: string; responseStatus?: string }>;
  recurrence?: string[];
  recurringEventId?: string;
  originalStartTime?: { dateTime?: string; date?: string; timeZone?: string };
  sequence?: number;
  iCalUID?: string;
  etag?: string;
  organizer?: { email?: string };
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{ method?: string; minutes?: number }>;
  };
  eventType?: string;
}

export const useGoogleCalendarEvents = () => {
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchGoogleCalendarEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('google_calendar_events')
        .select('*')
        .order('start_time', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedEvents: GoogleCalendarEvent[] = (data || []).map(event => {
        // Parse attendees from JSONB
        let attendees: { email?: string; responseStatus?: string }[] = [];
        try {
          if (Array.isArray(event.attendees)) {
            attendees = event.attendees as { email?: string; responseStatus?: string }[];
          } else if (typeof event.attendees === 'string') {
            attendees = JSON.parse(event.attendees);
          }
        } catch (e) {
          attendees = [];
        }

        // Parse reminders from JSONB
        let reminders: { useDefault?: boolean; overrides?: Array<{ method?: string; minutes?: number }> } = {};
        try {
          if (typeof event.reminders === 'object' && event.reminders !== null) {
            reminders = event.reminders as any;
          } else if (typeof event.reminders === 'string') {
            reminders = JSON.parse(event.reminders);
          }
        } catch (e) {
          reminders = {};
        }

        // Parse recurrence from JSONB
        let recurrence: string[] = [];
        try {
          if (Array.isArray(event.recurrence)) {
            recurrence = event.recurrence;
          } else if (typeof event.recurrence === 'string') {
            recurrence = JSON.parse(event.recurrence);
          }
        } catch (e) {
          recurrence = [];
        }

        return {
          ...event,
          attendees,
          reminders,
          recurrence,
        } as GoogleCalendarEvent;
      });
      
      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      toast({
        title: 'Erro ao carregar eventos do Google',
        description: 'Não foi possível carregar os eventos do Google Calendar.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const parseGoogleDate = (dateInput?: { dateTime?: string; date?: string; timeZone?: string }): string | null => {
    if (!dateInput) return null;
    
    try {
      let dateString: string;
      let isAllDay = false;
      
      if (dateInput.date) {
        // All-day event
        dateString = dateInput.date;
        isAllDay = true;
      } else if (dateInput.dateTime) {
        // Timed event
        dateString = dateInput.dateTime;
      } else {
        return null;
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.warn('[parseGoogleDate] Invalid date string:', dateString);
        return null;
      }
      
      return date.toISOString();
    } catch (error) {
      console.error('[parseGoogleDate] Error parsing date:', dateInput, error);
      return null;
    }
  };

  const extractRRule = (recurrence?: string[]): string | null => {
    if (!recurrence || !Array.isArray(recurrence)) return null;
    
    const rruleEntry = recurrence.find(rule => rule.startsWith('RRULE:'));
    return rruleEntry ? rruleEntry.replace('RRULE:', '') : null;
  };

  const processGoogleCalendarWebhook = async (
    webhookEvents: GCalendarWebhookEvent[],
    googleCalendarId = 'primary',
    professionalProfileId?: string
  ): Promise<number> => {
    console.log('📥 Processando webhook do Google Calendar:', webhookEvents);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) {
        console.error('❌ Usuário não autenticado no webhook');
        throw new Error('User not authenticated');
      }

      const eventsToUpsert: Partial<GoogleCalendarEvent>[] = [];

      for (const event of webhookEvents) {
        if (!event.id) continue;

        const startTime = parseGoogleDate(event.start);
        const endTime = parseGoogleDate(event.end);
        
        if (!startTime || !endTime) {
          console.warn('Skipping event with invalid dates:', event.id);
          continue;
        }

        const isAllDay = Boolean(event.start?.date);
        const rrule = extractRRule(event.recurrence);

        const googleCalendarEvent: Partial<GoogleCalendarEvent> = {
          user_id: userData.user.id,
          professional_profile_id: professionalProfileId,
          google_calendar_id: googleCalendarId,
          google_event_id: event.id,
          etag: event.etag,
          ical_uid: event.iCalUID,
          summary: event.summary,
          description: event.description,
          location: event.location,
          start_time: startTime,
          end_time: endTime,
          timezone: event.start?.timeZone || 'America/Sao_Paulo',
          all_day: isAllDay,
          recurrence: event.recurrence || [],
          rrule: rrule,
          recurring_event_id: event.recurringEventId,
          original_start_time: parseGoogleDate(event.originalStartTime),
          is_recurring_instance: Boolean(event.recurringEventId),
          status: event.status || 'confirmed',
          attendees: event.attendees || [],
          reminders: event.reminders || {},
          sequence: event.sequence || 0,
          event_type: event.eventType,
        };

        eventsToUpsert.push(googleCalendarEvent);
      }

      if (eventsToUpsert.length === 0) {
        toast({
          title: 'Nenhum evento válido',
          description: 'Nenhum evento válido foi encontrado para processar.',
        });
        return 0;
      }

      // Filter out incomplete events and ensure proper typing
      const validEvents = eventsToUpsert.filter(event => 
        event.user_id && event.google_calendar_id && event.google_event_id && 
        event.start_time && event.end_time
      ) as Array<{
        user_id: string;
        google_calendar_id: string;
        google_event_id: string;
        start_time: string;
        end_time: string;
        [key: string]: any;
      }>;

      if (validEvents.length === 0) {
        throw new Error('No valid events to upsert');
      }

      console.log(`💾 Inserindo ${validEvents.length} eventos no banco...`);

      // Upsert events in Google Calendar events table
      const { data, error } = await supabase
        .from('google_calendar_events')
        .upsert(validEvents, {
          onConflict: 'user_id,google_calendar_id,google_event_id',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error('❌ Erro ao inserir eventos:', error);
        throw error;
      }

      const eventCount = data?.length || 0;
      console.log(`✅ ${eventCount} eventos inseridos/atualizados com sucesso`);

      // Sync the newly saved events with appointments
      console.log('🔄 Iniciando sincronização com appointments...');
      const appointmentsCreated = await syncGoogleCalendarWithAppointments();
      console.log(`✅ Sincronização concluída - ${appointmentsCreated} appointments criados`);

      toast({
        title: 'Sincronização completa',
        description: `${eventCount} evento(s) processados e ${appointmentsCreated || 0} agendamento(s) criado(s).`,
      });

      return eventCount;
    } catch (error) {
      console.error('Error processing Google Calendar webhook:', error);
      
      // Still try to sync existing events even if processing failed
      try {
        console.log('🔄 Tentando sincronizar appointments existentes após erro...');
        await syncGoogleCalendarWithAppointments();
      } catch (syncError) {
        console.error('❌ Erro na sincronização de fallback:', syncError);
      }
      
      toast({
        title: 'Erro na sincronização',
        description: 'Erro ao processar eventos do Google Calendar.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const syncGoogleCalendarWithAppointments = async () => {
    try {
      console.log('🔄 Sincronizando eventos do Google Calendar com appointments...');
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) {
        console.error('❌ Usuário não autenticado');
        throw new Error('User not authenticated');
      }

      // Get all Google Calendar events that should create appointments
      const { data: calendarEvents, error: eventsError } = await supabase
        .from('google_calendar_events')
        .select('*')
        .eq('user_id', userData.user.id);

      if (eventsError) {
        console.error('❌ Erro ao buscar eventos:', eventsError);
        throw eventsError;
      }

      if (!calendarEvents || calendarEvents.length === 0) {
        console.log('ℹ️ Nenhum evento do Google Calendar encontrado');
        return;
      }

      console.log(`📅 Encontrados ${calendarEvents.length} eventos do Google Calendar`);

      // Get existing appointments with Google event IDs
      const eventIds = calendarEvents.map(event => event.google_event_id);
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('google_event_id, google_calendar_id')
        .in('google_event_id', eventIds)
        .eq('user_id', userData.user.id);

      const existingEventMap = new Set(
        existingAppointments?.map(apt => `${apt.google_calendar_id}-${apt.google_event_id}`) || []
      );

      // Create appointments for events that don't exist
      const appointmentsToCreate = calendarEvents
        .filter(event => !existingEventMap.has(`${event.google_calendar_id}-${event.google_event_id}`))
        .map(event => {
          // Parse attendees safely
          const attendees = Array.isArray(event.attendees) ? event.attendees : [];
          const firstAttendeeEmail = attendees.length > 0 && typeof attendees[0] === 'object' 
            ? (attendees[0] as any)?.email || '' 
            : '';

          return {
            user_id: userData.user.id,
            professional_profile_id: event.professional_profile_id,
            patient_name: event.summary || 'Evento Google Calendar',
            patient_phone: '', // Google Calendar doesn't provide phone
            patient_email: firstAttendeeEmail,
            appointment_date: event.start_time,
            duration_minutes: Math.round(
              (new Date(event.end_time).getTime() - new Date(event.start_time).getTime()) / (1000 * 60)
            ),
            appointment_type: null, // Regular appointment from Google Calendar
            status: event.status === 'cancelled' ? 'cancelled' : 'confirmed',
            notes: [
              event.description,
              event.location ? `Local: ${event.location}` : null,
              `Evento do Google Calendar`,
              `ID: ${event.google_event_id}`
            ].filter(Boolean).join('\n'),
            google_event_id: event.google_event_id,
            google_calendar_id: event.google_calendar_id,
            google_recurring_event_id: event.recurring_event_id,
            google_original_start_time: event.original_start_time,
            timezone: event.timezone,
            all_day: event.all_day,
          };
        });

      if (appointmentsToCreate.length > 0) {
        console.log(`💾 Inserindo ${appointmentsToCreate.length} appointments...`);
        console.log('📋 Appointments a serem criados:', appointmentsToCreate);
        
        const { data: insertedData, error: insertError } = await supabase
          .from('appointments')
          .insert(appointmentsToCreate)
          .select();

        if (insertError) {
          console.error('❌ Erro ao inserir appointments:', insertError);
          throw insertError;
        }

        console.log(`✅ ${insertedData?.length || 0} appointments criados com sucesso`);

        toast({
          title: 'Agendamentos sincronizados',
          description: `${appointmentsToCreate.length} agendamento(s) criado(s) automaticamente do Google Calendar.`,
        });
        
        return insertedData?.length || 0;
      } else {
        console.log('✅ Todos os eventos já têm appointments correspondentes');
        return 0;
      }

    } catch (error) {
      console.error('Error syncing Google Calendar with appointments:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Erro ao sincronizar eventos com agendamentos.',
        variant: 'destructive',
      });
    }
  };

  // Função para transformar eventos do N8N para o formato esperado
  const transformN8NEvents = (n8nEvents: N8NEvent[]): GCalendarWebhookEvent[] => {
    console.log('🔄 Transformando eventos do N8N:', n8nEvents);
    
    return n8nEvents.map(event => ({
      id: event.id,
      summary: event.summary,
      status: event.status || 'confirmed',
      start: event.start ? { dateTime: event.start } : undefined,
      end: event.end ? { dateTime: event.end } : undefined,
      location: event.location,
      attendees: Array.isArray(event.attendees) 
        ? event.attendees.map(email => ({ email }))
        : [],
      organizer: event.organizer ? { email: event.organizer } : undefined,
      sequence: 0,
      reminders: { useDefault: true }
    }));
  };

  useEffect(() => {
    fetchGoogleCalendarEvents();
  }, []);

  return {
    events,
    loading,
    fetchGoogleCalendarEvents,
    processGoogleCalendarWebhook,
    syncGoogleCalendarWithAppointments,
    transformN8NEvents, // Exportar nova função
    refetch: fetchGoogleCalendarEvents,
  };
};