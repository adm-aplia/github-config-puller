import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { GOOGLE_OAUTH, getRedirectUri } from "@/config/google";

export default function AuthGoogleCallback() {
  const [status, setStatus] = useState<"working" | "success" | "error">("working");
  const [message, setMessage] = useState<string>("Conectando sua conta Google...");

  useEffect(() => {
    document.title = "Conectando Google Agenda | Aplia";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Callback de autenticação do Google Agenda da Aplia");
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    const sendMessageToOpener = (result: { type: 'success' | 'error', message?: string }) => {
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage({ googleAuth: result }, window.location.origin);
        } catch {}
        window.close();
      } else {
        window.location.replace(`/dashboard/integracoes?auth_${result.type}=${result.message || 'true'}`);
      }
    };

    if (error) {
      setStatus("error");
      setMessage("Erro de autenticação com o Google.");
      sendMessageToOpener({ type: 'error', message: encodeURIComponent(error) });
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("Código de autorização não recebido.");
      sendMessageToOpener({ type: 'error', message: 'no_code' });
      return;
    }

    const sendToWebhook = async () => {
      try {
        let userId: string | null = null;
        if (state) {
          try {
            const parsed = JSON.parse(decodeURIComponent(state));
            userId = parsed?.user_id ?? null;
          } catch {}
        }

        const payload = {
          type: "google_auth_code",
          code,
          user_id: userId,
          redirect_uri: getRedirectUri(),
          timestamp: new Date().toISOString(),
          state,
          full_url: window.location.href,
        };

        const resp = await fetch(GOOGLE_OAUTH.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) throw new Error("webhook_failed");

        // Auto-link profile if pending
        const pendingProfileId = localStorage.getItem('pending_google_link_profile_id');
        console.log('🔍 [AuthGoogleCallback] Verificando pending_google_link_profile_id:', pendingProfileId);
        
        if (pendingProfileId) {
          try {
            console.log('⏳ [AuthGoogleCallback] Aguardando 2 segundos para garantir que a credencial foi criada...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Import supabase client
            const { supabase } = await import("@/integrations/supabase/client");
            
            // Get current user
            const { data: userData } = await supabase.auth.getUser();
            console.log('👤 [AuthGoogleCallback] Usuário atual:', userData.user?.id);
            
            if (userData.user) {
              // Get the most recent Google credential for this user
              const { data: credential, error: credError } = await supabase
                .from('google_credentials')
                .select('id, email')
                .eq('user_id', userData.user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
              
              console.log('🔑 [AuthGoogleCallback] Credencial encontrada:', credential, 'Erro:', credError);
              
              if (credential) {
                // Check if already linked
                const { data: existingLink } = await supabase
                  .from('google_profile_links')
                  .select('id')
                  .eq('google_credential_id', credential.id)
                  .eq('professional_profile_id', pendingProfileId)
                  .single();
                
                if (existingLink) {
                  console.log('ℹ️ [AuthGoogleCallback] Link já existe, ignorando');
                } else {
                  // Link the profile to the Google credential
                  const { error: linkError } = await supabase
                    .from('google_profile_links')
                    .insert({
                      google_credential_id: credential.id,
                      professional_profile_id: pendingProfileId
                    });
                  
                  if (linkError) {
                    console.error('❌ [AuthGoogleCallback] Erro ao criar link:', linkError);
                  } else {
                    console.log('✅ [AuthGoogleCallback] Auto-linked profile to Google credential');
                  }
                }
              } else {
                console.warn('⚠️ [AuthGoogleCallback] Nenhuma credencial Google encontrada para o usuário');
              }
            }
            
            // Clean up localStorage
            localStorage.removeItem('pending_google_link_profile_id');
            console.log('🧹 [AuthGoogleCallback] Limpou pending_google_link_profile_id do localStorage');
          } catch (linkError) {
            console.error('❌ [AuthGoogleCallback] Failed to auto-link profile:', linkError);
            localStorage.removeItem('pending_google_link_profile_id');
            // Don't fail the whole process if linking fails
          }
        }

        setStatus("success");
        setMessage("Conta Google conectada!");
        sendMessageToOpener({ type: 'success' });
      } catch (err) {
        setStatus("error");
        setMessage("Falha ao finalizar conexão com o Google.");
        sendMessageToOpener({ type: 'error', message: 'webhook_failed' });
      }
    };

    sendToWebhook();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Conectando ao Google</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "working" && (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-center text-sm text-muted-foreground">{message}</p>
            </>
          )}
          {status !== "working" && (
            <>
              <p className="text-center text-sm text-muted-foreground">{message}</p>
              <Button onClick={() => (window.location.href = "/dashboard/integracoes")}>Ir para Integrações</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
