import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get the user from the token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    console.log('Cancelling subscription for user:', user.id)

    // Get user's client record
    const { data: cliente, error: clienteError } = await supabaseClient
      .from('clientes')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (clienteError || !cliente) {
      throw new Error('Cliente não encontrado')
    }

    // Get current active subscription
    const { data: currentSubscription, error: subscriptionError } = await supabaseClient
      .from('assinaturas')
      .select('*')
      .eq('cliente_id', cliente.id)
      .eq('status', 'active')
      .single()

    if (subscriptionError || !currentSubscription) {
      throw new Error('Nenhuma assinatura ativa encontrada')
    }

    // Update subscription status to cancelled but keep original end date
    const { error: updateError } = await supabaseClient
      .from('assinaturas')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', currentSubscription.id)

    if (updateError) {
      throw new Error('Erro ao cancelar assinatura: ' + updateError.message)
    }

    // DO NOT reset user limits immediately - they should keep access until data_fim
    // Limits will be reset automatically when the subscription expires

    // Cancel recurring subscription in Asaas
    if (currentSubscription.asaas_subscription_id) {
      console.log('[cancel-subscription] Cancelling Asaas subscription:', currentSubscription.asaas_subscription_id)
      
      const asaasApiKey = Deno.env.get('ASAAS_ENV') === 'production' 
        ? Deno.env.get('ASAAS_API_KEY')
        : Deno.env.get('ASAAS_SANDBOX_API_KEY')
      
      const asaasBaseUrl = Deno.env.get('ASAAS_ENV') === 'production' 
        ? 'https://www.asaas.com/api/v3'
        : 'https://sandbox.asaas.com/api/v3'
      
      try {
        const cancelResponse = await fetch(
          `${asaasBaseUrl}/subscriptions/${currentSubscription.asaas_subscription_id}`,
          {
            method: 'DELETE',
            headers: {
              'access_token': asaasApiKey,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!cancelResponse.ok) {
          const errorData = await cancelResponse.json()
          console.error('[cancel-subscription] Error cancelling in Asaas:', errorData)
          throw new Error(`Failed to cancel subscription in Asaas: ${JSON.stringify(errorData)}`)
        }
        
        console.log('[cancel-subscription] Subscription successfully cancelled in Asaas')
      } catch (error) {
        console.error('[cancel-subscription] Error calling Asaas API:', error)
        throw new Error(`Error cancelling subscription in Asaas: ${error.message}`)
      }
    }

    console.log('Subscription cancelled successfully for user:', user.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Assinatura cancelada com sucesso' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error cancelling subscription:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})