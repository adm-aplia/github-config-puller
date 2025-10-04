import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

// Interface para dados recebidos do webhook N8N
// Interface para dados do N8N - formato antigo
export interface N8NWebhookData {
  my_email: string;
  count: number;
  events: N8NEvent[];
}

// Interface para dados do N8N - novo formato com response
export interface N8NWebhookDataNew {
  response: string; // JSON string contendo array de eventos
  count: number;
  professionalProfileId: string;
}

// Interface para eventos vindos do N8N
export interface N8NEvent {
  id: string;
  summary?: string;
  start?: string; // String direta do N8N em formato ISO
  end?: string;   // String direta do N8N em formato ISO
  organizer?: string;
  attendees?: string[]; // Array de emails
  htmlLink?: string;
  location?: string | null;
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

  // Parse date input to get proper timestamp - melhorado para formato ISO do N8N
  const parseGoogleDate = (dateInput?: string | { dateTime?: string; date?: string; timeZone?: string }): string | null => {
    console.log('🔍 [parseGoogleDate] Input recebido:', dateInput);
    
    if (!dateInput) {
      console.log('❌ [parseGoogleDate] Input vazio ou null');
      return null;
    }
    
    try {
      let dateString: string;
      
      // Handle Google Calendar's date format (object with dateTime or date)
      if (typeof dateInput === 'object') {
        dateString = dateInput.dateTime || dateInput.date || '';
        console.log('📅 [parseGoogleDate] Objeto detectado, dateString extraído:', dateString);
      } else {
        dateString = dateInput;
        console.log('📅 [parseGoogleDate] String direta recebida:', dateString);
      }
      
      if (!dateString) {
        console.log('❌ [parseGoogleDate] DateString vazio após extração');
        return null;
      }
      
      // Tentar diferentes formatos de data
      let date: Date;
      
      // Formato ISO completo (N8N): "2025-03-28T07:45:00-03:00"
      if (dateString.includes('T') && (dateString.includes('-') || dateString.includes('+'))) {
        date = new Date(dateString);
        console.log('📝 [parseGoogleDate] Formato ISO detectado');
      }
      // Formato de data simples: "2025-03-28"
      else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(dateString + 'T00:00:00');
        console.log('📝 [parseGoogleDate] Formato data simples detectado');
      }
      // Formato UTC: "2025-03-28T10:45:00Z"
      else if (dateString.endsWith('Z')) {
        date = new Date(dateString);
        console.log('📝 [parseGoogleDate] Formato UTC detectado');
      }
      // Fallback: tentar parseamento direto
      else {
        date = new Date(dateString);
        console.log('📝 [parseGoogleDate] Fallback: parseamento direto');
      }
      
      if (isNaN(date.getTime())) {
        console.error('❌ [parseGoogleDate] Data inválida após parsing:', dateString);
        return null;
      }
      
      const result = date.toISOString();
      console.log('✅ [parseGoogleDate] Data parseada com sucesso:', result);
      return result;
    } catch (error) {
      console.error('💥 [parseGoogleDate] Erro ao parsear data:', dateInput, error);
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
    console.log('📥 Processando webhook do Google Calendar diretamente para appointments:', webhookEvents);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) {
        console.error('❌ Usuário não autenticado no webhook');
        throw new Error('User not authenticated');
      }

      const appointmentsToCreate = [];

