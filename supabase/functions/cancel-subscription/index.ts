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

    // TODO: Integrate with Asaas API to cancel recurring billing if needed
    // This would require calling Asaas API with the subscription ID
    if (currentSubscription.asaas_subscription_id) {
      console.log('Would cancel Asaas subscription:', currentSubscription.asaas_subscription_id)
      // const asaasResponse = await cancelAsaasSubscription(currentSubscription.asaas_subscription_id)
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
        error: error.message || 'Erro interno do servidor' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})