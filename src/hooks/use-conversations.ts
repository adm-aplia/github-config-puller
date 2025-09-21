
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export interface Conversation {
  id: string;
  user_id: string;
  contact_phone: string;
  contact_name?: string;
  contact_avatar_url?: string;
  agent_id?: string;
  instance_id?: string;
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
      console.log('🔍 Fetching conversations...');
      
      // Check authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ Authentication error:', authError);
        throw new Error('User not authenticated');
      }
      
      console.log('✅ User authenticated:', user.id);
      
      // Buscar conversas
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (conversationsError) {
        console.error('❌ Error fetching conversations:', conversationsError);
        throw conversationsError;
      }

      console.log('📊 Raw conversations data:', {
        count: conversationsData?.length || 0,
        data: conversationsData
      });

      if (!conversationsData || conversationsData.length === 0) {
        console.log('📭 No conversations found');
        setConversations([]);
        return;
      }

      // Get all conversation IDs for bulk queries
      const conversationIds = conversationsData.map(c => c.id);
      const agentIds = conversationsData.filter(c => c.agent_id).map(c => c.agent_id);

      // Bulk fetch message counts
      const { data: messageCounts } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds);

      // Bulk fetch last messages
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('conversation_id, content, created_at')
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      // Bulk fetch profiles
      const { data: profiles } = agentIds.length > 0 ? await supabase
        .from('professional_profiles')
        .select('id, fullname')
        .in('id', agentIds) : { data: [] };

      // Create lookup maps
      const messageCountMap = new Map<string, number>();
      messageCounts?.forEach(msg => {
        const count = messageCountMap.get(msg.conversation_id) || 0;
        messageCountMap.set(msg.conversation_id, count + 1);
      });

      const lastMessageMap = new Map<string, string>();
      const seenConversations = new Set<string>();
      lastMessages?.forEach(msg => {
        if (!seenConversations.has(msg.conversation_id)) {
          lastMessageMap.set(msg.conversation_id, msg.content);
          seenConversations.add(msg.conversation_id);
        }
      });

      const profileMap = new Map<string, string>();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile.fullname);
      });

      // Combine data
      const conversationsWithDetails = conversationsData.map(conversation => ({
        ...conversation,
        message_count: messageCountMap.get(conversation.id) || 0,
        last_message: lastMessageMap.get(conversation.id) || 'Nenhuma mensagem',
        profile_name: conversation.agent_id ? (profileMap.get(conversation.agent_id) || '') : ''
      })) as Conversation[];

      console.log('✅ Final conversations with details:', {
        count: conversationsWithDetails.length,
        conversations: conversationsWithDetails.map(c => ({
          id: c.id,
          contact_name: c.contact_name,
          contact_phone: c.contact_phone,
          message_count: c.message_count
        }))
      });

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

      // Check conversation limits before creating
      const { data: canCreate, error: limitError } = await supabase.rpc('check_user_limits', {
        p_user_id: userData.user.id,
        p_resource_type: 'conversa'
      });

      if (limitError) {
        console.error('Error checking limits:', limitError);
      } else if (!canCreate) {
        toast({
          title: 'Limite atingido',
          description: 'Você atingiu o limite mensal de conversas do seu plano.',
          variant: 'destructive',
        });
        return false;
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userData.user.id,
          contact_phone: conversationData.contact_phone || '',
          contact_name: conversationData.contact_name,
          contact_avatar_url: conversationData.contact_avatar_url,
          agent_id: conversationData.agent_id,
          instance_id: conversationData.instance_id,
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
      // Delete associated conversation summaries first
      const { error: summariesError } = await supabase
        .from('conversation_summaries')
        .delete()
        .eq('conversation_id', id);

      if (summariesError) {
        console.error('Error deleting conversation summaries:', summariesError);
        // Continue with deletion even if summaries deletion fails
      }

      // Delete associated messages
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', id);

      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
        // Continue with conversation deletion even if messages deletion fails
      }

      // Delete the conversation
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConversations(prev => prev.filter(conversation => conversation.id !== id));

      toast({
        title: 'Conversa excluída',
        description: 'Conversa, mensagens e resumos foram excluídos com sucesso.',
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

  const deleteConversations = async (ids: string[]) => {
    try {
      // Delete associated conversation summaries first
      const { error: summariesError } = await supabase
        .from('conversation_summaries')
        .delete()
        .in('conversation_id', ids);

      if (summariesError) {
        console.error('Error deleting conversation summaries:', summariesError);
        // Continue with deletion even if summaries deletion fails
      }

      // Delete associated messages
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .in('conversation_id', ids);

      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
        // Continue with conversation deletion even if messages deletion fails
      }

      // Delete the conversations
      const { error } = await supabase
        .from('conversations')
        .delete()
        .in('id', ids);

      if (error) throw error;

      setConversations(prev => prev.filter(conversation => !ids.includes(conversation.id)));

      toast({
        title: 'Conversas excluídas',
        description: `${ids.length} conversas foram excluídas com sucesso.`,
      });

      return true;
    } catch (error) {
      console.error('Error deleting conversations:', error);
      toast({
        title: 'Erro ao excluir conversas',
        description: 'Não foi possível excluir as conversas selecionadas.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchConversations();

    // Set up Realtime subscription for conversations
    const conversationsChannel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          console.log('Conversation change detected:', payload);
          // Refetch conversations on any change
          fetchConversations();
        }
      )
      .subscribe();

    // Set up Realtime subscription for messages (to update last_message)
    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('New message detected:', payload);
          // Refetch conversations to update last_message and message_count
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, []);

  return {
    conversations,
    loading,
    createConversation,
    updateConversation,
    deleteConversation,
    deleteConversations,
    refetch: fetchConversations,
  };
};
