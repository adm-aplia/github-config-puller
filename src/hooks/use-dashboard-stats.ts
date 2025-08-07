import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface DashboardStats {
  total_assistentes: number;
  total_instancias: number;
  instancias_ativas: number;
  conversas_ativas: number;
  agendamentos_mes: number;
  mensagens_hoje: number;
}

export interface ChartData {
  date: string;
  conversations: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('User not authenticated');

      // Buscar estatísticas do dashboard
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_dashboard_stats', { p_user_id: userData.user.id });

      if (statsError) throw statsError;

      if (statsData && typeof statsData === 'object' && !Array.isArray(statsData)) {
        setStats(statsData as unknown as DashboardStats);
      }

      // Buscar dados para o gráfico (últimos 7 dias)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date;
      });

      const chartDataPromises = last7Days.map(async (date) => {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { count } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userData.user.id)
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());

        return {
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          conversations: count || 0
        };
      });

      const chartDataResults = await Promise.all(chartDataPromises);
      setChartData(chartDataResults);

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: 'Erro ao carregar estatísticas',
        description: 'Não foi possível carregar as estatísticas do dashboard.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    chartData,
    loading,
    refetch: fetchStats,
  };
};