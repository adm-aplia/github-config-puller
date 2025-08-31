
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { extractPhoneNumberFromApi, normalizePhoneNumber } from '@/lib/whatsapp';

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

  const fetchInstances = async (silent = false) => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let formattedInstances = data?.map(instance => ({
        ...instance,
        status: instance.status as 'connected' | 'qr_pending' | 'disconnected'
      } as WhatsAppInstance)) || [];

      // Fetch profile names for instances with professional_profile_id
      const instancesWithProfiles = formattedInstances.filter(inst => inst.professional_profile_id);
      if (instancesWithProfiles.length > 0) {
        const profileIds = instancesWithProfiles.map(inst => inst.professional_profile_id);
        const { data: profiles } = await supabase
          .from('professional_profiles')
          .select('id, fullname, specialty')
          .in('id', profileIds);

        if (profiles) {
          formattedInstances = formattedInstances.map(instance => {
            const profile = profiles.find(p => p.id === instance.professional_profile_id);
            return {
              ...instance,
              profile_name: profile?.fullname,
              profile_specialty: profile?.specialty
            };
          });
        }
      }

      setInstances(formattedInstances);

      // Note: Removed auto-sync from fetchInstances to prevent excessive logs
      // Sync is now handled via page button or periodic interval
    } catch (error) {
      console.error('Error fetching WhatsApp instances:', error);
      if (!silent) {
        toast({
          title: 'Erro ao carregar instâncias',
          description: 'Não foi possível carregar as instâncias do WhatsApp.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const createInstance = async (instanceData: Partial<WhatsAppInstance>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('User not authenticated');

      const displayName = instanceData.display_name || instanceData.instance_name || 'Nova Instância';

      // Check if instance already exists to prevent duplicates
      const { data: existing } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('display_name', displayName)
        .single();

      if (existing) {
        console.log('[useWhatsAppInstances] Instance already exists, returning existing one');
        const existingInstance = { ...existing, status: existing.status as 'connected' | 'qr_pending' | 'disconnected' } as WhatsAppInstance;
        
        // Update local state to include this instance if not already present
        setInstances(prev => {
          const existsInState = prev.some(inst => inst.id === existingInstance.id);
          if (!existsInState) {
            return [existingInstance, ...prev];
          }
          return prev;
        });
        
        return existingInstance;
      }

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

      const insertData = {
        user_id: userData.user.id,
        instance_name: payload.instanceName,
        display_name: displayName,
        phone_number: instanceData.phone_number,
        professional_profile_id: instanceData.professional_profile_id,
        status: 'qr_pending' as const,
        qr_code: payload.qrCode,
        evolution_instance_id: payload.evolutionInstanceId,
        evolution_instance_key: payload.evolutionInstanceKey,
        groups_ignore: true,
        webhook_enabled: payload.webhookEnabled ?? true,
        webhook_url: 'https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/aplia',
        integration_provider: 'evolution',
      };

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        // Handle unique constraint violations
        if (error.code === '23505') {
          console.log('[useWhatsAppInstances] Unique constraint violation, fetching existing instance');
          const { data: existingData } = await supabase
            .from('whatsapp_instances')
            .select('*')
            .eq('user_id', userData.user.id)
            .eq('instance_name', payload.instanceName)
            .single();
          
          if (existingData) {
            const existingInstance = { ...existingData, status: existingData.status as 'connected' | 'qr_pending' | 'disconnected' } as WhatsAppInstance;
            
            setInstances(prev => {
              const filtered = prev.filter(inst => inst.id !== existingInstance.id);
              return [existingInstance, ...filtered];
            });
            
            return existingInstance;
          }
        }
        
        // Verificar se é erro de limite
        if (error.message?.includes('limite de Números de WhatsApp')) {
          toast({
            title: 'Limite atingido',
            description: error.message,
            variant: 'destructive',
          });
          return null;
        }
        throw error;
      }

      const created = { ...data, status: data.status as 'connected' | 'qr_pending' | 'disconnected' } as WhatsAppInstance;

      setInstances(prev => {
        const filtered = prev.filter(inst => inst.id !== created.id);
        return [created, ...filtered];
      });
      
      toast({
        title: 'Instância criada',
        description: 'Nova instância do WhatsApp criada e configurada com sucesso.',
      });

      return created;
    } catch (error: any) {
      console.error('Error creating instance:', error);
      toast({
        title: 'Erro ao criar instância',
        description: error.message || 'Não foi possível criar a instância do WhatsApp.',
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
    refetch: () => fetchInstances(false),
    syncInstances: () => fetchInstances(true),
  };
};
