import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { normalizePhoneNumber } from '@/lib/whatsapp';

export interface Appointment {
  id: string;
  user_id: string;
  patient_name: string;
  patient_email?: string;
  patient_phone: string;
  appointment_date: string;
  duration_minutes?: number;
  appointment_type?: string;
  status: string;
  notes?: string;
  professional_profile_id?: string;
  conversation_id?: string;
  google_event_id?: string;
  google_calendar_id?: string;
  google_recurring_event_id?: string;
  google_original_start_time?: string;
  timezone?: string;
  all_day?: boolean;
  created_at: string;
  updated_at: string;
}

type GCalEvent = {
  id: string;
  summary?: string;
  description?: string;
  status?: string;
  start?: string | { dateTime?: string; date?: string; timeZone?: string };
  end?: string | { dateTime?: string; date?: string; timeZone?: string };
  location?: string;
  attendees?: Array<{ email?: string; responseStatus?: string }>;
  organizer?: string;
  htmlLink?: string;
  recurrence?: string[];
  recurringEventId?: string;
  originalStartTime?: { dateTime?: string; date?: string; timeZone?: string };
  sequence?: number;
  iCalUID?: string;
  etag?: string;
  reminders?: {
    useDefault?: boolean;
    overrides?: Array<{ method?: string; minutes?: number }>;
  };
  eventType?: string;
};

