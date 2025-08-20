import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  created_at: string;
  updated_at: string;
}

type GCalEvent = {
  id: string;
  summary?: string;
  description?: string;
  status?: string;
  start?: string | { dateTime?: string; date?: string };
  end?: string | { dateTime?: string; date?: string };
  location?: string;
  attendees?: Array<{ email?: string; responseStatus?: string }>;
  organizer?: string;
  htmlLink?: string;
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

  const createAppointmentsFromGoogleEvents = async (payload: any, professionalId?: string) => {
    try {
      console.debug('[google-events] raw payload:', payload);
      console.debug('[google-events] professionalId param:', professionalId);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('User not authenticated');

      // Extract professionalProfileId from the webhook response
      const professionalProfileId = payload?.professionalProfileId || professionalId;
      console.debug('[google-events] using professionalProfileId:', professionalProfileId);

      // Handle multiple payload formats from N8N webhook
      const eventsData = payload?.response ? JSON.parse(payload.response) : payload;
      const events: GCalEvent[] =
        eventsData?.events ??
        eventsData?.items ??
        (Array.isArray(eventsData) ? eventsData : []);

      if (!Array.isArray(events) || events.length === 0) {
        throw new Error('No events provided');
      }

      // Get existing Google event IDs to check for duplicates
      const eventIds = events.filter(event => event?.id).map(event => event.id);
      const { data: existingAppointments } = await supabase
        .from('appointments')
        .select('google_event_id')
        .in('google_event_id', eventIds)
        .eq('user_id', userData.user.id);

      const existingEventIds = new Set(existingAppointments?.map(apt => apt.google_event_id) || []);

      const appointmentsToInsert = events
        .filter(event => event?.id) // Only process events with valid IDs
        .filter(event => !existingEventIds.has(event.id)) // Skip existing events
        .map(event => {
          console.debug('[mapping-event] Processing event:', event);
          
          const startDate = parseGoogleDate(event.start);
          const endDate = parseGoogleDate(event.end);
          
          console.debug('[mapping-event] Parsed dates:', { startDate, endDate });
          
          // Validar se a data de início é válida (obrigatória)
          if (!startDate) {
            console.error('[mapping-event] Missing or invalid start date for event:', event.id);
            return null; // Será filtrado depois
          }
          
          // Calculate duration from start/end times
          let durationMinutes = 60; // default
          if (startDate && endDate) {
            const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
            durationMinutes = Math.round(diffMs / (1000 * 60));
          }

          const appointment = {
            user_id: userData.user.id,
            google_event_id: event.id,
            patient_name: event.summary || 'Sem título',
            patient_email: event.attendees?.[0]?.email || null,
            patient_phone: '(00) 00000-0000', // Default phone since Google Calendar doesn't provide this
            appointment_date: startDate,
            duration_minutes: durationMinutes,
            appointment_type: event.summary || 'Consulta',
            status: event.status === 'cancelled' ? 'cancelled' : 'confirmed',
            notes: [
              event.description,
              event.location ? `Local: ${event.location}` : null
            ].filter(Boolean).join('\n') || null,
            professional_profile_id: professionalProfileId || null,
          };
          
          console.debug('[mapping-event] Created appointment:', appointment);
          return appointment;
        })
        .filter(Boolean); // Remove eventos com erro de parsing

      const totalEvents = events.length;
      const skippedEvents = totalEvents - appointmentsToInsert.length;

      if (appointmentsToInsert.length === 0) {
        toast({
          title: 'Nenhum evento novo',
          description: `${skippedEvents} evento(s) já existem no sistema.`,
        });
        return 0;
      }

      console.log('Appointments to insert:', appointmentsToInsert);

      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentsToInsert) 
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Successfully inserted appointments:', data);
      await fetchAppointments(); // Refresh the list
      
      // Show success message with details
      const newEventsCount = data?.length || 0;
      if (skippedEvents > 0) {
        toast({
          title: 'Eventos importados',
          description: `${newEventsCount} novos eventos importados. ${skippedEvents} evento(s) já existiam.`,
        });
      } else {
        toast({
          title: 'Eventos importados',
          description: `${newEventsCount} evento(s) importados com sucesso.`,
        });
      }
      
      return newEventsCount;
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
        status: appointmentData.status || "agendado",
        summary: `Consulta com ${appointmentData.patient_name}`,
        notes: appointmentData.notes || `Paciente: ${appointmentData.patient_name}. Telefone: ${formattedPhone}. E-mail: ${appointmentData.patient_email || 'Não informado'}.`
      };

      // Send to webhook in the correct array format
      const payload = [{
        query: JSON.stringify(queryObj)
      }];

      console.log('Sending webhook payload:', JSON.stringify(payload, null, 2));

      const response = await fetch('https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/agendamento-aplia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      // Also save locally in Supabase
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: userData.user.id,
          patient_name: appointmentData.patient_name,
          patient_phone: appointmentData.patient_phone,
          patient_email: appointmentData.patient_email,
          appointment_date: appointmentData.appointment_date,
          duration_minutes: appointmentData.duration_minutes || 60,
          appointment_type: appointmentData.appointment_type,
          status: appointmentData.status || 'agendado',
          notes: appointmentData.notes,
          professional_profile_id: appointmentData.professional_profile_id,
          conversation_id: appointmentData.conversation_id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setAppointments(prev => [...prev, data]);
      
      toast({
        title: 'Agendamento criado',
        description: 'O agendamento foi criado e enviado para processamento.',
      });

      return data;
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

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    return updateAppointment(appointmentId, { status: newStatus });
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

  return {
    appointments,
    loading,
    fetchAppointments,
    createAppointment,
    createAppointmentsFromGoogleEvents,
    updateAppointment,
    updateAppointmentStatus,
    rescheduleAppointment,
    deleteAppointment,
  };
};