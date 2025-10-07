
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

    // Service role client for database operations that bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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
    const { planId, creditCard } = body

    // Validate required fields
    if (!planId || typeof planId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid plan ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!creditCard || !creditCard.number || !creditCard.holderName || !creditCard.expiryMonth || !creditCard.expiryYear || !creditCard.ccv) {
      return new Response(
        JSON.stringify({ error: 'Invalid credit card information' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[create-subscription] Iniciando criação de assinatura para usuário:', user.id)

    // Buscar dados do plano
    const { data: plan, error: planError } = await supabaseClient
      .from('planos')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      console.error('[create-subscription] Erro ao buscar plano:', planError)
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
      console.error('[create-subscription] Erro ao buscar cliente:', clienteError)
      return new Response(
        JSON.stringify({ error: 'Dados do cliente não encontrados' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const asaasEnv = Deno.env.get('ASAAS_ENV') || 'sandbox'
    const asaasApiKey = asaasEnv === 'production' 
      ? Deno.env.get('ASAAS_API_KEY')
      : Deno.env.get('ASAAS_SANDBOX_API_KEY')
    
    const asaasBaseUrl = asaasEnv === 'production' 
      ? 'https://www.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3'

    console.log('[create-subscription] Usando ambiente Asaas:', asaasEnv)

    if (!asaasApiKey) {
      console.error('[create-subscription] API key do Asaas não configurada para ambiente:', asaasEnv)
      return new Response(
        JSON.stringify({ error: 'Configuração de pagamento não encontrada' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Criar ou atualizar cliente no Asaas se necessário
    let asaasCustomerId = cliente.asaas_customer_id
    if (!asaasCustomerId) {
      console.log('[create-subscription] Criando cliente no Asaas...')
      const customerResponse = await fetch(`${asaasBaseUrl}/customers`, {
        method: 'POST',
        headers: {
          'access_token': asaasApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cliente.nome,
          email: cliente.email,
          phone: cliente.telefone,
          cpfCnpj: cliente.cpf_cnpj,
        }),
      })

      if (!customerResponse.ok) {
        const errorText = await customerResponse.text()
        console.error('[create-subscription] Erro ao criar cliente no Asaas:', errorText)
        return new Response(
          JSON.stringify({ error: 'Unable to process customer registration. Please verify your information.' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const customerData = await customerResponse.json()
      asaasCustomerId = customerData.id
      console.log('[create-subscription] Cliente criado no Asaas:', asaasCustomerId)

      // Atualizar cliente com ID do Asaas
      await supabaseClient
        .from('clientes')
        .update({ asaas_customer_id: asaasCustomerId })
        .eq('id', cliente.id)
    }

    // Criar cobrança imediata para ativação do plano
    const today = new Date()
    const nextDueDate = new Date(today)
    nextDueDate.setDate(today.getDate() + 30)

    console.log('[create-subscription] Criando cobrança imediata no Asaas...')
    
    const paymentResponse = await fetch(`${asaasBaseUrl}/payments`, {
      method: 'POST',
      headers: {
        'access_token': asaasApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: 'CREDIT_CARD',
        dueDate: today.toISOString().split('T')[0],
        value: plan.preco,
        description: `Ativação do plano ${plan.nome}`,
        creditCard: {
          ...creditCard,
          holderName: creditCard.holderInfo?.name || creditCard.holderName
        },
        creditCardHolderInfo: creditCard.holderInfo,
      }),
    })

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text()
      console.error('[create-subscription] Erro ao criar cobrança no Asaas:', errorText)
      return new Response(
        JSON.stringify({ error: 'Payment processing failed. Please verify your card details and try again.' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const paymentData = await paymentResponse.json()
    console.log('[create-subscription] Cobrança criada no Asaas:', paymentData.id, 'Status:', paymentData.status)

    // Salvar token do cartão se fornecido
    if (paymentData.creditCard?.creditCardToken) {
      await supabaseClient
        .from('clientes')
        .update({ asaas_card_token: paymentData.creditCard.creditCardToken })
        .eq('id', cliente.id)
      console.log('[create-subscription] Token do cartão salvo')
    }

    // Mapear status do Asaas para determinar se está pago
    const paidStatuses = ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH', 'RECEIVED_IN_CHECK']
    const isPaid = paidStatuses.includes(paymentData.status)
    const subscriptionStatus = isPaid ? 'active' : 'pending'
    
    console.log('[create-subscription] Status do pagamento mapeado:', paymentData.status, '-> isPaid:', isPaid, '-> subscriptionStatus:', subscriptionStatus)

    // Calcular próxima cobrança baseada no período do plano
    const proximaCobranca = new Date(today)
    if (plan.periodo === 'yearly') {
      proximaCobranca.setFullYear(today.getFullYear() + 1)
    } else {
      proximaCobranca.setMonth(today.getMonth() + 1)
    }

    // Criar assinatura no banco
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('assinaturas')
      .insert({
        cliente_id: cliente.id,
        plano_id: planId,
        status: subscriptionStatus,
        data_inicio: today.toISOString().split('T')[0],
        proxima_cobranca: proximaCobranca.toISOString().split('T')[0],
        asaas_subscription_id: null, // Não criamos assinatura recorrente ainda
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error('[create-subscription] Erro ao criar assinatura:', subscriptionError)
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar assinatura' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('[create-subscription] Assinatura criada:', subscription.id, 'Status:', subscription.status)

    // Criar registro na tabela de cobranças
    const { data: cobranca, error: cobrancaError } = await supabaseAdmin
      .from('cobrancas')
      .insert({
        cliente_id: cliente.id,
        assinatura_id: subscription.id,
        valor: plan.preco,
        status: isPaid ? 'paid' : 'pending',
        descricao: `Ativação do plano ${plan.nome}`,
        data_vencimento: paymentData.dueDate || today.toISOString().split('T')[0],
        data_pagamento: isPaid ? (paymentData.paymentDate || paymentData.clientPaymentDate || today.toISOString().split('T')[0]) : null,
        forma_pagamento: 'CREDIT_CARD',
        link_pagamento: paymentData.invoiceUrl,
        asaas_payment_id: paymentData.id
      })
      .select()
      .single()

    if (cobrancaError) {
      console.error('[create-subscription] Erro ao criar cobrança:', cobrancaError)
      // Não retornamos erro aqui pois a assinatura já foi criada
    } else {
      console.log('[create-subscription] Cobrança criada:', cobranca.id, 'Status:', cobranca.status)
    }

    // Atualizar limites do usuário APENAS se o pagamento foi confirmado
    if (isPaid && subscriptionStatus === 'active') {
      const { error: limitesError } = await supabaseAdmin
        .from('usuario_limites')
        .upsert({
          user_id: user.id,
          assinatura_id: subscription.id,
          max_assistentes: plan.max_assistentes,
          max_instancias_whatsapp: plan.max_instancias_whatsapp,
          max_conversas_mes: plan.max_conversas_mes,
          max_agendamentos_mes: plan.max_agendamentos_mes,
        }, { onConflict: 'user_id' })

      if (limitesError) {
        console.error('[create-subscription] Erro ao atualizar limites:', limitesError)
      } else {
        console.log('[create-subscription] Limites atualizados para o plano:', plan.nome)
      }
    } else {
      console.log('[create-subscription] Limites não atualizados - pagamento ainda pendente')
    }

    console.log('[create-subscription] Assinatura criada com sucesso:', subscription.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription: subscription,
        payment: {
          id: paymentData.id,
          status: paymentData.status,
          invoiceUrl: paymentData.invoiceUrl
        },
        cobranca: cobranca ? {
          id: cobranca.id,
          status: cobranca.status,
          valor: cobranca.valor
        } : null
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('[create-subscription] Erro inesperado:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again later.' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
