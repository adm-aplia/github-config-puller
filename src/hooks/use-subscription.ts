import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Subscription {
  id: string;
  cliente_id: string;
  plano_id: string;
  status: string;
  data_inicio: string;
  data_fim: string | null;
  proxima_cobranca: string | null;
  asaas_subscription_id: string | null;
  plano: {
    nome: string;
    preco: number;
    recursos: any;
  };
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(() => {
    // Tenta carregar do cache localStorage primeiro
    const cached = localStorage.getItem('user_subscription');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!subscription); // Só loading se não tem cache
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.rpc('get_user_subscription_info');
      
      if (error) throw error;
      
      const subscriptionData = data as unknown as Subscription;
      setSubscription(subscriptionData);
      
      // Salva no cache
      localStorage.setItem('user_subscription', JSON.stringify(subscriptionData));
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar assinatura');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription
  };
}