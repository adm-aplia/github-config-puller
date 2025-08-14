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
