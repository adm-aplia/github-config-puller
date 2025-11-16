
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface DashboardStats {
  total_assistentes: number;
  total_instancias: number;
  instancias_ativas: number;
  conversas_ativas: number;
  conversas_periodo: number;
  agendamentos_mes: number;
  agendamentos_periodo: number;
  mensagens_hoje: number;
}

export interface ChartData {
  date: string;
  conversations: number;
  appointments: number;
}

export const useDashboardStats = (chartDays: 7 | 15 | 30 | 90 = 7) => {
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
        .rpc('get_dashboard_stats', { 
          user_id_param: userData.user.id,
          days_param: chartDays 
        });

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
        
        const startDate = new Date(Date.now() - chartDays * 24 * 60 * 60 * 1000);
        
        const [assistentesData, instanciasData, conversasData, agendamentosData] = await Promise.all([
          supabase.from('professional_profiles').select('id', { count: 'exact', head: true }).eq('user_id', userData.user.id),
          supabase.from('whatsapp_instances').select('id, status', { count: 'exact' }).eq('user_id', userData.user.id),
          supabase.from('conversations').select('id, patient_phone').eq('user_id', userData.user.id).or(`last_message_at.gte.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()},and(last_message_at.is.null,created_at.gte.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()})`),
          supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('user_id', userData.user.id).gte('appointment_date', startDate.toISOString()).or('appointment_type.is.null,and(appointment_type.neq.blocked,appointment_type.neq.google_calendar)')
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
        
        // Contar contatos únicos para conversas ativas (últimos 7 dias)
        const uniqueActiveContacts = new Set(
          conversasData.data?.map(conv => conv.patient_phone) || []
        );

        // Calcular conversas_periodo usando os dados do gráfico
        const totalConversations = await Promise.all(
          Array.from({ length: chartDays }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (chartDays - 1 - i));
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            
            return supabase
              .from('conversations')
              .select('id, patient_phone')
              .eq('user_id', userData.user.id)
              .then(async ({ data: allConvs }) => {
                if (!allConvs || allConvs.length === 0) return new Set();
                
                const { data: msgs } = await supabase
                  .from('messages')
                  .select('conversation_id')
                  .in('conversation_id', allConvs.map(c => c.id))
                  .gte('created_at', startOfDay.toISOString())
                  .lte('created_at', endOfDay.toISOString());
                
                const convIds = new Set(msgs?.map(m => m.conversation_id) || []);
                return new Set(
                  allConvs
                    .filter(conv => convIds.has(conv.id))
                    .map(conv => conv.patient_phone)
                );
              });
          })
        );
        
        const uniqueContactsInPeriod = new Set(
          totalConversations.flatMap(set => Array.from(set))
        );

        const fallbackStats: DashboardStats = {
          total_assistentes: assistentesData.count || 0,
          total_instancias: instanciasData.count || 0,
          instancias_ativas: instanciasAtivas,
          conversas_ativas: uniqueActiveContacts.size,
          conversas_periodo: uniqueContactsInPeriod.size,
          agendamentos_mes: agendamentosData.count || 0,
          agendamentos_periodo: agendamentosData.count || 0,
          mensagens_hoje: mensagensHoje
        };

        setStats(fallbackStats);
      }

      // Buscar dados para o gráfico (últimos N dias)
      const lastNDays = Array.from({ length: chartDays }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (chartDays - 1 - i));
        return date;
      });

      const chartDataPromises = lastNDays.map(async (date) => {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Buscar TODAS as conversas do usuário
        const { data: allUserConversations } = await supabase
          .from('conversations')
          .select('id, patient_phone')
          .eq('user_id', userData.user.id);

        if (!allUserConversations || allUserConversations.length === 0) {
          return {
            date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            conversations: 0,
            appointments: 0
          };
        }

        const conversationIds = allUserConversations.map(c => c.id);

        // Buscar mensagens que foram criadas neste dia específico
        const { data: messagesInDay } = await supabase
          .from('messages')
          .select('conversation_id')
          .in('conversation_id', conversationIds)
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());

        // Pegar IDs únicos de conversas que tiveram mensagens neste dia
        const uniqueConversationIds = new Set(
          messagesInDay?.map(msg => msg.conversation_id) || []
        );

        // Mapear de volta para patient_phone únicos
        const uniqueContacts = new Set(
          allUserConversations
            .filter(conv => uniqueConversationIds.has(conv.id))
            .map(conv => conv.patient_phone)
        );

        // Buscar agendamentos para este dia (excluindo bloqueios e eventos do Google)
        const { data: appointmentsInDay } = await supabase
          .from('appointments')
          .select('appointment_id')
          .eq('user_id', userData.user.id)
          .or('appointment_type.is.null,and(appointment_type.neq.blocked,appointment_type.neq.google_calendar)')
          .gte('appointment_date', startOfDay.toISOString())
          .lte('appointment_date', endOfDay.toISOString());

        return {
          date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          conversations: uniqueContacts.size,
          appointments: appointmentsInDay?.length || 0
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
        conversas_periodo: 0,
        agendamentos_mes: 0,
        agendamentos_periodo: 0,
        mensagens_hoje: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [chartDays]);

  return {
    stats,
    chartData,
    loading,
    refetch: fetchStats,
  };
};
