import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { profileData, action } = await req.json()
    
    if (!profileData) {
      return new Response(
        JSON.stringify({ error: 'Profile data is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Sending profile data to n8n webhook:', { profileData, action })

    // Send data to the n8n webhook
    const webhookResponse = await fetch('https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/questionario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileData, action })
    })

    if (!webhookResponse.ok) {
      console.error('Webhook failed:', webhookResponse.status, await webhookResponse.text())
      throw new Error(`Webhook request failed with status ${webhookResponse.status}`)
    }

    const webhookResult = await webhookResponse.text()
    console.log('Webhook response:', webhookResult)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Profile data sent to webhook successfully',
        webhookResponse: webhookResult 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in profile-webhook function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send profile data to webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})