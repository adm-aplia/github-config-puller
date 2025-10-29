import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get the user from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    console.log('[migrate-subscriptions] Starting migration for user:', user.id)

    const asaasApiKey = Deno.env.get('ASAAS_ENV') === 'production' 
      ? Deno.env.get('ASAAS_API_KEY')
      : Deno.env.get('ASAAS_SANDBOX_API_KEY')
    
    const asaasBaseUrl = Deno.env.get('ASAAS_ENV') === 'production' 
      ? 'https://www.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3'

    // Find active subscriptions without asaas_subscription_id
    const { data: assinaturas, error } = await supabase
      .from('assinaturas')
      .select(`
        id,
        cliente_id,
        plano_id,
        proxima_cobranca,
        clientes!inner (
          user_id,
          asaas_customer_id,
          asaas_card_token,
          email
        ),
        planos (
          nome,
          preco
        )
      `)
      .eq('status', 'active')
      .is('asaas_subscription_id', null)
      .eq('clientes.user_id', user.id)

    if (error) {
      throw error
    }

    console.log(`[migrate-subscriptions] Found ${assinaturas?.length || 0} subscriptions to migrate`)

    const results = []

    for (const assinatura of assinaturas || []) {
      try {
        const cliente = assinatura.clientes
        const plano = assinatura.planos

        if (!cliente.asaas_card_token) {
          results.push({
            assinatura_id: assinatura.id,
            status: 'error',
            message: 'Card token not found - user needs to add payment method'
          })
          continue
        }

        console.log(`[migrate-subscriptions] Creating subscription for assinatura ${assinatura.id}`)

        // Create recurring subscription in Asaas
        const subscriptionResponse = await fetch(`${asaasBaseUrl}/subscriptions`, {
          method: 'POST',
          headers: {
            'access_token': asaasApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer: cliente.asaas_customer_id,
            billingType: 'CREDIT_CARD',
            nextDueDate: assinatura.proxima_cobranca,
            value: plano.preco,
            cycle: 'MONTHLY',
            description: `Migração - Assinatura ${plano.nome}`,
            creditCard: {
              creditCardToken: cliente.asaas_card_token
            }
          }),
        })

        const subscriptionData = await subscriptionResponse.json()

        if (!subscriptionResponse.ok) {
          results.push({
            assinatura_id: assinatura.id,
            status: 'error',
            message: subscriptionData
          })
          continue
        }

        // Update database
        const { error: updateError } = await supabase
          .from('assinaturas')
          .update({ asaas_subscription_id: subscriptionData.id })
          .eq('id', assinatura.id)

        if (updateError) {
          results.push({
            assinatura_id: assinatura.id,
            asaas_subscription_id: subscriptionData.id,
            status: 'error',
            message: 'Subscription created in Asaas but failed to update database: ' + updateError.message
          })
          continue
        }

        results.push({
          assinatura_id: assinatura.id,
          asaas_subscription_id: subscriptionData.id,
          status: 'success'
        })

        console.log(`[migrate-subscriptions] Successfully migrated assinatura ${assinatura.id}`)

      } catch (err) {
        results.push({
          assinatura_id: assinatura.id,
          status: 'error',
          message: err.message
        })
      }
    }

    console.log('[migrate-subscriptions] Migration completed:', results)

    return new Response(
      JSON.stringify({ 
        success: true,
        migrated: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        results 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('[migrate-subscriptions] Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
