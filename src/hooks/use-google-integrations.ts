import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface GoogleCredential {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleProfileLink {
  id: string;
  google_credential_id: string;
  professional_profile_id: string;
  created_at: string;
}

export const useGoogleIntegrations = () => {
  const [credentials, setCredentials] = useState<GoogleCredential[]>([]);
  const [profileLinks, setProfileLinks] = useState<GoogleProfileLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCredentials = async () => {
    try {
      const { data: credentialsData, error: credentialsError } = await supabase
        .from('google_credentials')
        .select('id, user_id, email, name, expires_at, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (credentialsError) throw credentialsError;

      const { data: linksData, error: linksError } = await supabase
        .from('google_profile_links')
        .select('*');

      if (linksError) throw linksError;

      setCredentials(credentialsData || []);
      setProfileLinks(linksData || []);
    } catch (error) {
      console.error('Error fetching Google credentials:', error);
      toast({
        title: 'Erro ao carregar credenciais',
        description: 'Não foi possível carregar as credenciais do Google.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const connectGoogleAccount = async () => {
    try {
      // SECURITY WARNING: This is a mock implementation
      // In production, implement proper OAuth 2.0 flow with secure token handling
      const mockCredential = {
        email: 'usuario@gmail.com',
        name: 'Usuário Google',
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hora
      };

      const { data, error } = await supabase
        .from('google_credentials')
        .insert([{
          email: mockCredential.email,
          name: mockCredential.name,
          expires_at: mockCredential.expires_at,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select('id, user_id, email, name, expires_at, created_at, updated_at')
        .single();

      if (error) throw error;

      setCredentials(prev => [data, ...prev]);

      toast({
        title: 'Conta conectada',
        description: 'Conta Google conectada com sucesso.',
      });

      return data;
    } catch (error) {
      console.error('Error connecting Google account:', error);
      toast({
        title: 'Erro na conexão',
        description: 'Não foi possível conectar a conta Google.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const disconnectGoogleAccount = async (credentialId: string) => {
    try {
      // Remover todos os links primeiro
      await supabase
        .from('google_profile_links')
        .delete()
        .eq('google_credential_id', credentialId);

      // Remover a credencial
      const { error } = await supabase
        .from('google_credentials')
        .delete()
        .eq('id', credentialId);

      if (error) throw error;

      setCredentials(prev => prev.filter(cred => cred.id !== credentialId));
      setProfileLinks(prev => prev.filter(link => link.google_credential_id !== credentialId));

      toast({
        title: 'Conta desconectada',
        description: 'Conta Google desconectada com sucesso.',
      });

      return true;
    } catch (error) {
      console.error('Error disconnecting Google account:', error);
      toast({
        title: 'Erro ao desconectar',
        description: 'Não foi possível desconectar a conta Google.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const linkProfileToGoogle = async (googleCredentialId: string, professionalProfileId: string) => {
    try {
      // Verificar se já existe um link
      const existingLink = profileLinks.find(
        link => link.google_credential_id === googleCredentialId && 
                link.professional_profile_id === professionalProfileId
      );

      if (existingLink) {
        toast({
          title: 'Já vinculado',
          description: 'Este perfil já está vinculado a esta conta Google.',
          variant: 'destructive',
        });
        return false;
      }

      const { data, error } = await supabase
        .from('google_profile_links')
        .insert([{
          google_credential_id: googleCredentialId,
          professional_profile_id: professionalProfileId,
        }])
        .select()
        .single();

      if (error) throw error;

      setProfileLinks(prev => [...prev, data]);

      toast({
        title: 'Perfil vinculado',
        description: 'Perfil vinculado à conta Google com sucesso.',
      });

      return true;
    } catch (error) {
      console.error('Error linking profile to Google:', error);
      toast({
        title: 'Erro na vinculação',
        description: 'Não foi possível vincular o perfil à conta Google.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const unlinkProfileFromGoogle = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('google_profile_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      setProfileLinks(prev => prev.filter(link => link.id !== linkId));

      toast({
        title: 'Vinculação removida',
        description: 'Vinculação entre perfil e conta Google removida.',
      });

      return true;
    } catch (error) {
      console.error('Error unlinking profile from Google:', error);
      toast({
        title: 'Erro ao desvincular',
        description: 'Não foi possível desvincular o perfil da conta Google.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const refreshGoogleToken = async (credentialId: string) => {
    try {
      // SECURITY NOTE: In production, implement secure token refresh via Edge Function
      const newExpiresAt = new Date(Date.now() + 3600000).toISOString();

      const { data, error } = await supabase
        .from('google_credentials')
        .update({
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', credentialId)
        .select('id, user_id, email, name, expires_at, created_at, updated_at')
        .single();

      if (error) throw error;

      setCredentials(prev => 
        prev.map(cred => 
          cred.id === credentialId ? data : cred
        )
      );

      return true;
    } catch (error) {
      console.error('Error refreshing Google token:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  return {
    credentials,
    profileLinks,
    loading,
    connectGoogleAccount,
    disconnectGoogleAccount,
    linkProfileToGoogle,
    unlinkProfileFromGoogle,
    refreshGoogleToken,
    refetch: fetchCredentials,
  };
};