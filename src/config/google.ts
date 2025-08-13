// Centralized Google OAuth configuration
// NOTE: The Client ID is public information. Replace the placeholder below with your Google OAuth Client ID.

export const GOOGLE_OAUTH = {
  // TODO: substitua pelo Client ID do seu projeto Google Cloud
  clientId: "REPLACE_WITH_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
  authBaseUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  // Webhook N8N que fará a troca do code por tokens e salvará no Supabase
  webhookUrl:
    "https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/google-calendar-event-creator",
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
  ].join(" "),
};

export function getRedirectUri(): string {
  // Funciona tanto em dev quanto em produção
  return `${window.location.origin}/auth/google/callback`;
}

export function buildGoogleAuthUrl(stateObj: Record<string, unknown>): string {
  const stateParam = encodeURIComponent(JSON.stringify(stateObj));
  const redirectUri = getRedirectUri();
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH.scopes,
    access_type: "offline",
    prompt: "consent",
    state: stateParam,
  });
  return `${GOOGLE_OAUTH.authBaseUrl}?${params.toString()}`;
}
