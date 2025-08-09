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
  created_at: string;
  updated_at: string;
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

  const createAppointmentsFromGoogleEvents = async (events: any[]) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('User not authenticated');

      const appointmentsToInsert = events.map(event => ({
        user_id: userData.user.id,
        patient_name: event.summary || 'Sem título',
        patient_email: event.attendees && event.attendees.length > 0 ? event.attendees[0] : null,
        patient_phone: '(00) 00000-0000', // Default phone since Google Calendar doesn't provide this
        appointment_date: event.start,
        duration_minutes: 60, // Default duration
        appointment_type: event.summary || 'Consulta',
        status: 'confirmed',
        notes: event.location ? `Local: ${event.location}` : null,
      }));

      const { data, error } = await supabase
        .from('appointments')
        .insert(appointmentsToInsert)
        .select();

      if (error) throw error;

      setAppointments(prev => [...prev, ...data]);
      return data.length;
    } catch (error) {
      console.error('Error creating appointments from Google events:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return {
    appointments,
    loading,
    fetchAppointments,
    createAppointmentsFromGoogleEvents,
  };
};