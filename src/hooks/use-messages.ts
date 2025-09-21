import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizePhoneNumber } from '@/lib/whatsapp';

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'agent' | 'system';
  content: string;
  message_type: string;
  metadata: any;
  created_at: string;
}

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async (conversationId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data as Message[] || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
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

      // Update conversation's last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Send webhook notification for agent messages
      if (senderType === 'agent') {
        try {
          // Fetch conversation data for webhook
          const { data: conversationData } = await supabase
            .from('conversations')
            .select('agent_id, contact_name, contact_phone, user_id')
            .eq('id', conversationId)
            .single();

          if (conversationData) {
            const webhookPayload = {
              mensagem: content,
              agente_id: conversationData.agent_id || null,
              nome_do_lead: conversationData.contact_name || conversationData.contact_phone || "",
              numero_do_lead: normalizePhoneNumber(conversationData.contact_phone || ""),
              user_id: conversationData.user_id || null
            };

            // Send webhook (fire-and-forget, don't await)
            fetch("https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/apliachatinterno", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(webhookPayload),
              mode: "no-cors"
            }).catch(error => {
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

  // Set up Realtime subscription for messages
  useEffect(() => {
    let messagesChannel: any = null;
    let conversationsChannel: any = null;

    if (messages.length > 0) {
      const conversationId = messages[0]?.conversation_id;
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
    }

    return () => {
      if (messagesChannel) {
        supabase.removeChannel(messagesChannel);
      }
      if (conversationsChannel) {
        supabase.removeChannel(conversationsChannel);
      }
    };
  }, [messages.length > 0 ? messages[0]?.conversation_id : null]);

  return {
    messages,
    loading,
    fetchMessages,
    sendMessage
  };
};