import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CustomerData {
  nome: string;
  email: string;
  telefone: string;
  cpf_cnpj: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

interface CardData {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();

    // Special endpoint to check environment
    if (requestBody.checkEnvironment) {
      const asaasEnv = Deno.env.get('ASAAS_ENV') || 'production';
      return new Response(JSON.stringify({
        environment: asaasEnv
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { planId, customerData, cardData }: {
      planId: string;
      customerData: CustomerData;
      cardData: CardData;
    } = requestBody;

    // Create Supabase client with service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from('planos')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error('Plano não encontrado');
    }

    // Create or update customer data in Supabase
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .upsert({
        user_id: user.id,
        nome: customerData.nome,
        email: customerData.email,
        telefone: customerData.telefone,
        cpf_cnpj: customerData.cpf_cnpj,
        endereco: customerData.endereco,
        numero: customerData.numero,
        complemento: customerData.complemento,
        bairro: customerData.bairro,
        cidade: customerData.cidade,
        estado: customerData.estado,
        cep: customerData.cep
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (clienteError) {
      console.error('Error creating cliente:', clienteError);
      throw new Error('Erro ao criar cliente');
    }

    // Determine environment and API configuration
    const asaasEnv = Deno.env.get('ASAAS_ENV') || 'production';
    const isProduction = asaasEnv === 'production';
    const asaasBaseUrl = isProduction ? 'https://www.asaas.com/api/v3' : 'https://sandbox.asaas.com/api/v3';
    const asaasApiKey = isProduction ? Deno.env.get('ASAAS_API_KEY') : Deno.env.get('ASAAS_SANDBOX_API_KEY');

    console.log(`Using Asaas ${isProduction ? 'production' : 'sandbox'} environment`);

    // Create customer in Asaas
    const asaasCustomerResponse = await fetch(`${asaasBaseUrl}/customers`, {
      method: 'POST',
      headers: {
        'access_token': asaasApiKey ?? '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: customerData.nome,
        email: customerData.email,
        phone: customerData.telefone,
        cpfCnpj: customerData.cpf_cnpj,
        address: customerData.endereco,
        addressNumber: customerData.numero,
        complement: customerData.complemento,
        province: customerData.bairro,
        city: customerData.cidade,
        state: customerData.estado,
        postalCode: customerData.cep
      })
    });

    if (!asaasCustomerResponse.ok) {
      const errorData = await asaasCustomerResponse.text();
      console.error('Asaas customer creation error:', errorData);
      throw new Error('Erro ao criar cliente no Asaas');
    }

    const asaasCustomer = await asaasCustomerResponse.json();

    // Update cliente with Asaas customer ID
    await supabaseAdmin
      .from('clientes')
      .update({ asaas_customer_id: asaasCustomer.id })
      .eq('id', cliente.id);

    // Create subscription in Asaas
    const asaasSubscriptionResponse = await fetch(`${asaasBaseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'access_token': asaasApiKey ?? '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: asaasCustomer.id,
        billingType: 'CREDIT_CARD',
        value: plan.preco,
        nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        cycle: 'MONTHLY',
        description: `Assinatura ${plan.nome}`,
        creditCard: {
          holderName: cardData.name,
          number: cardData.number.replace(/\s/g, ''),
          expiryMonth: cardData.expiry ? cardData.expiry.split('/')[0] : '',
          expiryYear: cardData.expiry ? '20' + cardData.expiry.split('/')[1] : '',
          ccv: cardData.cvv
        },
        creditCardHolderInfo: {
          name: customerData.nome,
          email: customerData.email,
          cpfCnpj: customerData.cpf_cnpj,
          postalCode: customerData.cep,
          addressNumber: customerData.numero,
          phone: customerData.telefone
        }
      })
    });

    if (!asaasSubscriptionResponse.ok) {
      const errorData = await asaasSubscriptionResponse.text();
      console.error('Asaas subscription creation error:', errorData);
      throw new Error('Erro ao criar assinatura no Asaas');
    }

    const asaasSubscription = await asaasSubscriptionResponse.json();

    // Create subscription in Supabase
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('assinaturas')
      .insert({
        cliente_id: cliente.id,
        plano_id: plan.id,
        status: 'active',
        data_inicio: new Date().toISOString().split('T')[0],
        proxima_cobranca: asaasSubscription.nextDueDate,
        asaas_subscription_id: asaasSubscription.id
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      throw new Error('Erro ao criar assinatura');
    }

    // Update user limits based on plan
    await supabaseAdmin
      .from('usuario_limites')
      .upsert({
        user_id: user.id,
        assinatura_id: subscription.id,
        max_assistentes: plan.max_assistentes,
        max_instancias_whatsapp: plan.max_instancias_whatsapp,
        max_conversas_mes: plan.max_conversas_mes,
        max_agendamentos_mes: plan.max_agendamentos_mes
      }, {
        onConflict: 'user_id'
      });

    return new Response(JSON.stringify({
      success: true,
      subscriptionId: subscription.id,
      asaasSubscriptionId: asaasSubscription.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in create-subscription:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Erro interno do servidor'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});