function parseGoogleDate(dateInput?: string | { dateTime?: string; date?: string }): string | null {
  if (!dateInput) return null;
  
  try {
    let dateString: string;
    
    // Handle Google Calendar's date format (object with dateTime or date)
    if (typeof dateInput === 'object') {
      dateString = dateInput.dateTime || dateInput.date || '';
    } else {
      dateString = dateInput;
    }
    
    if (!dateString) return null;
    
    // Parse the date
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
}

// Map Portuguese status to English for webhook
const mapStatusToEnglish = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'agendado': 'schedule',
    'confirmado': 'confirmed',
    'cancelled': 'cancelled',
    'blocked': 'blocked',
  };
  return statusMap[status] || status;
};

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Erro ao carregar agendamentos',
        description: 'Não foi possível carregar os agendamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to send individual appointment to webhook
  const sendAppointmentToWebhook = async (queryObj: any) => {
    const payload = [{ query: JSON.stringify(queryObj) }]
    
    const response = await fetch('https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/agendamento-aplia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`)
    }

    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  // Send cancellation webhook
  const sendCancellationWebhook = async (appointment: Appointment) => {
    const phoneNumber = normalizePhoneNumber(appointment.patient_phone);
    const formattedPhone = phoneNumber.startsWith('55') ? `+${phoneNumber}` : `+55${phoneNumber}`;
    
    const queryObj = {
      action: "cancel",
      lead_number: formattedPhone,
      agent_id: appointment.professional_profile_id,
      appointment_date: format(new Date(appointment.appointment_date), 'yyyy-MM-dd')
    };

    const payload = [{ query: JSON.stringify(queryObj) }];
    
    const response = await fetch('https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/cancelamento-site', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Cancellation webhook error: ${response.status}`);
    }

    const result = await response.json();
    console.log('[cancelamento-webhook] Response:', result);
    return result;
  }

  // Send deletion webhook
  const sendDeletionWebhook = async (appointment: Appointment) => {
    const phoneNumber = normalizePhoneNumber(appointment.patient_phone);
    const formattedPhone = phoneNumber.startsWith('55') ? `+${phoneNumber}` : `+55${phoneNumber}`;
    
    const queryObj = {
      action: "delete",
      lead_number: formattedPhone,
      agent_id: appointment.professional_profile_id,
      appointment_date: format(new Date(appointment.appointment_date), 'yyyy-MM-dd')
    };

    const payload = [{ query: JSON.stringify(queryObj) }];
    
    const response = await fetch('https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/deletar-site', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Deletion webhook error: ${response.status}`);
    }

    const result = await response.json();
    console.log('[deletar-webhook] Response:', result);
    return result;
  }

  const createAppointmentsFromGoogleEvents = async (payload: any, professionalId?: string) => {
    try {
      console.debug('[google-events] raw payload:', payload);
      console.debug('[google-events] professionalId param:', professionalId);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('User not authenticated');

      // Extract professionalProfileId from the webhook response
      const professionalProfileId = payload?.professionalProfileId || professionalId;
      const googleCalendarId = payload?.googleCalendarId || 'primary';
      console.debug('[google-events] using professionalProfileId:', professionalProfileId);
      console.debug('[google-events] using googleCalendarId:', googleCalendarId);

      // Handle multiple payload formats from N8N webhook
      const eventsData = payload?.response ? JSON.parse(payload.response) : payload;
      const events: GCalEvent[] =
        eventsData?.events ??
        eventsData?.items ??
        (Array.isArray(eventsData) ? eventsData : []);

      if (!Array.isArray(events) || events.length === 0) {
        throw new Error('No events provided');
      }

      // Process master events (with recurrence) first
      const masterEvents = events.filter(event => event.recurrence && !event.recurringEventId);
      const instanceEvents = events.filter(event => event.recurringEventId);
      const singleEvents = events.filter(event => !event.recurrence && !event.recurringEventId);

      let processedCount = 0;

      // 1. Store master events in google_calendar_events
      for (const event of masterEvents) {
        if (!event.id) continue;

        const startTime = parseGoogleDate(event.start);
        const endTime = parseGoogleDate(event.end);
        
        if (!startTime || !endTime) continue;

        const isAllDay = Boolean(typeof event.start === 'object' && 'date' in event.start);
        const rrule = event.recurrence?.find(r => r.startsWith('RRULE:'))?.replace('RRULE:', '') || null;

        const timezone = (typeof event.start === 'object' && event.start && 'timeZone' in event.start) 
          ? event.start.timeZone || 'America/Sao_Paulo' 
          : 'America/Sao_Paulo';

        const masterEventData = {
          user_id: userData.user.id,
          professional_profile_id: professionalProfileId || null,
          google_calendar_id: googleCalendarId,
          google_event_id: event.id,
          etag: event.etag || null,
          ical_uid: event.iCalUID || null,
          summary: event.summary || null,
          description: event.description || null,
          location: event.location || null,
          start_time: startTime,
          end_time: endTime,
          timezone: timezone,
          all_day: isAllDay,
          recurrence: event.recurrence || [],
          rrule: rrule,
          is_recurring_instance: false,
          status: event.status || 'confirmed',
          attendees: event.attendees || [],
          reminders: event.reminders || {},
          sequence: event.sequence || 0,
          event_type: event.eventType || null,
        };

        // Upsert master event
        const { error: masterError } = await supabase
          .from('google_calendar_events')
          .upsert(masterEventData, {
            onConflict: 'user_id,google_calendar_id,google_event_id',
            ignoreDuplicates: false,
          });

        if (masterError) {
          console.error('Error upserting master event:', masterError);
          continue;
        }

        processedCount++;
      }

      // 2. Process instances and single events for appointments
      const appointmentEvents = [...instanceEvents, ...singleEvents];
      
      // Get existing Google event IDs to check for duplicates
      const eventIds = appointmentEvents.filter(event => event?.id).map(event => event.id);
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('google_event_id, google_calendar_id')
        .eq('user_id', userData.user.id);

      const existingEventMap = new Set(
        existingAppointments?.map(apt => `${apt.google_calendar_id}-${apt.google_event_id}`) || []
      );

      const appointmentsToCreate = appointmentEvents
        .filter(event => event?.id)
        .filter(event => !existingEventMap.has(`${googleCalendarId}-${event.id}`))
        .map(event => {
          const startDate = parseGoogleDate(event.start);
          const endDate = parseGoogleDate(event.end);
          
          if (!startDate) return null;
          
          const durationMinutes = startDate && endDate 
            ? Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60))
            : 60;

          const isAllDay = Boolean(typeof event.start === 'object' && event.start && 'date' in event.start);
          const timezone = (typeof event.start === 'object' && event.start && 'timeZone' in event.start) 
            ? event.start.timeZone || 'America/Sao_Paulo' 
            : 'America/Sao_Paulo';

          return {
            user_id: userData.user.id,
            professional_profile_id: professionalProfileId || null,
            patient_name: event.summary || 'Evento Google Calendar',
            patient_phone: '', // Google Calendar doesn't provide phone
            patient_email: event.attendees?.[0]?.email || '',
            appointment_date: startDate,
            duration_minutes: durationMinutes,
            appointment_type: 'google_sync', // Mark as blocked so it doesn't count in limits
            status: event.status === 'cancelled' ? 'cancelled' : 'confirmed',
            notes: [
              event.description,
              event.location ? `Local: ${event.location}` : null,
              `Evento do Google Calendar`,
              `ID: ${event.id}`
            ].filter(Boolean).join('\n'),
            google_event_id: event.id,
            google_calendar_id: googleCalendarId,
            google_recurring_event_id: event.recurringEventId || null,
            google_original_start_time: event.originalStartTime ? parseGoogleDate(event.originalStartTime) : null,
            timezone: timezone,
            all_day: isAllDay,
          };
        })
        .filter(Boolean);

      if (appointmentsToCreate.length > 0) {
        const { error: appointmentsError } = await supabase
          .from('appointments')
          .upsert(appointmentsToCreate, {
            onConflict: 'user_id,google_calendar_id,google_event_id',
            ignoreDuplicates: false,
          });

        if (appointmentsError) {
          console.error('Error creating appointments:', appointmentsError);
        } else {
          processedCount += appointmentsToCreate.length;
        }
      }

      // Refresh appointments
      setTimeout(() => {
        fetchAppointments();
      }, 1000);

      const skippedEvents = events.length - processedCount;
      
      if (processedCount > 0) {
        toast({
          title: 'Eventos sincronizados',
          description: `${processedCount} evento(s) processados. ${skippedEvents > 0 ? `${skippedEvents} já existiam.` : ''}`,
        });
      } else {
        toast({
          title: 'Nenhum evento novo',
          description: 'Todos os eventos já existem no sistema.',
        });
      }
      
      return processedCount;
    } catch (error) {
      console.error('Error creating appointments from Google events:', error);
      toast({
        title: 'Erro ao importar eventos',
        description: error instanceof Error ? error.message : 'Erro desconhecido ao importar eventos',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const createAppointment = async (appointmentData: Partial<Appointment>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('User not authenticated');

      // Format phone with +55 prefix if not already present
      let formattedPhone = appointmentData.patient_phone?.replace(/\D/g, '') || ''; // Remove non-digits
      if (formattedPhone && !formattedPhone.startsWith('55')) {
        formattedPhone = `+55${formattedPhone}`;
      } else if (formattedPhone) {
        formattedPhone = `+${formattedPhone}`;
      }

      // Format date as required: "YYYY-MM-DD HH:mm:ss+00"
      let formattedDate = appointmentData.appointment_date;
      if (appointmentData.appointment_date) {
        const date = new Date(appointmentData.appointment_date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day} ${hour}:${minute}:00+00`;
      }

      // Create the webhook payload in the required format
      const queryObj = {
        action: "create",
        user_id: userData.user.id,
        agent_id: appointmentData.professional_profile_id,
        patient_name: appointmentData.patient_name,
        patient_phone: formattedPhone,
        patient_email: appointmentData.patient_email || "",
        appointment_date: formattedDate,
        status: mapStatusToEnglish(appointmentData.status || "agendado"),
        summary: `Consulta com ${appointmentData.patient_name}`,
        notes: appointmentData.notes || `Paciente: ${appointmentData.patient_name}. Telefone: ${formattedPhone}. E-mail: ${appointmentData.patient_email || 'Não informado'}.`
      };

      // Send to webhook only (no direct Supabase insert)
      await sendAppointmentToWebhook(queryObj);
      
      // Wait for backend processing, then refresh
      setTimeout(() => {
        fetchAppointments();
      }, 1500);
      
      toast({
        title: 'Agendamento criado',
        description: 'O agendamento foi enviado para processamento.',
      });

      return true;
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast({
        title: 'Erro ao criar agendamento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateAppointment = async (appointmentId: string, updates: Partial<Appointment>) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', appointmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, status: string) => {
    try {
      // Get appointment data first
      const { data: appointment } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (!appointment) throw new Error('Appointment not found');

      // If cancelling, send webhook first
      if (status === 'cancelled') {
        await sendCancellationWebhook(appointment);
      }

      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId);

      if (error) throw error;

      // If confirming a cancelled appointment, recreate it via webhook
      if (status === 'confirmed' && appointment.status === 'cancelled') {
        // Format phone with +55 prefix if not already present
        let formattedPhone = appointment.patient_phone?.replace(/\D/g, '') || '';
        if (formattedPhone && !formattedPhone.startsWith('55')) {
          formattedPhone = `+55${formattedPhone}`;
        } else if (formattedPhone) {
          formattedPhone = `+${formattedPhone}`;
        }

        // Format date as "YYYY-MM-DD HH:mm"
        const appointmentDate = new Date(appointment.appointment_date);
        const year = appointmentDate.getFullYear();
        const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
        const day = String(appointmentDate.getDate()).padStart(2, '0');
        const hour = String(appointmentDate.getHours()).padStart(2, '0');
        const minute = String(appointmentDate.getMinutes()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day} ${hour}:${minute}`;

        // Resolve Google email if available
        let myEmail = null;
        if (appointment.professional_profile_id) {
          const { data: profileLinks } = await supabase
            .from('google_profile_links')
            .select('google_credential_id')
            .eq('professional_profile_id', appointment.professional_profile_id);

          if (profileLinks && profileLinks.length > 0) {
            const { data: googleCredentials } = await supabase
              .from('google_credentials')
              .select('email')
              .eq('id', profileLinks[0].google_credential_id)
              .single();

            if (googleCredentials) {
              myEmail = googleCredentials.email;
            }
          }
        }

        const queryObj = {
          action: "create",
          user_id: appointment.user_id,
          agent_id: appointment.professional_profile_id,
          patient_name: appointment.patient_name,
          patient_phone: formattedPhone,
          patient_email: appointment.patient_email || "",
          appointment_date: formattedDate,
          status: mapStatusToEnglish('confirmed'),
          summary: `${appointment.appointment_type || 'Consulta'} com ${appointment.patient_name}`,
          notes: appointment.notes || `Paciente: ${appointment.patient_name}. Telefone: ${formattedPhone}. E-mail: ${appointment.patient_email || 'Não informado'}. Motivo: ${appointment.appointment_type || 'consulta'}.`,
          ...(myEmail && { my_email: myEmail })
        };
        
        console.log('[appointment-confirm] Enviando webhook de confirmação:', queryObj);
        await sendAppointmentToWebhook(queryObj);
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      throw error;
    }
  };

  const rescheduleAppointment = async (appointmentId: string, newDateTime: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('User not authenticated');

      // First, fetch the current appointment details
      const { data: appointment, error: fetchError } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (fetchError || !appointment) {
        throw new Error('Appointment not found');
      }

      // Format phone with +55 prefix if not already present
      let formattedPhone = appointment.patient_phone?.replace(/\D/g, '') || '';
      if (formattedPhone && !formattedPhone.startsWith('55')) {
        formattedPhone = `+55${formattedPhone}`;
      } else if (formattedPhone) {
        formattedPhone = `+${formattedPhone}`;
      }

      // Format current appointment datetime as "YYYY-MM-DD HH:mm"
      const currentDate = new Date(appointment.appointment_date);
      const currentYear = currentDate.getFullYear();
      const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
      const currentDay = String(currentDate.getDate()).padStart(2, '0');
      const currentHour = String(currentDate.getHours()).padStart(2, '0');
      const currentMinute = String(currentDate.getMinutes()).padStart(2, '0');
      const formattedCurrentDateTime = `${currentYear}-${currentMonth}-${currentDay} ${currentHour}:${currentMinute}`;

      // Format new_datetime as "YYYY-MM-DD HH:mm"
      const date = new Date(newDateTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const formattedDateTime = `${year}-${month}-${day} ${hour}:${minute}`;

      // Create first query object with current appointment details
      const currentQueryObj = {
        action: "current",
        user_id: userData.user.id,
        agent_id: (appointment as any).professional_profile_id,
        appointment_id: appointmentId,
        google_event_id: appointment.google_event_id || "",
        datetime: formattedCurrentDateTime,
        duration_minutes: appointment.duration_minutes || 60,
        status: appointment.status,
        summary: `Consulta ${appointment.appointment_type || 'médica'}`,
        notes: appointment.notes || "Consulta atual",
        patient_name: appointment.patient_name,
        patient_phone: formattedPhone,
        patient_email: appointment.patient_email || ""
      };

      // Create second query object with new appointment details
      const newQueryObj = {
        action: "update",
        user_id: userData.user.id,
        agent_id: (appointment as any).professional_profile_id,
        appointment_id: appointmentId,
        google_event_id: appointment.google_event_id || "",
        datetime: formattedDateTime,
        duration_minutes: appointment.duration_minutes || 60,
        status: "confirmed",
        summary: `Consulta ${appointment.appointment_type || 'médica'} (remarcada)`,
        notes: "Reagendado pelo sistema",
        patient_name: appointment.patient_name,
        patient_phone: formattedPhone,
        patient_email: appointment.patient_email || ""
      };

      // Send both queries to webhook in the correct array format
      const payload = [
        {
          query: JSON.stringify(currentQueryObj)
        },
        {
          query: JSON.stringify(newQueryObj)
        }
      ];

      console.log('Sending reschedule webhook payload:', JSON.stringify(payload, null, 2));

      const response = await fetch('https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/remarcar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      // Optionally refresh appointments after a delay to see changes
      setTimeout(() => {
        fetchAppointments();
      }, 2000);

      toast({
        title: 'Remarcação enviada',
        description: 'A remarcação foi enviada para processamento.',
      });

    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast({
        title: 'Erro ao remarcar agendamento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    try {
      // Get appointment data first
      const { data: appointment } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', appointmentId)
        .single();

      if (!appointment) throw new Error('Appointment not found');

      // Send deletion webhook first
      await sendDeletionWebhook(appointment);

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  };

  const updateBlockedAppointment = async (appointmentId: string, updatedData: Partial<Appointment>) => {
    try {
      const appointmentToUpdate = appointments.find(apt => apt.id === appointmentId)
      if (!appointmentToUpdate) {
        throw new Error('Appointment not found')
      }

      const userData = await supabase.auth.getUser()
      if (!userData.data.user) {
        throw new Error('User not authenticated')
      }

      // Format current appointment data
      const currentDateTime = format(new Date(appointmentToUpdate.appointment_date), "yyyy-MM-dd HH:mm:ss")
      
      // Format new appointment data
      const newDateTime = format(new Date(updatedData.appointment_date!), "yyyy-MM-dd HH:mm:ss")

      const payload = [
        {
          query: JSON.stringify({
            action: "current",
            user_id: userData.data.user.id,
            agent_id: appointmentToUpdate.professional_profile_id,
            appointment_id: appointmentId,
            datetime: currentDateTime,
            appointment_type: "blocked",
            patient_name: appointmentToUpdate.patient_name,
            patient_phone: appointmentToUpdate.patient_phone,
            notes: appointmentToUpdate.notes || "",
            duration_minutes: appointmentToUpdate.duration_minutes || 60
          })
        },
        {
          query: JSON.stringify({
            action: "update", 
            user_id: userData.data.user.id,
            agent_id: updatedData.professional_profile_id,
            appointment_id: appointmentId,
            datetime: newDateTime,
            appointment_type: "blocked",
            patient_name: updatedData.patient_name || "Bloqueio",
            patient_phone: updatedData.patient_phone || "000000000",
            notes: updatedData.notes || "",
            duration_minutes: updatedData.duration_minutes || 60
          })
        }
      ]

      const response = await fetch('https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/remarcar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Failed to update blocked appointment')
      }

      // Refresh appointments to get updated data
      await fetchAppointments()
    } catch (error) {
      console.error('Error updating blocked appointment:', error)
      throw error
    }
  }

  return {
    appointments,
    loading,
    fetchAppointments,
    createAppointment,
    createAppointmentsFromGoogleEvents,
    updateAppointment,
    updateAppointmentStatus,
    rescheduleAppointment,
    updateBlockedAppointment,
    deleteAppointment,
  };
};