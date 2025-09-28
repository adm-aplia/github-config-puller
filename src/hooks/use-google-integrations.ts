
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGoogleCalendarEvents } from '@/hooks/use-google-calendar-events';

export interface GoogleCredential {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  expires_at?: string;
  professional_profile_id?: string;
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
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { processGoogleCalendarWebhook, transformN8NEvents } = useGoogleCalendarEvents();

  const fetchCredentials = async () => {
    try {
      setRefreshing(true);
      const { data: credentialsData, error: credentialsError } = await supabase
        .from('google_credentials')
        .select('id, user_id, email, name, expires_at, professional_profile_id, created_at, updated_at')
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
      setRefreshing(false);
    }
  };

  const connectGoogleAccount = async () => {
    try {
      const { buildGoogleAuthUrl, GOOGLE_OAUTH } = await import('@/config/google');
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        toast({
          title: 'Sessão expirada',
          description: 'Faça login novamente para conectar sua conta Google.',
          variant: 'destructive',
        });
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

      // Em desktop, tenta abrir popup
      const popup = window.open(
        authUrl,
        'googleAuthPopup',
        'width=600,height=700'
      );

      try {
        popup?.focus();
      } catch {}

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

  // Função para sincronizar eventos automaticamente
  const syncGoogleEventsForProfile = async (credentialId: string, profileId: string) => {
    try {
      const credential = credentials.find(c => c.id === credentialId);
      if (!credential) {
        throw new Error('Credencial Google não encontrada');
      }

      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Configurar período de 1 ano (6 meses para trás, 6 para frente)
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      const sixMonthsLater = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());

      const query = {
        my_email: credential.email,
        user_id: user.id,
        calendarId: "primary",
        timeMin: sixMonthsAgo.toISOString(),
        timeMax: sixMonthsLater.toISOString(),
        professionalProfileId: profileId
      };

      console.log('🔄 Sincronizando eventos automaticamente:', query);

      const response = await fetch('https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/eventos-google-agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ query: JSON.stringify(query) }])
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Eventos sincronizados:', data);

        if (data && data[0] && data[0].response) {
          // Parse da resposta JSON do N8N
          let rawEvents;
          try {
            rawEvents = typeof data[0].response === 'string' 
              ? JSON.parse(data[0].response) 
              : data[0].response;
          } catch (e) {
            console.error('❌ Erro ao fazer parse dos eventos:', e);
            return false;
          }

          console.log(`📅 Eventos recebidos do N8N:`, rawEvents);
          console.log(`📅 Processando ${rawEvents.length} eventos do Google Calendar`);
          
          // Transformar eventos do formato N8N para o formato esperado
          const transformedEvents = transformN8NEvents(rawEvents);
          console.log(`🔄 Eventos transformados:`, transformedEvents);
          
          await processGoogleCalendarWebhook(transformedEvents, "primary", profileId);
          console.log('📅 Eventos processados e inseridos automaticamente');
          return true;
        }
      } else {
        throw new Error(`Erro do servidor: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erro na sincronização automática:', error);
      throw error;
    }
  };

  // Função para deletar eventos do perfil
  const deleteGoogleEventsForProfile = async (profileId: string) => {
    try {
      console.log('🗑️ Deletando eventos do perfil:', profileId);

      // Deletar eventos da tabela google_calendar_events
      const { error: calendarError } = await supabase
        .from('google_calendar_events')
        .delete()
        .eq('professional_profile_id', profileId);

      if (calendarError) {
        console.error('Erro ao deletar google_calendar_events:', calendarError);
        throw calendarError;
      }

      // Deletar appointments relacionados (apenas os vindos do Google Calendar)
      const { error: appointmentsError } = await supabase
        .from('appointments')
        .delete()
        .eq('professional_profile_id', profileId)
        .eq('appointment_type', 'google_sync');

      if (appointmentsError) {
        console.error('Erro ao deletar appointments:', appointmentsError);
        throw appointmentsError;
      }

      console.log('✅ Eventos deletados com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao deletar eventos:', error);
      throw error;
    }
  };

  const linkProfileToGoogle = async (googleCredentialId: string, professionalProfileId: string) => {
    try {
      // Verificar se a conta Google já está vinculada a outro perfil
      const existingCredentialLink = profileLinks.find(
        link => link.google_credential_id === googleCredentialId
      );

      if (existingCredentialLink) {
        // Buscar o nome do perfil que já está usando esta conta
        const linkedProfile = credentials.find(cred => cred.id === googleCredentialId);
        const credentialEmail = linkedProfile?.email || 'conta Google';
        
        toast({
          title: 'Conta já vinculada',
          description: `Esta ${credentialEmail} já está vinculada a outro perfil. Uma conta Google só pode estar conectada a um perfil por vez.`,
          variant: 'destructive',
        });
        return false;
      }

      // Verificar se o perfil já tem alguma conta Google vinculada
      const existingProfileLink = profileLinks.find(
        link => link.professional_profile_id === professionalProfileId
      );

      if (existingProfileLink) {
        toast({
          title: 'Perfil já vinculado',
          description: 'Este perfil já possui uma conta Google vinculada. Apenas uma conta é permitida por perfil.',
          variant: 'destructive',
        });
        return false;
      }

      // Mostrar loading para sincronização
      toast({
        title: 'Sincronizando eventos...',
        description: 'Vinculando perfil e importando eventos do Google Calendar.',
      });

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

      // Atualizar a credencial local com o novo professional_profile_id
      setCredentials(prev => 
        prev.map(cred => 
          cred.id === googleCredentialId 
            ? { ...cred, professional_profile_id: professionalProfileId }
            : cred
        )
      );

      // Sincronizar eventos automaticamente
      try {
        await syncGoogleEventsForProfile(googleCredentialId, professionalProfileId);
        
        toast({
          title: 'Perfil vinculado com sucesso',
          description: 'Perfil vinculado e eventos sincronizados automaticamente.',
        });
      } catch (syncError) {
        console.error('Erro na sincronização automática:', syncError);
        toast({
          title: 'Perfil vinculado',
          description: 'Perfil vinculado, mas houve erro na sincronização automática de eventos.',
          variant: 'destructive',
        });
      }

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
      const linkToDelete = profileLinks.find(link => link.id === linkId);
      
      if (!linkToDelete) {
        throw new Error('Link não encontrado');
      }

      // Deletar eventos relacionados antes de remover a vinculação
      try {
        await deleteGoogleEventsForProfile(linkToDelete.professional_profile_id);
        console.log('✅ Eventos deletados automaticamente');
      } catch (deleteError) {
        console.error('❌ Erro ao deletar eventos:', deleteError);
        // Continuar com a desvinculação mesmo se houver erro na deleção de eventos
      }

      const { error } = await supabase
        .from('google_profile_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      setProfileLinks(prev => prev.filter(link => link.id !== linkId));

      // Atualizar a credencial local removendo o professional_profile_id se necessário
      const remainingLinks = profileLinks.filter(
        link => link.id !== linkId && link.google_credential_id === linkToDelete.google_credential_id
      );
      
      if (remainingLinks.length === 0) {
        setCredentials(prev => 
          prev.map(cred => 
            cred.id === linkToDelete.google_credential_id 
              ? { ...cred, professional_profile_id: undefined }
              : cred
          )
        );
      }

      toast({
        title: 'Vinculação removida',
        description: 'Perfil desvinculado e eventos removidos automaticamente.',
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
        .select('id, user_id, email, name, expires_at, professional_profile_id, created_at, updated_at')
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
    refreshing,
    connectGoogleAccount,
    disconnectGoogleAccount,
    linkProfileToGoogle,
    unlinkProfileFromGoogle,
    refreshGoogleToken,
    refetch: fetchCredentials,
  };
};
