
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
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('User not authenticated');

      // Buscar estatísticas do dashboard usando a função RPC
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_dashboard_stats', { p_user_id: userData.user.id });

      if (statsError) {
        console.error('Error calling get_dashboard_stats:', statsError);
        throw statsError;
      }

      console.log('Stats data from RPC:', statsData);

      if (statsData && typeof statsData === 'object' && !Array.isArray(statsData)) {
        setStats(statsData as unknown as DashboardStats);
      } else {
        // Fallback: buscar dados diretamente das tabelas se a função RPC não funcionar
        console.log('Using fallback stats calculation');
        
        const [assistentesData, instanciasData, conversasData, agendamentosData] = await Promise.all([
          supabase.from('professional_profiles').select('id', { count: 'exact', head: true }).eq('user_id', userData.user.id),
          supabase.from('whatsapp_instances').select('id, status', { count: 'exact' }).eq('user_id', userData.user.id),
          supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', userData.user.id).or(`last_message_at.gte.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()},and(last_message_at.is.null,created_at.gte.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()})`),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('user_id', userData.user.id).gte('appointment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        ]);

        // Get conversations for today's messages count
        const { data: todayConversations } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', userData.user.id);

        let mensagensHoje = 0;
        if (todayConversations && todayConversations.length > 0) {
          const conversationIds = todayConversations.map(c => c.id);
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date();
          endOfDay.setHours(23, 59, 59, 999);

          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', conversationIds)
            .gte('created_at', startOfDay.toISOString())
            .lte('created_at', endOfDay.toISOString());

          mensagensHoje = count || 0;
        }

        const instanciasAtivas = instanciasData.data?.filter(inst => inst.status === 'connected').length || 0;

        const fallbackStats: DashboardStats = {
          total_assistentes: assistentesData.count || 0,
          total_instancias: instanciasData.count || 0,
          instancias_ativas: instanciasAtivas,
          conversas_ativas: conversasData.count || 0,
          agendamentos_mes: agendamentosData.count || 0,
          mensagens_hoje: mensagensHoje
        };

        setStats(fallbackStats);
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
      
      // Em caso de erro, definir estatísticas vazias
      setStats({
        total_assistentes: 0,
        total_instancias: 0,
        instancias_ativas: 0,
        conversas_ativas: 0,
        agendamentos_mes: 0,
        mensagens_hoje: 0
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
