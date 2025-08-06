import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface WhatsAppInstance {
  id: string;
  user_id: string;
  instance_name: string;
  phone_number?: string;
  status: 'connected' | 'disconnected' | 'qr_pending';
  professional_profile_id?: string;
  profile_name?: string;
  profile_picture_url?: string;
  last_connected_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserLimits {
  max_instancias_whatsapp: number;
  uso_instancias: number;
}

export const useWhatsAppInstances = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInstances = async () => {
    try {
      const { data: instancesData, error: instancesError } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (instancesError) throw instancesError;

      const { data: limitsData, error: limitsError } = await supabase
        .from('usuario_limites')
        .select('max_instancias_whatsapp, uso_instancias')
        .single();

      if (limitsError && limitsError.code !== 'PGRST116') throw limitsError;

      setInstances((instancesData || []) as WhatsAppInstance[]);
      setLimits(limitsData || { max_instancias_whatsapp: 1, uso_instancias: 0 });
    } catch (error) {
      console.error('Error fetching instances:', error);
      toast({
        title: 'Erro ao carregar instâncias',
        description: 'Não foi possível carregar as instâncias do WhatsApp.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async (instanceData: Partial<WhatsAppInstance>) => {
    try {
      if (limits && instances.length >= limits.max_instancias_whatsapp) {
        toast({
          title: 'Limite atingido',
          description: `Você atingiu o limite de ${limits.max_instancias_whatsapp} instâncias do WhatsApp.`,
          variant: 'destructive',
        });
        return false;
      }

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert([{...instanceData, user_id: (await supabase.auth.getUser()).data.user?.id}])
        .select()
        .single();

      if (error) throw error;

      setInstances(prev => [data, ...prev]);
      
      toast({
        title: 'Instância criada',
        description: 'Instância do WhatsApp criada com sucesso.',
      });

      return true;
    } catch (error) {
      console.error('Error creating instance:', error);
      toast({
        title: 'Erro ao criar instância',
        description: 'Não foi possível criar a instância do WhatsApp.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateInstance = async (id: string, instanceData: Partial<WhatsAppInstance>) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .update(instanceData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setInstances(prev => 
        prev.map(instance => 
          instance.id === id ? { ...instance, ...data } : instance
        )
      );

      toast({
        title: 'Instância atualizada',
        description: 'Instância do WhatsApp atualizada com sucesso.',
      });

      return true;
    } catch (error) {
      console.error('Error updating instance:', error);
      toast({
        title: 'Erro ao atualizar instância',
        description: 'Não foi possível atualizar a instância do WhatsApp.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteInstance = async (id: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setInstances(prev => prev.filter(instance => instance.id !== id));

      toast({
        title: 'Instância excluída',
        description: 'Instância do WhatsApp excluída com sucesso.',
      });

      return true;
    } catch (error) {
      console.error('Error deleting instance:', error);
      toast({
        title: 'Erro ao excluir instância',
        description: 'Não foi possível excluir a instância do WhatsApp.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const connectInstance = async (id: string) => {
    try {
      // Simular conexão (aqui você integraria com sua API do WhatsApp)
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .update({ 
          status: 'qr_pending',
          last_connected_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setInstances(prev => 
        prev.map(instance => 
          instance.id === id ? data : instance
        )
      );

      toast({
        title: 'Conectando...',
        description: 'Iniciando processo de conexão. Escaneie o QR Code.',
      });

      // Simular mudança para conectado após alguns segundos
      setTimeout(async () => {
        await updateInstance(id, { 
          status: 'connected',
          phone_number: '+55 11 99999-9999' // Mock phone number
        });
      }, 5000);

      return true;
    } catch (error) {
      console.error('Error connecting instance:', error);
      toast({
        title: 'Erro na conexão',
        description: 'Não foi possível conectar a instância do WhatsApp.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const disconnectInstance = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .update({ 
          status: 'disconnected',
          phone_number: null 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setInstances(prev => 
        prev.map(instance => 
          instance.id === id ? data : instance
        )
      );

      toast({
        title: 'Desconectado',
        description: 'Instância do WhatsApp desconectada com sucesso.',
      });

      return true;
    } catch (error) {
      console.error('Error disconnecting instance:', error);
      toast({
        title: 'Erro ao desconectar',
        description: 'Não foi possível desconectar a instância do WhatsApp.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchInstances();
  }, []);

  return {
    instances,
    limits,
    loading,
    createInstance,
    updateInstance,
    deleteInstance,
    connectInstance,
    disconnectInstance,
    refetch: fetchInstances,
  };
};