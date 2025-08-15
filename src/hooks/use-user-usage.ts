import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserUsage {
  assistentes: {
    usado: number;
    limite: number;
  };
  instancias: {
    usado: number;
    limite: number;
  };
  conversas_mes: {
    usado: number;
    limite: number;
  };
  agendamentos_mes: {
    usado: number;
    limite: number;
  };
}

export function useUserUsage() {
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.rpc('get_real_user_usage_summary');
      
      if (error) throw error;
      setUsage(data as unknown as UserUsage);
    } catch (err) {
      console.error('Error fetching user usage:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar uso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return {
    usage,
    loading,
    error,
    refetch: fetchUsage
  };
}