import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePlans } from "@/hooks/use-plans";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Shield, ArrowLeft, MessageSquare, Calendar, Users, Mail, ChartColumn, CircleCheckBig, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { applyMask } from "@/lib/masks";
import { fetchAddressFromCep, debounce } from "@/lib/cep";

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
  name: string;
  number: string;
  expiry: string;
  cvv: string;
}

export default function CheckoutPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { plans, loading: plansLoading } = usePlans();
  
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const [customerData, setCustomerData] = useState<CustomerData>({
    nome: "",
    email: "",
    telefone: "",
    cpf_cnpj: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: ""
  });

  const [cardData, setCardData] = useState<CardData>({
    name: "",
    number: "",
    expiry: "",
    cvv: ""
  });

  useEffect(() => {
    if (plans.length > 0 && planId) {
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        setSelectedPlan(plan);
      } else {
        toast({
          title: "Erro",
          description: "Plano não encontrado.",
          variant: "destructive"
        });
        navigate('/dashboard/planos');
      }
    }
  }, [plans, planId, navigate, toast]);

  // Load and auto-fill user email
  useEffect(() => {
    const loadUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCustomerData(prev => ({ ...prev, email: user.email }));
      }
    };
    loadUserEmail();
  }, []);

  // Debounced CEP lookup
  const debouncedCepLookup = useCallback(
    debounce(async (cep: string) => {
      const addressData = await fetchAddressFromCep(cep);
      if (addressData) {
        setCustomerData(prev => ({
          ...prev,
          endereco: addressData.logradouro,
          bairro: addressData.bairro,
          cidade: addressData.localidade,
          estado: addressData.uf
        }));
      }
    }, 500),
    []
  );

  const handleCustomerDataChange = (field: keyof CustomerData, value: string) => {
    let maskedValue = value;
    
    // Apply masks based on field
    switch (field) {
      case 'cpf_cnpj':
        maskedValue = applyMask.cpfCnpj(value);
        break;
      case 'telefone':
        maskedValue = applyMask.phone(value);
        break;
      case 'cep':
        maskedValue = applyMask.cep(value);
        // Trigger CEP lookup when complete
        if (maskedValue.replace(/\D/g, '').length === 8) {
          debouncedCepLookup(maskedValue);
        }
        break;
    }
    
    setCustomerData(prev => ({ ...prev, [field]: maskedValue }));
  };

  const handleCardDataChange = (field: keyof CardData, value: string) => {
    let maskedValue = value;
    
    // Apply masks for card fields
    switch (field) {
      case 'number':
        maskedValue = applyMask.cardNumber(value);
        break;
      case 'expiry':
        maskedValue = applyMask.cardExpiry(value);
        break;
      case 'cvv':
        maskedValue = value.replace(/\D/g, '').slice(0, 4);
        break;
    }
    
    setCardData(prev => ({ ...prev, [field]: maskedValue }));
  };

  const validateStep1 = () => {
    const required = ['nome', 'email', 'telefone', 'cpf_cnpj', 'endereco', 'numero', 'bairro', 'cidade', 'estado', 'cep'];
    return required.every(field => customerData[field as keyof CustomerData].trim() !== '');
  };

  const validateStep2 = () => {
    const required = ['name', 'number', 'expiry', 'cvv'];
    return required.every(field => cardData[field as keyof CardData].trim() !== '');
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 1) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os dados do cartão.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const creditCard = {
        holderInfo: {
          name: cardData.name,
          email: customerData.email,
          cpfCnpj: customerData.cpf_cnpj.replace(/\D/g, ''),
          postalCode: customerData.cep.replace(/\D/g, ''),
          addressNumber: customerData.numero,
          addressComplement: customerData.complemento || '',
          phone: customerData.telefone.replace(/\D/g, ''),
          mobilePhone: customerData.telefone.replace(/\D/g, '')
        },
        number: cardData.number.replace(/\s/g, ''),
        expiryMonth: cardData.expiry.split('/')[0] || '',
        expiryYear: cardData.expiry.split('/')[1] || '',
        ccv: cardData.cvv
      };

      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planId: selectedPlan.id,
          creditCard
        }
      });

      if (error) throw error;

      toast({
        title: "Pagamento processado!",
        description: "Sua assinatura foi criada com sucesso.",
      });

      navigate('/dashboard/planos');
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      
      // Try to extract detailed error message from Asaas
      let errorMessage = 'Não foi possível processar o pagamento. Tente novamente.';
      
      if (error?.message) {
        // Check if the error message contains details from Asaas
        if (error.message.includes('details')) {
          try {
            // Try to parse the error message to extract Asaas details
            const errorStr = error.message;
            const detailsMatch = errorStr.match(/"details":\s*(\[.*?\])/);
            if (detailsMatch) {
              const details = JSON.parse(detailsMatch[1]);
              if (details && details.length > 0 && details[0].description) {
                errorMessage = details[0].description;
              }
            }
          } catch (parseError) {
            console.log('Could not parse error details:', parseError);
          }
        }
      }
      
      toast({
        title: "Erro no pagamento",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (plansLoading || !selectedPlan) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/dashboard/planos')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Finalizar Assinatura</h1>
            <p className="text-muted-foreground">
              Complete seus dados para ativar o plano {selectedPlan.nome}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Formulário - Col 1 */}
          <div className="order-2 lg:order-1">
            <Card className="shadow-lg border border-gray-200 dark:border-gray-700">
              <CardHeader className="bg-red-500 text-white rounded-t-lg">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Dados para Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form className="space-y-6">
                  {/* Dados Pessoais */}
                   <div className="space-y-4">
                     <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Dados Pessoais</h3>
                     <div>
                       <Label htmlFor="nome" className="text-gray-700 dark:text-gray-300">Nome Completo *</Label>
                      <Input
                        id="nome"
                        value={customerData.nome}
                        onChange={(e) => handleCustomerDataChange('nome', e.target.value)}
                        placeholder="Seu nome completo"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cpf_cnpj" className="text-gray-700 dark:text-gray-300">CPF *</Label>
                        <Input
                          id="cpf_cnpj"
                          value={customerData.cpf_cnpj}
                          onChange={(e) => handleCustomerDataChange('cpf_cnpj', e.target.value)}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          required
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefone" className="text-gray-700 dark:text-gray-300">Telefone *</Label>
                        <Input
                          id="telefone"
                          value={customerData.telefone}
                          onChange={(e) => handleCustomerDataChange('telefone', e.target.value)}
                          placeholder="(11) 99999-9999"
                          maxLength={15}
                          required
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={customerData.email}
                        disabled
                        className="mt-1 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Endereço */}
                   <div className="space-y-4">
                     <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Endereço</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="cep" className="text-gray-700 dark:text-gray-300">CEP</Label>
                        <Input
                          id="cep"
                          value={customerData.cep}
                          onChange={(e) => handleCustomerDataChange('cep', e.target.value)}
                          placeholder="00000-000"
                          maxLength={9}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endereco" className="text-gray-700 dark:text-gray-300">Rua</Label>
                        <Input
                          id="endereco"
                          value={customerData.endereco}
                          onChange={(e) => handleCustomerDataChange('endereco', e.target.value)}
                          placeholder="Nome da rua"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="numero" className="text-gray-700 dark:text-gray-300">Número</Label>
                        <Input
                          id="numero"
                          value={customerData.numero}
                          onChange={(e) => handleCustomerDataChange('numero', e.target.value)}
                          placeholder="123"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados do Cartão */}
                   <div className="space-y-4">
                     <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                       <CreditCard className="h-5 w-5 text-red-500" />
                       Dados do Cartão de Crédito
                     </h3>
                    <div>
                      <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Nome no Cartão *</Label>
                      <Input
                        id="name"
                        value={cardData.name}
                        onChange={(e) => handleCardDataChange('name', e.target.value)}
                        placeholder="Nome como está no cartão"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="number" className="text-gray-700 dark:text-gray-300">Número do Cartão *</Label>
                      <Input
                        id="number"
                        value={cardData.number}
                        onChange={(e) => handleCardDataChange('number', e.target.value)}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        required
                        className="mt-1"
                      />
                    </div>
                     <div className="grid grid-cols-3 gap-4">
                       <div>
                         <Label htmlFor="mesExpiracao" className="text-gray-700 dark:text-gray-300">Mês *</Label>
                         <Input
                           id="mesExpiracao"
                           value={cardData.expiry.split('/')[0] || ''}
                           onChange={(e) => {
                             const month = e.target.value.replace(/\D/g, '').slice(0, 2);
                             const year = cardData.expiry.split('/')[1] || '';
                             handleCardDataChange('expiry', year ? `${month}/${year}` : month);
                           }}
                           placeholder="MM"
                           maxLength={2}
                           required
                           className="mt-1"
                         />
                       </div>
                       <div>
                         <Label htmlFor="anoExpiracao" className="text-gray-700 dark:text-gray-300">Ano *</Label>
                         <Input
                           id="anoExpiracao"
                           value={cardData.expiry.split('/')[1] || ''}
                           onChange={(e) => {
                             const year = e.target.value.replace(/\D/g, '').slice(0, 4);
                             const month = cardData.expiry.split('/')[0] || '';
                             handleCardDataChange('expiry', month ? `${month}/${year}` : year);
                           }}
                           placeholder="AAAA"
                           maxLength={4}
                           required
                           className="mt-1"
                         />
                       </div>
                       <div>
                         <Label htmlFor="cvv" className="text-gray-700 dark:text-gray-300">CVV *</Label>
                         <Input
                           id="cvv"
                           value={cardData.cvv}
                           onChange={(e) => handleCardDataChange('cvv', e.target.value)}
                           placeholder="123"
                           maxLength={4}
                           required
                           className="mt-1"
                         />
                       </div>
                     </div>
                  </div>

                  <Button 
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-4 text-lg font-semibold h-14"
                  >
                    {loading ? 'Processando...' : 'Confirmar e Ativar Plano'}
                  </Button>

                  {/* Security Footer */}
                  <div className="flex justify-center items-center gap-6 pt-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3 text-green-500" />
                      <span>Checkout Seguro</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Lock className="h-3 w-3 text-green-500" />
                      <span>SSL Ativado</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CircleCheckBig className="h-3 w-3 text-green-500" />
                      <span>Transação Protegida</span>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Pedido - Col 2 */}
          <div className="order-1 lg:order-2">
            <Card className="shadow-lg border border-gray-200 dark:border-gray-700 sticky top-8">
              <CardHeader className="bg-aplia-blue text-white rounded-t-lg">
                <CardTitle className="font-semibold tracking-tight text-xl">Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedPlan.nome}</h3>
                  <div className="text-4xl font-bold text-red-500 mt-2">
                    R$ {selectedPlan.preco}/mês
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Cobrança mensal recorrente. <strong className="text-gray-900 dark:text-white">Cancele quando quiser.</strong>
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Benefícios inclusos:</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm">
                      <MessageSquare className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{selectedPlan.max_instancias_whatsapp} Números de WhatsApp</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Até {selectedPlan.max_agendamentos_mes.toLocaleString()} agendamentos/mês</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <Users className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{selectedPlan.max_assistentes} Assistentes personalizados</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Suporte prioritário</span>
                    </li>
                    <li className="flex items-center gap-3 text-sm">
                      <ChartColumn className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Relatórios Avançados</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}