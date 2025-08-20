import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface ProfessionalProfile {
  id: string;
  user_id: string;
  fullname: string;
  specialty: string;
  professionalid?: string;
  phonenumber?: string;
  email?: string;
  education?: string;
  avatar_url?: string;
  locations?: string;
  workinghours?: string;
  procedures?: string;
  healthinsurance?: string;
  paymentmethods?: string;
  consultationfees?: string;
  cancellationpolicy?: string;
  consultationduration?: string;
  timebetweenconsultations?: string;
  reschedulingpolicy?: string;
  onlineconsultations?: string;
  reminderpreferences?: string;
  requiredpatientinfo?: string;
  appointmentconditions?: string;
  medicalhistoryrequirements?: string;
  agerequirements?: string;
  communicationchannels?: string;
  preappointmentinfo?: string;
  requireddocuments?: string;
  additionalinfo?: string;
  created_at: string;
  updated_at: string;
}

export interface UserLimits {
  max_assistentes: number;
  uso_assistentes: number;
}

export const useProfessionalProfiles = () => {
  const [profiles, setProfiles] = useState<ProfessionalProfile[]>([]);
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('professional_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: limitsData, error: limitsError } = await supabase
        .from('usuario_limites')
        .select('max_assistentes, uso_assistentes')
        .maybeSingle();

      if (limitsError) throw limitsError;

      setProfiles(profilesData || []);
      setLimits(limitsData || { max_assistentes: 1, uso_assistentes: 0 });
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: 'Erro ao carregar perfis',
        description: 'Não foi possível carregar os perfis profissionais.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (profileData: Partial<ProfessionalProfile>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('professional_profiles')
        .insert({
          ...profileData,
          user_id: userData.user.id,
          fullname: profileData.fullname || '',
          specialty: profileData.specialty || ''
        })
        .select()
        .single();

      if (error) {
        // Verificar se é erro de limite
        if (error.message?.includes('limite de Assistentes')) {
          toast({
            title: 'Limite atingido',
            description: error.message,
            variant: 'destructive',
          });
          return false;
        }
        throw error;
      }

      setProfiles(prev => [data, ...prev]);
      
      // Send profile data to n8n webhook
      try {
        await supabase.functions.invoke('profile-webhook', {
          body: { 
            profileData: data,
            action: 'create'
          }
        });
        console.log('Profile data sent to webhook successfully');
      } catch (webhookError) {
        console.error('Failed to send profile data to webhook:', webhookError);
        // Don't fail the profile creation if webhook fails
      }
      
      toast({
        title: 'Perfil criado',
        description: 'Perfil profissional criado com sucesso.',
      });

      return true;
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast({
        title: 'Erro ao criar perfil',
        description: error.message || 'Não foi possível criar o perfil profissional.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateProfile = async (id: string, profileData: Partial<ProfessionalProfile>) => {
    try {
      const { data, error } = await supabase
        .from('professional_profiles')
        .update(profileData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setProfiles(prev => 
        prev.map(profile => 
          profile.id === id ? { ...profile, ...data } : profile
        )
      );

      // Send updated profile data to n8n webhook
      try {
        await supabase.functions.invoke('profile-webhook', {
          body: { 
            profileData: data,
            action: 'update'
          }
        });
        console.log('Updated profile data sent to webhook successfully');
      } catch (webhookError) {
        console.error('Failed to send updated profile data to webhook:', webhookError);
        // Don't fail the profile update if webhook fails
      }

      toast({
        title: 'Perfil atualizado',
        description: 'Perfil profissional atualizado com sucesso.',
      });

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro ao atualizar perfil',
        description: 'Não foi possível atualizar o perfil profissional.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      // Get profile data before deletion for webhook
      const profileToDelete = profiles.find(profile => profile.id === id);
      
      const { error } = await supabase
        .from('professional_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProfiles(prev => prev.filter(profile => profile.id !== id));

      // Send delete action to n8n webhook
      try {
        await supabase.functions.invoke('profile-webhook', {
          body: { 
            profileData: profileToDelete,
            action: 'delete'
          }
        });
        console.log('Profile deletion sent to webhook successfully');
      } catch (webhookError) {
        console.error('Failed to send profile deletion to webhook:', webhookError);
        // Don't fail the profile deletion if webhook fails
      }

      toast({
        title: 'Perfil excluído',
        description: 'Perfil profissional excluído com sucesso.',
      });

      return true;
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast({
        title: 'Erro ao excluir perfil',
        description: 'Não foi possível excluir o perfil profissional.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  return {
    profiles,
    limits,
    loading,
    createProfile,
    updateProfile,
    deleteProfile,
    refetch: fetchProfiles,
  };
};
