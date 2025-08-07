import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface WhatsAppInstance {
  id: string;
  user_id: string;
  instance_name: string;
  phone_number?: string;
  status: 'connected' | 'qr_pending' | 'disconnected';
  professional_profile_id?: string;
  profile_name?: string;
  profile_picture_url?: string;
  last_connected_at?: string;
  created_at: string;
  updated_at: string;
}

export const useWhatsAppInstances = () => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInstances = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select(`
          *,
          professional_profiles(fullname, specialty)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedInstances = data?.map(instance => ({
        ...instance,
        status: instance.status as 'connected' | 'qr_pending' | 'disconnected',
        profile_name: instance.professional_profiles?.fullname,
        profile_specialty: instance.professional_profiles?.specialty
      } as WhatsAppInstance)) || [];

      setInstances(formattedInstances);
    } catch (error) {
      console.error('Error fetching WhatsApp instances:', error);
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
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert({
          user_id: userData.user.id,
          instance_name: instanceData.instance_name || '',
          phone_number: instanceData.phone_number,
          professional_profile_id: instanceData.professional_profile_id,
          status: 'qr_pending'
        })
        .select()
        .single();

      if (error) throw error;

      setInstances(prev => [{ ...data, status: data.status as 'connected' | 'qr_pending' | 'disconnected' } as WhatsAppInstance, ...prev]);
      
      toast({
        title: 'Instância criada',
        description: 'Nova instância do WhatsApp criada com sucesso.',
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
          instance.id === id ? { ...instance, ...data, status: data.status as 'connected' | 'qr_pending' | 'disconnected' } as WhatsAppInstance : instance
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

  useEffect(() => {
    fetchInstances();
  }, []);

  return {
    instances,
    loading,
    createInstance,
    updateInstance,
    deleteInstance,
    refetch: fetchInstances,
  };
};