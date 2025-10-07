
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const body = await req.json()
    const { newPlanId } = body

    // Validate required fields
    if (!newPlanId || typeof newPlanId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid plan ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[change-subscription] Mudança de plano solicitada para usuário:', user.id)

    // Buscar assinatura atual
    const { data: currentSubscription, error: subError } = await supabaseClient
      .from('assinaturas')
      .select(`
        *,
        planos!inner(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subError || !currentSubscription) {
      console.error('[change-subscription] Assinatura atual não encontrada:', subError)
      return new Response(
        JSON.stringify({ error: 'Assinatura atual não encontrada' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Buscar novo plano
    const { data: newPlan, error: planError } = await supabaseClient
      .from('planos')
      .select('*')
      .eq('id', newPlanId)
      .single()

    if (planError || !newPlan) {
      console.error('[change-subscription] Novo plano não encontrado:', planError)
      return new Response(
        JSON.stringify({ error: 'Plano não encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Buscar dados do cliente
    const { data: cliente, error: clienteError } = await supabaseClient
      .from('clientes')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (clienteError || !cliente) {
      console.error('[change-subscription] Cliente não encontrado:', clienteError)
      return new Response(
        JSON.stringify({ error: 'Dados do cliente não encontrados' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const currentPlan = currentSubscription.planos
    const isUpgrade = newPlan.preco > currentPlan.preco

    // Calcular cobrança proporcional se for upgrade
    let prorationAmount = 0
    if (isUpgrade) {
      const today = new Date()
      const nextDueDate = new Date(currentSubscription.proxima_cobranca)
      const daysRemaining = Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const totalDays = 30 // Assumindo ciclo de 30 dias
      
      const priceDifference = newPlan.preco - currentPlan.preco
      prorationAmount = (priceDifference * daysRemaining) / totalDays
      
      console.log('[change-subscription] Cobrança proporcional calculada:', {
        daysRemaining,
        priceDifference,
        prorationAmount: prorationAmount.toFixed(2)
      })
    }

    const asaasApiKey = Deno.env.get('ASAAS_ENV') === 'production' 
      ? Deno.env.get('ASAAS_API_KEY')
      : Deno.env.get('ASAAS_SANDBOX_API_KEY')

    if (!asaasApiKey) {
      console.error('[change-subscription] API key do Asaas não configurada')
      return new Response(
        JSON.stringify({ error: 'Configuração de pagamento não encontrada' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let paymentData = null

    // Criar cobrança proporcional se for upgrade
    if (isUpgrade && prorationAmount > 0) {
      console.log('[change-subscription] Criando cobrança proporcional no Asaas...')
      
      const paymentPayload: any = {
        customer: cliente.asaas_customer_id,
        billingType: 'CREDIT_CARD',
        dueDate: new Date().toISOString().split('T')[0],
        value: Math.round(prorationAmount * 100) / 100, // Arredondar para 2 casas decimais
        description: `Upgrade para plano ${newPlan.nome} - Cobrança proporcional`,
      }

      // Usar token do cartão salvo se disponível
      if (cliente.asaas_card_token) {
        paymentPayload.creditCardToken = cliente.asaas_card_token
      }

      const paymentResponse = await fetch('https://sandbox.asaas.com/api/v3/payments', {
        method: 'POST',
        headers: {
          'access_token': asaasApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPayload),
      })

      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text()
        console.error('[change-subscription] Erro ao criar cobrança proporcional:', errorText)
        return new Response(
          JSON.stringify({ error: 'Unable to process upgrade payment. Please try again.' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      paymentData = await paymentResponse.json()
      console.log('[change-subscription] Cobrança proporcional criada:', paymentData.id)
    }

    // Atualizar assinatura atual para inativa
    await supabaseClient
      .from('assinaturas')
      .update({ status: 'cancelled' })
      .eq('id', currentSubscription.id)

    // Criar nova assinatura
    const { data: newSubscription, error: newSubError } = await supabaseClient
      .from('assinaturas')
      .insert({
        cliente_id: cliente.id,
        plano_id: newPlanId,
        status: 'active',
        data_inicio: new Date().toISOString().split('T')[0],
        proxima_cobranca: currentSubscription.proxima_cobranca, // Mantém a data de cobrança
        asaas_subscription_id: null,
      })
      .select()
      .single()

    if (newSubError) {
      console.error('[change-subscription] Erro ao criar nova assinatura:', newSubError)
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar assinatura' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Atualizar limites do usuário
    await supabaseClient
      .from('usuario_limites')
      .upsert({
        user_id: user.id,
        assinatura_id: newSubscription.id,
        max_assistentes: newPlan.max_assistentes,
        max_instancias_whatsapp: newPlan.max_instancias_whatsapp,
        max_conversas_mes: newPlan.max_conversas_mes,
        max_agendamentos_mes: newPlan.max_agendamentos_mes,
      })

    console.log('[change-subscription] Mudança de plano concluída com sucesso')

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription: newSubscription,
        payment: paymentData,
        prorationAmount: isUpgrade ? prorationAmount : 0,
        isUpgrade
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[change-subscription] Erro inesperado:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again later.' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
