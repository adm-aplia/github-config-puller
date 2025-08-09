import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface AppointmentStats {
  total: number;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  rescheduled: number;
}

export const useAppointmentStats = (period: 'today' | '7days' | '30days' = 'today') => {
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    rescheduled: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('User not authenticated');

      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
      }

      // Fetch appointments for the user within the date range
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('status')
        .eq('user_id', userData.user.id)
        .gte('appointment_date', startDate.toISOString());

      if (error) throw error;

      // Calculate statistics
      const total = appointments?.length || 0;
      const scheduled = appointments?.filter(apt => apt.status === 'scheduled').length || 0;
      const confirmed = appointments?.filter(apt => apt.status === 'confirmed').length || 0;
      const completed = appointments?.filter(apt => apt.status === 'completed').length || 0;
      const cancelled = appointments?.filter(apt => apt.status === 'cancelled').length || 0;
      const rescheduled = appointments?.filter(apt => apt.status === 'rescheduled').length || 0;

      setStats({
        total,
        scheduled,
        confirmed,
        completed,
        cancelled,
        rescheduled
      });

    } catch (error) {
      console.error('Error fetching appointment stats:', error);
      toast({
        title: 'Erro ao carregar estatísticas',
        description: 'Não foi possível carregar as estatísticas dos agendamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  const getPercentage = (value: number) => {
    if (stats.total === 0) return '0%';
    return `${Math.round((value / stats.total) * 100)}%`;
  };

  return {
    stats,
    loading,
    refetch: fetchStats,
    getPercentage
  };
};