      for (const event of webhookEvents) {
        if (!event.id) continue;

        const startTime = parseGoogleDate(event.start);
        const endTime = parseGoogleDate(event.end);
        
        // Validar dados essenciais antes de processar
        if (!startTime || !endTime) {
          console.warn('⏭️ Pulando evento com datas inválidas:', event.id);
          continue;
        }

        const isAllDay = Boolean(event.start?.date);
        
        // Parse attendees safely
        const attendees = event.attendees || [];
        const firstAttendeeEmail = attendees.length > 0 && typeof attendees[0] === 'object' 
          ? attendees[0]?.email || '' 
          : '';

        // Validar originalStartTime se existir
        const originalStartTime = event.originalStartTime 
          ? parseGoogleDate(event.originalStartTime) 
          : null;

        const appointment = {
          id: crypto.randomUUID(), // Gerar UUID único para cada appointment
          user_id: userData.user.id,
          professional_profile_id: professionalProfileId,
          patient_name: event.summary || 'Evento Google Calendar',
          patient_phone: 'Google Calendar', // Required field - using placeholder
          patient_email: firstAttendeeEmail,
          appointment_date: startTime,
          duration_minutes: Math.round(
            (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60)
          ),
          appointment_type: null, // Regular appointment from Google Calendar
          status: event.status === 'cancelled' ? 'cancelled' : 'confirmed',
          notes: [
            event.description,
            event.location ? `Local: ${event.location}` : null,
            `Evento do Google Calendar`,
            `ID: ${event.id}`
          ].filter(Boolean).join('\n'),
          google_event_id: event.id,
          google_calendar_id: googleCalendarId,
          google_recurring_event_id: event.recurringEventId,
          google_original_start_time: originalStartTime,
          timezone: event.start?.timeZone || 'America/Sao_Paulo',
          all_day: isAllDay,
        };

        appointmentsToCreate.push(appointment);
      }

      if (appointmentsToCreate.length === 0) {
        console.log('ℹ️ Nenhum novo appointment para criar');
        toast({
          title: 'Nenhum evento novo',
          description: 'Todos os eventos já foram sincronizados.',
        });
        return 0;
      }

      console.log(`💾 Processando ${appointmentsToCreate.length} appointments...`);

      // Processar em lotes de 50 para evitar timeout
      const BATCH_SIZE = 50;
      let totalInserted = 0;
      let totalErrors = 0;

      for (let i = 0; i < appointmentsToCreate.length; i += BATCH_SIZE) {
        const batch = appointmentsToCreate.slice(i, i + BATCH_SIZE);
        console.log(`📦 Processando lote ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(appointmentsToCreate.length / BATCH_SIZE)} (${batch.length} appointments)...`);

        try {
          // 1. Extrair google_event_ids do lote
          const eventIds = batch.map(a => a.google_event_id).filter(Boolean);
          
          // 2. Buscar quais já existem no banco
          const { data: existing } = await supabase
            .from('appointments')
            .select('google_event_id')
            .in('google_event_id', eventIds);
          
          const existingIds = new Set(existing?.map(e => e.google_event_id) || []);
          
          // 3. Filtrar apenas novos appointments
          const newAppointments = batch.filter(a => !existingIds.has(a.google_event_id));
          
          // 4. Inserir apenas os novos
          if (newAppointments.length > 0) {
            const { data: insertedData, error } = await supabase
              .from('appointments')
              .insert(newAppointments)
              .select();

            if (error) {
              console.error('❌ Erro ao inserir lote de appointments:', error);
              totalErrors++;
            } else {
              const inserted = insertedData?.length || 0;
              totalInserted += inserted;
              console.log(`✅ ${inserted} novos appointments inseridos neste lote`);
            }
          } else {
            console.log(`ℹ️ Nenhum appointment novo neste lote (todos já existem)`);
          }
        } catch (error) {
          console.error('❌ Erro ao processar lote:', error);
          totalErrors++;
        }
      }

      console.log(`✅ Total processado: ${totalInserted} appointments`);
      if (totalErrors > 0) {
        console.warn(`⚠️ ${totalErrors} lotes com erros`);
      }

      toast({
        title: 'Agendamentos sincronizados',
        description: `${totalInserted} agendamento(s) processado(s) do Google Calendar${totalErrors > 0 ? ` (${totalErrors} lotes com avisos)` : ''}.`,
      });

