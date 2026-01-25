import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// N8N webhook base URL - stored server-side for security
const N8N_BASE_URL = 'https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook'

// Allowed webhook endpoints with their paths
const ALLOWED_ENDPOINTS: Record<string, string> = {
  'agendamento': '/agendamento-aplia',
  'cancelamento': '/cancelamento-site',
  'deletar': '/deletar-site',
  'remarcar': '/remarcar',
  'chat-interno': '/apliachatinterno',
  'google-eventos': '/eventos-google-agenda',
  'google-oauth': '/google-calendar-event-creator',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Get the user from the token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('[n8n-proxy] Authenticated user:', user.id)

    // Parse request body
    const body = await req.json()
    const { endpoint, payload } = body

    // Validate endpoint
    if (!endpoint || !ALLOWED_ENDPOINTS[endpoint]) {
      return new Response(
        JSON.stringify({ error: `Invalid endpoint: ${endpoint}. Allowed: ${Object.keys(ALLOWED_ENDPOINTS).join(', ')}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate payload exists
    if (!payload) {
      return new Response(
        JSON.stringify({ error: 'Missing payload' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Inject user_id into the payload for additional server-side verification
    // This ensures the N8N webhook knows which user is making the request
    let enrichedPayload = payload

    // If payload is an array (common format), enrich each item
    if (Array.isArray(payload)) {
      enrichedPayload = payload.map(item => {
        if (item.query) {
          try {
            const queryObj = typeof item.query === 'string' ? JSON.parse(item.query) : item.query
            queryObj._authenticated_user_id = user.id
            return { ...item, query: JSON.stringify(queryObj) }
          } catch {
            return { ...item, _authenticated_user_id: user.id }
          }
        }
        return { ...item, _authenticated_user_id: user.id }
      })
    } else if (typeof payload === 'object') {
      enrichedPayload = { ...payload, _authenticated_user_id: user.id }
    }

    // Build the N8N webhook URL
    const webhookUrl = `${N8N_BASE_URL}${ALLOWED_ENDPOINTS[endpoint]}`
    
    console.log(`[n8n-proxy] Forwarding to: ${endpoint} (${webhookUrl})`)
    console.log('[n8n-proxy] Payload size:', JSON.stringify(enrichedPayload).length, 'bytes')

    // Forward request to N8N
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(enrichedPayload)
    })

    // Get response from N8N
    let n8nData
    const contentType = n8nResponse.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      n8nData = await n8nResponse.json()
    } else {
      n8nData = await n8nResponse.text()
    }

    console.log('[n8n-proxy] N8N response status:', n8nResponse.status)

    // Return the N8N response
    return new Response(
      JSON.stringify({
        success: n8nResponse.ok,
        status: n8nResponse.status,
        data: n8nData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: n8nResponse.ok ? 200 : n8nResponse.status,
      }
    )

  } catch (error) {
    console.error('[n8n-proxy] Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
