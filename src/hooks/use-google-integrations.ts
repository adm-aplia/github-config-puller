import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { buildGoogleAuthUrl, GOOGLE_OAUTH } from '@/config/google';

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
  const isMobile = useIsMobile();

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
      // Em desktop, abre um popup em branco SINCRONAMENTE para manter o gesto do usuário
      const popupRef = isMobile
        ? null
        : window.open('', 'googleAuthPopup', 'width=600,height=700,noopener');

      // Recupera usuário logado
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        toast({
          title: 'Sessão expirada',
          description: 'Faça login novamente para conectar sua conta Google.',
          variant: 'destructive',
        });
        if (popupRef) {
          try { popupRef.close(); } catch {}
        }
        return null;
      }

      const authUrl = buildGoogleAuthUrl({ user_id: user.id });

      // Log para depuração do Client ID efetivamente usado
      console.log('Google OAuth clientId:', GOOGLE_OAUTH.clientId);

      if (isMobile) {
        // Em dispositivos móveis, redireciona na mesma aba
        window.location.href = authUrl;
        return true;
      }

      if (popupRef) {
        try {
          // Navega o popup para a URL de autenticação
          popupRef.location.href = authUrl;
          popupRef.focus();
          return true;
        } catch {
          try { popupRef.close(); } catch {}
          window.location.href = authUrl; // fallback
          return true;
        }
      }

      // Se o popup foi bloqueado (null), faz fallback de redirect completo
      window.location.href = authUrl;
      return true;
    } catch (error) {
      console.error('Error starting Google OAuth:', error);
      toast({
        title: 'Erro na conexão',
        description: 'Não foi possível iniciar a autenticação com o Google.',
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