      return totalInserted;
    } catch (error) {
      console.error('Error processing Google Calendar webhook:', error);
      
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
            patient_phone: 'Google Calendar', // Required field - using placeholder
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
          .upsert(appointmentsToCreate, {
            onConflict: 'google_event_id',
            ignoreDuplicates: true
          })
          .select();

        if (insertError) {
          // Handle duplicate key error specifically
          if (insertError.code === '23505') {
            console.warn('⚠️ Alguns eventos já existem (duplicate key), mas continuando...');
            toast({
              title: 'Sincronização parcial',
              description: 'Alguns eventos já existiam e foram ignorados.',
            });
            return 0;
          }
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

  // Função para processar dados do webhook N8N - suporta formatos antigo e novo
  const processN8NWebhookData = async (
    webhookData: N8NWebhookData | N8NWebhookDataNew,
    professionalProfileId?: string
  ): Promise<number> => {
    console.log('📥 [processN8NWebhookData] Iniciando processamento dos dados do webhook N8N');
    
    // Detectar formato e normalizar dados
    let events: N8NEvent[] = [];
    let userEmail: string = '';
    let profileId: string | undefined = professionalProfileId;
    
    // Verificar se é o novo formato (com response)
    if ('response' in webhookData) {
      console.log('🆕 [processN8NWebhookData] Detectado formato novo do N8N');
      const newFormatData = webhookData as N8NWebhookDataNew;
      
      try {
        console.log('📋 [processN8NWebhookData] Parseando JSON da response...');
        events = JSON.parse(newFormatData.response);
        profileId = newFormatData.professionalProfileId;
        userEmail = events[0]?.organizer || 'unknown';
        
        console.log('📊 [processN8NWebhookData] Dados do novo formato:', {
          count: newFormatData.count,
          eventsLength: events.length,
          professionalProfileId: profileId,
          userEmail
        });
      } catch (parseError) {
        console.error('💥 [processN8NWebhookData] Erro ao fazer parse do JSON da response:', parseError);
        throw new Error('Erro ao fazer parse dos eventos do campo response');
      }
    } else {
      console.log('🔄 [processN8NWebhookData] Detectado formato antigo do N8N');
      const oldFormatData = webhookData as N8NWebhookData;
      events = oldFormatData.events;
      userEmail = oldFormatData.my_email;
      
      console.log('📊 [processN8NWebhookData] Dados do formato antigo:', {
        email: userEmail,
        count: oldFormatData.count,
        eventsLength: events?.length || 0,
        professionalProfileId: profileId
      });
    }
    
    if (!events || events.length === 0) {
      console.log('⚠️ [processN8NWebhookData] Nenhum evento encontrado no webhook');
      throw new Error('Nenhum evento encontrado no webhook N8N');
    }
    
    console.log('🔄 [processN8NWebhookData] Eventos brutos do N8N:', events);
    
    try {
      // Verificar autenticação
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) {
        console.error('❌ [processN8NWebhookData] Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      console.log('✅ [processN8NWebhookData] Usuário autenticado:', userData.user.id);
      
      // Processar eventos diretamente como appointments
      const appointmentsToCreate = [];
      
      for (const event of events) {
        console.log('🔄 [processN8NWebhookData] Processando evento:', event.id);
        
        const startDate = parseGoogleDate(event.start);
        const endDate = parseGoogleDate(event.end);
        
        if (!startDate) {
          console.error('❌ [processN8NWebhookData] Data de início inválida para evento:', event.id);
          continue;
        }
        
        console.log('📅 [processN8NWebhookData] Datas parseadas:', { startDate, endDate });
        
        // Verificar se já existe
        const { data: existingAppointment } = await supabase
          .from('appointments')
          .select('id')
          .eq('user_id', userData.user.id)
          .eq('google_event_id', event.id)
          .maybeSingle();
        
        if (existingAppointment) {
          console.log('⚠️ [processN8NWebhookData] Appointment já existe para evento:', event.id);
          continue;
        }
        
        const durationMinutes = startDate && endDate 
          ? Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60))
          : 60;
        
        console.log('🆔 [processN8NWebhookData] Usando profileId para appointment:', profileId);
        
        const appointmentData = {
          user_id: userData.user.id,
          professional_profile_id: profileId || null,
          patient_name: event.summary || 'Evento Google Calendar',
          patient_phone: 'Google Calendar', // Campo obrigatório - usar placeholder
          patient_email: event.attendees?.[0] || null,
          appointment_date: startDate,
          duration_minutes: durationMinutes,
          appointment_type: 'google_sync',
          status: 'confirmed',
          notes: [
            event.summary,
            event.location ? `Local: ${event.location}` : null,
            `Importado do Google Calendar`,
            `ID: ${event.id}`,
            `Email organizador: ${userEmail}`
          ].filter(Boolean).join('\n'),
          google_event_id: event.id,
          google_calendar_id: 'primary',
          timezone: 'America/Sao_Paulo',
          all_day: false,
        };
        
        console.log('💾 [processN8NWebhookData] Appointment preparado:', appointmentData);
        appointmentsToCreate.push(appointmentData);
      }
      
      console.log(`📝 [processN8NWebhookData] Total de appointments para criar: ${appointmentsToCreate.length}`);
      
      if (appointmentsToCreate.length === 0) {
        console.log('⚠️ [processN8NWebhookData] Nenhum appointment novo para criar');
        return 0;
      }
      
      // Inserir appointments usando upsert
      const { data: insertedAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .upsert(appointmentsToCreate, {
          onConflict: 'google_event_id',
          ignoreDuplicates: true
        })
        .select();
      
      if (appointmentsError) {
        // Handle duplicate key error specifically
        if (appointmentsError.code === '23505') {
          console.warn('⚠️ [processN8NWebhookData] Alguns eventos já existem (duplicate key), mas continuando...');
          toast({
            title: 'Sincronização parcial',
            description: 'Alguns eventos já existiam e foram ignorados.',
          });
          return 0;
        }
        console.error('💥 [processN8NWebhookData] Erro ao inserir appointments:', appointmentsError);
        throw appointmentsError;
      }
      
      console.log('✅ [processN8NWebhookData] Appointments inseridos com sucesso:', insertedAppointments?.length || 0);
      
      // Atualizar lista de appointments
      await fetchGoogleCalendarEvents();
      
      return appointmentsToCreate.length;
    } catch (error) {
      console.error('💥 [processN8NWebhookData] Erro geral:', error);
      throw error;
    }
  };

  // Função para transformar eventos do N8N para o formato esperado
  const transformN8NEvents = (n8nEvents: N8NEvent[]): GCalendarWebhookEvent[] => {
    console.log('🔄 [transformN8NEvents] Transformando eventos do N8N:', n8nEvents.length);
    
    return n8nEvents.map(event => {
      console.log('🔄 [transformN8NEvents] Transformando evento:', event.id);
      
      const result = {
        id: event.id,
        summary: event.summary,
        status: 'confirmed' as const,
        start: event.start ? { dateTime: event.start } : undefined,
        end: event.end ? { dateTime: event.end } : undefined,
        location: event.location || undefined,
        attendees: Array.isArray(event.attendees) 
          ? event.attendees.map(email => ({ email }))
          : [],
        organizer: event.organizer ? { email: event.organizer } : undefined,
        sequence: 0,
        reminders: { useDefault: true }
      };
      
      console.log('✅ [transformN8NEvents] Evento transformado:', result);
      return result;
    });
  };

  // Função de teste para simular dados do N8N (novo formato)
  const testN8NWebhookData = async (professionalProfileId?: string) => {
    console.log('🧪 [testN8NWebhookData] Iniciando teste com dados mock no novo formato');
    
    const mockEvents = [
      {
        id: "test_event_" + Date.now(),
        summary: "Teste - Treino",
        start: "2025-03-28T07:45:00-03:00",
        end: "2025-03-28T09:15:00-03:00",
        organizer: "nathancwb@gmail.com",
        attendees: [],
        htmlLink: "https://test.google.com/calendar/event",
        location: null
      }
    ];

    const mockWebhookData: N8NWebhookDataNew = {
      response: JSON.stringify(mockEvents),
      count: mockEvents.length,
      professionalProfileId: professionalProfileId || "83a961bc-2042-407e-9c09-c4a0e29c51de"
    };
    
    try {
      const result = await processN8NWebhookData(mockWebhookData);
      console.log('✅ [testN8NWebhookData] Teste concluído com sucesso:', result);
      toast({
        title: 'Teste executado',
        description: `${result} appointment(s) criado(s) no teste.`,
      });
      return result;
    } catch (error) {
      console.error('💥 [testN8NWebhookData] Erro no teste:', error);
      toast({
        title: 'Erro no teste',
        description: error instanceof Error ? error.message : 'Erro desconhecido no teste',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchGoogleCalendarEvents();
  }, []);

  return {
    events,
    loading,
    fetchGoogleCalendarEvents,
    processGoogleCalendarWebhook,
    processN8NWebhookData, // Nova função para processar dados do N8N
    syncGoogleCalendarWithAppointments,
    transformN8NEvents,
    testN8NWebhookData, // Função de teste para debug
    refetch: fetchGoogleCalendarEvents,
  };
};