import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  return {
    messages,
    loading,
    fetchMessages,
    sendMessage
  };
};