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
  // Campos adicionais da integração Evolution
  qr_code?: string;
  display_name?: string;
  evolution_instance_id?: string;
  evolution_instance_key?: string;
  webhook_enabled?: boolean;
  webhook_url?: string;
  integration_provider?: string;
  groups_ignore?: boolean;
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

      const displayName = instanceData.display_name || instanceData.instance_name || 'Nova Instância';

      console.log('[useWhatsAppInstances] Creating Evolution instance via edge function...');
      const evoRes = await supabase.functions.invoke('evolution-manager', {
        body: {
          action: 'create_instance',
          displayName,
        },
      });

      if (evoRes.error) {
        console.error('[useWhatsAppInstances] Edge function error:', evoRes.error);
        throw new Error(evoRes.error.message || 'Falha ao criar instância na Evolution API');
      }

      const payload = evoRes.data as {
        instanceName: string;
        displayName: string;
        evolutionInstanceId: string | null;
        evolutionInstanceKey: string | null;
        qrCode: string | null;
        webhookEnabled?: boolean;
      };

      console.log('[useWhatsAppInstances] Evolution payload:', payload);

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert({
          user_id: userData.user.id,
          instance_name: payload.instanceName,
          display_name: payload.displayName,
          phone_number: instanceData.phone_number,
          professional_profile_id: instanceData.professional_profile_id,
          status: 'qr_pending',
          qr_code: payload.qrCode,
          evolution_instance_id: payload.evolutionInstanceId,
          evolution_instance_key: payload.evolutionInstanceKey,
          groups_ignore: true,
          webhook_enabled: payload.webhookEnabled ?? true,
          webhook_url: 'https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/aplia',
          integration_provider: 'evolution',
        })
        .select()
        .single();

      if (error) throw error;

      const created = { ...data, status: data.status as 'connected' | 'qr_pending' | 'disconnected' } as WhatsAppInstance;

      setInstances(prev => [
        created,
        ...prev,
      ]);
      
      toast({
        title: 'Instância criada',
        description: 'Nova instância do WhatsApp criada e configurada com sucesso.',
      });

      return created;
    } catch (error) {
      console.error('Error creating instance:', error);
      toast({
        title: 'Erro ao criar instância',
        description: 'Não foi possível criar a instância do WhatsApp.',
        variant: 'destructive',
      });
      return null;
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
