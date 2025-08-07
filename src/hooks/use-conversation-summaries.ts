import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ConversationSummary {
  id: string;
  conversation_id: string;
  user_id: string;
  summary_text: string;
  created_at: string;
  updated_at: string;
}

export const useConversationSummaries = () => {
  const [loading, setLoading] = useState(false);

  const fetchSummary = async (conversationId: string): Promise<ConversationSummary | null> => {
    setLoading(true);
    try {
      // Use direct SQL query since the table doesn't exist in types yet
      const { data, error } = await supabase
        .from('conversation_summaries' as any)
        .select('*')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching conversation summary:', error);
        return null;
      }

      return data as unknown as ConversationSummary;
    } catch (error) {
      console.error('Error fetching conversation summary:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchSummary,
    loading
  };
};