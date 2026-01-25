// Centralized Google OAuth configuration
// NOTE: The Client ID is public information. Replace the placeholder below with your Google OAuth Client ID.

export const GOOGLE_OAUTH = {
  // Client ID público configurado pelo usuário (public by OAuth design)
  clientId: "627990196037-rpqnsvueptd785bqmlgs47glu5hkt3if.apps.googleusercontent.com",
  authBaseUrl: "https://accounts.google.com/o/oauth2/auth",
  // NOTE: Webhook URLs are now handled server-side via the n8n-proxy edge function for security
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
