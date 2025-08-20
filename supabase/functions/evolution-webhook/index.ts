
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    
    // Simple token validation for security
    if (!token || token !== "aplia-webhook-2024") {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log("[evolution-webhook] Received webhook:", JSON.stringify(body, null, 2));

    const { event, instance, data } = body || {};
    
    if (!event || !instance) {
      return new Response(JSON.stringify({ error: "Missing event or instance" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Initialize Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different webhook events
    let updateData: any = {};
    let shouldUpdate = false;

    switch (event) {
      case "connection.update":
      case "CONNECTION_UPDATE":
        console.log(`[evolution-webhook] Processing connection update, state: ${data?.state}`);
        // Map various connection states to "connected"
        if (["open", "connected", "CONNECTED", "online"].includes(data?.state)) {
          updateData.status = "connected";
          updateData.last_connected_at = new Date().toISOString();
          shouldUpdate = true;
        } else if (["close", "disconnected", "DISCONNECTED", "offline"].includes(data?.state)) {
          updateData.status = "disconnected";
          shouldUpdate = true;
        }
        break;

      case "qrcode.updated":
      case "QRCODE_UPDATED":
        console.log("[evolution-webhook] Processing QR code update");
        if (data?.qrcode?.code) {
          updateData.qr_code = data.qrcode.code;
          updateData.status = "qr_pending";
          shouldUpdate = true;
        }
        break;

      case "messages.upsert":
      case "MESSAGES_UPSERT":
        // For message events, we can also extract contact info if needed
        console.log("[evolution-webhook] Processing message (no status update needed)");
        break;

      default:
        console.log(`[evolution-webhook] Unhandled event: ${event}`);
    }

    if (shouldUpdate) {
      updateData.updated_at = new Date().toISOString();
      
      const { error } = await supabase
        .from("whatsapp_instances")
        .update(updateData)
        .eq("instance_name", instance);

      if (error) {
        console.error("[evolution-webhook] Database update error:", error);
        return new Response(JSON.stringify({ error: "Database update failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[evolution-webhook] Updated instance ${instance} with:`, updateData);
    }

    return new Response(JSON.stringify({ success: true, processed: shouldUpdate }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[evolution-webhook] Error:", err);
    return new Response(JSON.stringify({ error: "Unexpected error", details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
