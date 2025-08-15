import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Payment {
  id: string;
  cliente_id: string;
  assinatura_id: string | null;
  valor: number;
  status: string;
  descricao: string;
  data_vencimento: string;
  data_pagamento: string | null;
  forma_pagamento: string | null;
  link_pagamento: string | null;
  asaas_payment_id: string | null;
  created_at: string;
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cobrancas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return {
    payments,
    loading,
    error,
    refetch: fetchPayments
  };
}