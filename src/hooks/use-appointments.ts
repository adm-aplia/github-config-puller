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
  agent_id?: string;
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
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  location?: string;
  attendees?: Array<{ email?: string; responseStatus?: string }>;
};

function isoFromGCal(dt?: {dateTime?: string; date?: string; timeZone?: string}) {
  if (!dt) return null;
  // date (all-day) -> trata como 00:00 local em UTC
  if (dt.date) return new Date(dt.date + 'T00:00:00').toISOString();
  if (dt.dateTime) return new Date(dt.dateTime).toISOString();
  return null;
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
      console.debug('[google-events] professionalId:', professionalId);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('User not authenticated');

      // Handle multiple payload formats from N8N webhook
      const events: GCalEvent[] =
        payload?.events ??
        payload?.items ??
        (Array.isArray(payload) ? payload : []);

      if (!Array.isArray(events) || events.length === 0) {
        throw new Error('No events provided');
      }

      const appointmentsToInsert = events
        .filter(event => event?.id) // Only process events with valid IDs
        .map(event => {
          const startDate = isoFromGCal(event.start);
          const endDate = isoFromGCal(event.end);
          
          // Calculate duration from start/end times
          let durationMinutes = 60; // default
          if (startDate && endDate) {
            const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime();
            durationMinutes = Math.round(diffMs / (1000 * 60));
          }

          return {
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
            agent_id: professionalId || null,
          };
        });

      if (appointmentsToInsert.length === 0) {
        throw new Error('No valid events after mapping');
      }

      console.log('Appointments to upsert:', appointmentsToInsert);

      const { data, error } = await supabase
        .from('appointments')
        .upsert(appointmentsToInsert, { 
          onConflict: 'google_event_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Successfully upserted appointments:', data);
      await fetchAppointments(); // Refresh the list
      return data.length;
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
    return updateAppointment(appointmentId, { appointment_date: newDateTime });
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
    createAppointmentsFromGoogleEvents,
    updateAppointment,
    updateAppointmentStatus,
    rescheduleAppointment,
    deleteAppointment,
  };
};