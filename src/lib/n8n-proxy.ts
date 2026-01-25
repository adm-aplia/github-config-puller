import { supabase } from '@/integrations/supabase/client';

// Allowed N8N endpoints that can be called through the proxy
export type N8NEndpoint = 
  | 'agendamento'
  | 'cancelamento'
  | 'deletar'
  | 'remarcar'
  | 'chat-interno'
  | 'google-eventos'
  | 'google-oauth';

interface ProxyResponse<T = unknown> {
  success: boolean;
  status: number;
  data: T;
}

/**
 * Send a request to N8N through the authenticated Supabase Edge Function proxy.
 * This ensures all webhook calls are authenticated and the N8N URLs are not exposed.
 * 
 * @param endpoint - The N8N endpoint identifier (e.g., 'agendamento', 'cancelamento')
 * @param payload - The data to send to the webhook
 * @returns The response from N8N
 */
export async function callN8NWebhook<T = unknown>(
  endpoint: N8NEndpoint,
  payload: unknown
): Promise<ProxyResponse<T>> {
  const { data: session } = await supabase.auth.getSession();
  
  if (!session?.session?.access_token) {
    throw new Error('User not authenticated');
  }

  const response = await supabase.functions.invoke('n8n-proxy', {
    body: { endpoint, payload },
  });

  if (response.error) {
    console.error('[n8n-proxy] Error:', response.error);
    throw new Error(response.error.message || 'Failed to call N8N webhook');
  }

  return response.data as ProxyResponse<T>;
}

/**
 * Helper to send appointment-related webhooks
 */
export async function sendAppointmentWebhook(queryObj: unknown) {
  return callN8NWebhook('agendamento', [{ query: JSON.stringify(queryObj) }]);
}

/**
 * Helper to send cancellation webhooks
 */
export async function sendCancellationWebhook(queryObj: unknown) {
  return callN8NWebhook('cancelamento', [{ query: JSON.stringify(queryObj) }]);
}

/**
 * Helper to send deletion webhooks
 */
export async function sendDeletionWebhook(queryObj: unknown) {
  return callN8NWebhook('deletar', [{ query: JSON.stringify(queryObj) }]);
}

/**
 * Helper to send reschedule webhooks
 */
export async function sendRescheduleWebhook(payload: unknown[]) {
  return callN8NWebhook('remarcar', payload);
}

/**
 * Helper to send chat messages via webhook
 */
export async function sendChatWebhook(payload: unknown) {
  return callN8NWebhook('chat-interno', payload);
}

/**
 * Helper to sync Google Calendar events
 */
export async function syncGoogleEventsWebhook(queryObj: unknown) {
  return callN8NWebhook('google-eventos', [{ query: JSON.stringify(queryObj) }]);
}

/**
 * Helper for Google OAuth callback
 */
export async function sendGoogleOAuthWebhook(payload: unknown) {
  return callN8NWebhook('google-oauth', payload);
}
