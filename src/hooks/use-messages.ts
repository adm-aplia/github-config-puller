import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizePhoneNumber } from '@/lib/whatsapp';
import { sendChatWebhook } from '@/lib/n8n-proxy';

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'agent' | 'system';
  content: string;
  message_type: string;
  metadata: any;
  created_at: string;
}

export const useMessages = (conversationId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(!!conversationId);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [oldestMessageDate, setOldestMessageDate] = useState<string | null>(null);

  const fetchMessages = async (conversationId: string, limit = 500) => {
    setLoading(true);
    try {
      // Buscar as últimas N mensagens
      const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      const messagesArray = (data as Message[] || []).reverse();
      setMessages(messagesArray);
      
      if (messagesArray.length > 0) {
        setOldestMessageDate(messagesArray[0].created_at);
      }
      
      // Se o número de mensagens retornadas é menor que o limit, não há mais mensagens
      setHasMore((count || 0) > limit);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async (conversationId: string) => {
    if (!hasMore || loadingMore || !oldestMessageDate) return;
    
    setLoadingMore(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .lt('created_at', oldestMessageDate)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error loading more messages:', error);
        return;
      }

      const olderMessages = (data as Message[] || []).reverse();
      
      if (olderMessages.length > 0) {
        setMessages(prev => [...olderMessages, ...prev]);
        setOldestMessageDate(olderMessages[0].created_at);
        setHasMore(olderMessages.length === 500);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const sendMessage = async (conversationId: string, content: string, senderType: 'user' | 'agent' = 'agent') => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_type: senderType,
          content,
          message_type: 'text'
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return;
      }

      // Update conversation's last_message_at using the message's created_at timestamp
      await supabase
        .from('conversations')
        .update({ last_message_at: data.created_at })
        .eq('id', conversationId);

      // Send webhook notification for agent messages
      if (senderType === 'agent') {
        try {
          // Fetch conversation data for webhook
          const { data: conversationData } = await supabase
            .from('conversations')
            .select('professional_profile_id, patient_name, patient_phone, user_id')
            .eq('id', conversationId)
            .single();

          if (conversationData) {
            const webhookPayload = {
              mensagem: content,
              agente_id: conversationData.professional_profile_id || null,
              nome_do_lead: conversationData.patient_name || conversationData.patient_phone || "",
              numero_do_lead: normalizePhoneNumber(conversationData.patient_phone || ""),
              user_id: conversationData.user_id || null
            };

            // Send webhook via secure proxy (fire-and-forget)
            sendChatWebhook(webhookPayload).catch(error => {
              console.error('Webhook error:', error);
            });
          }
        } catch (webhookError) {
          console.error('Error preparing webhook data:', webhookError);
        }
      }

      setMessages(prev => [...prev, data as Message]);
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Auto-fetch messages when conversationId changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    } else {
      setMessages([]);
      setLoading(false);
    }
  }, [conversationId]);

  // Set up Realtime subscription for messages
  useEffect(() => {
    let messagesChannel: any = null;
    let conversationsChannel: any = null;

    if (conversationId) {
      // Subscribe to new messages
      messagesChannel = supabase
        .channel(`messages-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            console.log('New message received:', payload);
            const newMessage = payload.new as Message;
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              if (prev.some(msg => msg.id === newMessage.id)) {
                return prev;
              }
              return [...prev, newMessage];
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            console.log('Message updated:', payload);
            const updatedMessage = payload.new as Message;
            setMessages(prev => prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            ));
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`
          },
          (payload) => {
            console.log('Message deleted:', payload);
            const deletedMessage = payload.old as Message;
            setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id));
          }
        )
        .subscribe();

      // Subscribe to conversation updates (for contact name/phone changes)
      conversationsChannel = supabase
        .channel(`conversation-${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversations',
            filter: `id=eq.${conversationId}`
          },
          (payload) => {
            console.log('Conversation updated:', payload);
            // This will trigger a re-render of the chat panel with updated contact info
            // The parent component should handle this by passing updated props
          }
        )
        .subscribe();
    }

    return () => {
      if (messagesChannel) {
        supabase.removeChannel(messagesChannel);
      }
      if (conversationsChannel) {
        supabase.removeChannel(conversationsChannel);
      }
    };
  }, [conversationId]);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    fetchMessages,
    sendMessage,
    loadMoreMessages
  };
};