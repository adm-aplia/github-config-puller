import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface Conversation {
  id: string;
  user_id: string;
  contact_phone: string;
  contact_name?: string;
  agent_id?: string;
  instance_id?: string;
  status: 'active' | 'pending' | 'completed';
  last_message_at?: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message?: string;
  profile_name?: string;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConversations = async () => {
    try {
      // Primeiro buscar as conversas
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Para cada conversa, buscar o count de mensagens e a última mensagem
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conversation) => {
          // Buscar count de mensagens
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversation.id);

          // Buscar última mensagem
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Buscar perfil profissional se agent_id existe
          let profileName = 'Perfil não definido';
          if (conversation.agent_id) {
            const { data: profile } = await supabase
              .from('professional_profiles')
              .select('fullname')
              .eq('id', conversation.agent_id)
              .maybeSingle();
            
            profileName = profile?.fullname || 'Perfil não definido';
          }

          return {
            ...conversation,
            
            message_count: count || 0,
            last_message: lastMessage?.content || 'Nenhuma mensagem',
            profile_name: profileName
          } as Conversation;
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Erro ao carregar conversas',
        description: 'Não foi possível carregar as conversas.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (conversationData: Partial<Conversation>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userData.user.id,
          contact_phone: conversationData.contact_phone || '',
          contact_name: conversationData.contact_name,
          agent_id: conversationData.agent_id,
          instance_id: conversationData.instance_id,
          status: 'active',
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setConversations(prev => [{ ...data } as Conversation, ...prev]);
      
      toast({
        title: 'Conversa criada',
        description: 'Nova conversa criada com sucesso.',
      });

      return true;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: 'Erro ao criar conversa',
        description: 'Não foi possível criar a conversa.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateConversation = async (id: string, conversationData: Partial<Conversation>) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .update(conversationData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setConversations(prev => 
        prev.map(conversation => 
          conversation.id === id ? { ...conversation, ...data } as Conversation : conversation
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating conversation:', error);
      toast({
        title: 'Erro ao atualizar conversa',
        description: 'Não foi possível atualizar a conversa.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConversations(prev => prev.filter(conversation => conversation.id !== id));

      toast({
        title: 'Conversa excluída',
        description: 'Conversa excluída com sucesso.',
      });

      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: 'Erro ao excluir conversa',
        description: 'Não foi possível excluir a conversa.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  return {
    conversations,
    loading,
    createConversation,
    updateConversation,
    deleteConversation,
    refetch: fetchConversations,
  };
};