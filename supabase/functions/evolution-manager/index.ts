
/* Supabase Edge Function: evolution-manager
   - Cria instância na Evolution API com as configurações pedidas
   - Habilita webhook explicitamente
   - Atualiza o "nome bonito" no painel
   - Retorna dados úteis para salvar no banco
   - Implementa desconexão de instâncias
*/
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function slugifyWithRandom(displayName: string): { instanceName: string; prettyName: string } {
  const clean = displayName
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const prettyName = clean.replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  const slug = prettyName.replace(/\s+/g, "-");
  const random = Math.floor(10000 + Math.random() * 90000);
  return {
    instanceName: `${slug}${random}`,
    prettyName,
  };
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action, displayName, instanceName: providedInstanceName } = body || {};
    console.log("[evolution-manager] action:", action, "displayName:", displayName, "instanceName:", providedInstanceName);

    const BASE_URL = Deno.env.get("EVOLUTION_API_URL");
    const API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const WEBHOOK_URL = "https://vmqxzkukyfxxgxekkdem.functions.supabase.co/evolution-webhook?token=aplia-webhook-2024";

    if (!BASE_URL || !API_KEY) {
      return new Response(JSON.stringify({ error: "Missing Evolution API config" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "refresh_qr") {
      if (!providedInstanceName) {
        return new Response(JSON.stringify({ error: "Missing instanceName" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const connectRes = await fetch(`${BASE_URL}/instance/connect/${providedInstanceName}`, {
        method: "GET",
        headers: { "apikey": API_KEY },
      });
      const connectJson = await connectRes.json().catch(() => ({}));
      console.log("[evolution-manager] refresh connect status:", connectRes.status);
      const qrCode = connectJson?.qrcode?.code ?? null;
      return new Response(JSON.stringify({ qrCode }), {
        status: connectRes.ok ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect_instance") {
      if (!providedInstanceName) {
        return new Response(JSON.stringify({ error: "Missing instanceName" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.log("[evolution-manager] Disconnecting instance:", providedInstanceName);
      const logoutRes = await fetch(`${BASE_URL}/instance/logout/${providedInstanceName}`, {
        method: "DELETE",
        headers: { "apikey": API_KEY },
      });
      
      console.log("[evolution-manager] logout status:", logoutRes.status);
      
      return new Response(JSON.stringify({ 
        success: logoutRes.ok,
        status: logoutRes.status 
      }), {
        status: logoutRes.ok ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "fetch_instance_info") {
      if (!providedInstanceName) {
        return new Response(JSON.stringify({ error: "Missing instanceName" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.log("[evolution-manager] Fetching instance info:", providedInstanceName);
      
      try {
        // Try to get profile info from Evolution API
        const profileRes = await fetch(`${BASE_URL}/chat/findProfile/${providedInstanceName}`, {
          method: "GET",
          headers: { "apikey": API_KEY },
        });
        
        let phoneNumber = null;
        let profilePictureUrl = null;
        let displayName = null;
        
        if (profileRes.ok) {
          const profileData = await profileRes.json().catch(() => ({}));
          console.log("[evolution-manager] profile data:", profileData);
          
          // Extract info from response
          phoneNumber = profileData?.wuid || profileData?.phone || profileData?.number || null;
          profilePictureUrl = profileData?.profilePictureUrl || profileData?.picture || null;
          displayName = profileData?.name || profileData?.pushName || null;
        }
        
        return new Response(JSON.stringify({
          phone_number: phoneNumber,
          profile_picture_url: profilePictureUrl,
          display_name: displayName,
          success: true
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("[evolution-manager] fetch_instance_info error:", error);
        return new Response(JSON.stringify({ 
          error: "Failed to fetch instance info",
          success: false 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action !== "create_instance") {
      return new Response(JSON.stringify({ error: "Unsupported action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseName = typeof displayName === "string" && displayName.trim().length > 0 ? displayName : "instancia";
    const { instanceName, prettyName } = slugifyWithRandom(baseName);
    console.log("[evolution-manager] generated instance:", instanceName, "pretty:", prettyName);

    // 1) Create instance (v2 camelCase) with enhanced webhook events
    const createBody = {
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
      rejectCall: false,
      msgCall: "Chamadas não são aceitas",
      groupsIgnore: true,
      alwaysOnline: false,
      readMessages: false,
      readStatus: false,
      syncFullHistory: false,
      webhook: {
        url: WEBHOOK_URL,
        byEvents: false,
        base64: true,
        events: ["CONNECTION_UPDATE", "QRCODE_UPDATED", "MESSAGES_UPSERT"],
      },
    };

    const createRes = await fetch(`${BASE_URL}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": API_KEY,
      },
      body: JSON.stringify(createBody),
    });

    const createJson = await createRes.json().catch(() => ({}));
    console.log("[evolution-manager] create status:", createRes.status, "resp keys:", Object.keys(createJson || {}));

    if (!createRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to create instance", details: createJson }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Connect instance (helps ensure QR is generated/valid)
    const connectRes = await fetch(`${BASE_URL}/instance/connect/${instanceName}`, {
      method: "GET",
      headers: { "apikey": API_KEY },
    });
    const connectJson = await connectRes.json().catch(() => ({}));
    console.log("[evolution-manager] connect status:", connectRes.status);

    // Prefer QR from create, fallback to connect if provided
    const qrFromCreate = createJson?.qrcode?.code ?? null;
    const qrFromConnect = connectJson?.qrcode?.code ?? null;
    const qrCode = qrFromCreate || qrFromConnect || null;

    // 3) Enable webhook explicitly with retry and verification
    const webhookBody = {
      enabled: true,
      url: WEBHOOK_URL,
      webhookByEvents: false,
      webhookBase64: true,
      events: ["CONNECTION_UPDATE", "QRCODE_UPDATED", "MESSAGES_UPSERT"],
    };

    let webhookOk = false;
    let webhookRes = await fetch(`${BASE_URL}/webhook/set/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": API_KEY,
      },
      body: JSON.stringify(webhookBody),
    });
    let webhookJson = await webhookRes.json().catch(() => ({}));
    console.log("[evolution-manager] webhook status:", webhookRes.status);

    if (!webhookRes.ok) {
      // Retry with alternate body keys used by some deployments
      const altWebhookBody = {
        enabled: true,
        url: WEBHOOK_URL,
        byEvents: false,
        base64: true,
        events: ["CONNECTION_UPDATE", "QRCODE_UPDATED", "MESSAGES_UPSERT"],
      } as Record<string, unknown>;
      const retryRes = await fetch(`${BASE_URL}/webhook/set/${instanceName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": API_KEY,
        },
        body: JSON.stringify(altWebhookBody),
      });
      const retryJson = await retryRes.json().catch(() => ({}));
      console.log("[evolution-manager] webhook retry status:", retryRes.status);
      webhookRes = retryRes;
      webhookJson = retryJson;
    }

    // 4) Verify webhook status
    let finalWebhookEnabled = webhookRes.ok;
    try {
      const findRes = await fetch(`${BASE_URL}/webhook/find/${instanceName}`, {
        method: "GET",
        headers: { "apikey": API_KEY },
      });
      const findJson = await findRes.json().catch(() => ({}));
      console.log("[evolution-manager] webhook find status:", findRes.status);
      if (findRes.ok && (findJson?.enabled === true || findJson?.webhook?.enabled === true)) {
        finalWebhookEnabled = true;
      }
    } catch (_) {
      // ignore
    }

    // 5) Update profile name ("pretty" name)
    const nameRes = await fetch(`${BASE_URL}/chat/updateProfileName/${instanceName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": API_KEY,
      },
      body: JSON.stringify({ name: prettyName }),
    });
    const nameJson = await nameRes.json().catch(() => ({}));
    console.log("[evolution-manager] updateProfileName status:", nameRes.status);

    const result = {
      instanceName,
      displayName: prettyName,
      evolutionInstanceId: createJson?.instance?.instanceId ?? null,
      evolutionInstanceKey: createJson?.hash?.apikey ?? null,
      qrCode,
      webhookEnabled: finalWebhookEnabled,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[evolution-manager] error:", err);
    return new Response(JSON.stringify({ error: "Unexpected error", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
