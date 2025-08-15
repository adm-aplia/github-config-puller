import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePlans } from "@/hooks/use-plans";
import { supabase } from "@/integrations/supabase/client";
import { Crown, CreditCard, Shield, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
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
    holderName: "",
    number: "",
    expiryMonth: "",
    expiryYear: "",
    ccv: ""
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

  const handleCustomerDataChange = (field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const handleCardDataChange = (field: keyof CardData, value: string) => {
    setCardData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    const required = ['nome', 'email', 'telefone', 'cpf_cnpj', 'endereco', 'numero', 'bairro', 'cidade', 'estado', 'cep'];
    return required.every(field => customerData[field as keyof CustomerData].trim() !== '');
  };

  const validateStep2 = () => {
    const required = ['holderName', 'number', 'expiryMonth', 'expiryYear', 'ccv'];
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
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planId: selectedPlan.id,
          customerData,
          cardData
        }
      });

      if (error) throw error;

      toast({
        title: "Pagamento processado!",
        description: "Sua assinatura foi criada com sucesso.",
      });

      navigate('/dashboard/planos');
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resumo do Plano */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{selectedPlan.nome}</span>
                    <Badge variant="secondary">{selectedPlan.periodo}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlan.descricao}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-medium">Recursos inclusos:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      {selectedPlan.max_assistentes} assistente(s)
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      {selectedPlan.max_instancias_whatsapp} instância(s) WhatsApp
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      {selectedPlan.max_conversas_mes} conversas/mês
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      {selectedPlan.max_agendamentos_mes} agendamentos/mês
                    </li>
                  </ul>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>R$ {selectedPlan.preco.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  Pagamento seguro com criptografia SSL
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulário */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {step === 1 ? "Dados Pessoais" : "Dados do Cartão"}
                </CardTitle>
                <CardDescription>
                  {step === 1 
                    ? "Preencha seus dados pessoais para faturamento"
                    : "Insira os dados do cartão de crédito"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {step === 1 ? (
                  /* Dados Pessoais */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nome">Nome Completo *</Label>
                        <Input
                          id="nome"
                          value={customerData.nome}
                          onChange={(e) => handleCustomerDataChange('nome', e.target.value)}
                          placeholder="Seu nome completo"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerData.email}
                          onChange={(e) => handleCustomerDataChange('email', e.target.value)}
                          placeholder="seu@email.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefone">Telefone *</Label>
                        <Input
                          id="telefone"
                          value={customerData.telefone}
                          onChange={(e) => handleCustomerDataChange('telefone', e.target.value)}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cpf_cnpj">CPF/CNPJ *</Label>
                        <Input
                          id="cpf_cnpj"
                          value={customerData.cpf_cnpj}
                          onChange={(e) => handleCustomerDataChange('cpf_cnpj', e.target.value)}
                          placeholder="000.000.000-00"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium">Endereço de Cobrança</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <Label htmlFor="endereco">Endereço *</Label>
                          <Input
                            id="endereco"
                            value={customerData.endereco}
                            onChange={(e) => handleCustomerDataChange('endereco', e.target.value)}
                            placeholder="Rua, Avenida, etc."
                          />
                        </div>
                        <div>
                          <Label htmlFor="numero">Número *</Label>
                          <Input
                            id="numero"
                            value={customerData.numero}
                            onChange={(e) => handleCustomerDataChange('numero', e.target.value)}
                            placeholder="123"
                          />
                        </div>
                        <div>
                          <Label htmlFor="complemento">Complemento</Label>
                          <Input
                            id="complemento"
                            value={customerData.complemento}
                            onChange={(e) => handleCustomerDataChange('complemento', e.target.value)}
                            placeholder="Apto, Sala, etc."
                          />
                        </div>
                        <div>
                          <Label htmlFor="bairro">Bairro *</Label>
                          <Input
                            id="bairro"
                            value={customerData.bairro}
                            onChange={(e) => handleCustomerDataChange('bairro', e.target.value)}
                            placeholder="Nome do bairro"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cep">CEP *</Label>
                          <Input
                            id="cep"
                            value={customerData.cep}
                            onChange={(e) => handleCustomerDataChange('cep', e.target.value)}
                            placeholder="00000-000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="cidade">Cidade *</Label>
                          <Input
                            id="cidade"
                            value={customerData.cidade}
                            onChange={(e) => handleCustomerDataChange('cidade', e.target.value)}
                            placeholder="Nome da cidade"
                          />
                        </div>
                        <div>
                          <Label htmlFor="estado">Estado *</Label>
                          <Select
                            value={customerData.estado}
                            onValueChange={(value) => handleCustomerDataChange('estado', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SP">São Paulo</SelectItem>
                              <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                              <SelectItem value="MG">Minas Gerais</SelectItem>
                              <SelectItem value="PR">Paraná</SelectItem>
                              <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                              <SelectItem value="SC">Santa Catarina</SelectItem>
                              <SelectItem value="BA">Bahia</SelectItem>
                              <SelectItem value="DF">Distrito Federal</SelectItem>
                              <SelectItem value="GO">Goiás</SelectItem>
                              <SelectItem value="PE">Pernambuco</SelectItem>
                              <SelectItem value="CE">Ceará</SelectItem>
                              <SelectItem value="PA">Pará</SelectItem>
                              <SelectItem value="MA">Maranhão</SelectItem>
                              <SelectItem value="PB">Paraíba</SelectItem>
                              <SelectItem value="ES">Espírito Santo</SelectItem>
                              <SelectItem value="AL">Alagoas</SelectItem>
                              <SelectItem value="MT">Mato Grosso</SelectItem>
                              <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                              <SelectItem value="RO">Rondônia</SelectItem>
                              <SelectItem value="AC">Acre</SelectItem>
                              <SelectItem value="AM">Amazonas</SelectItem>
                              <SelectItem value="RR">Roraima</SelectItem>
                              <SelectItem value="AP">Amapá</SelectItem>
                              <SelectItem value="TO">Tocantins</SelectItem>
                              <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                              <SelectItem value="SE">Sergipe</SelectItem>
                              <SelectItem value="PI">Piauí</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleNextStep}>
                        Continuar
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Dados do Cartão */
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="holderName">Nome do Titular *</Label>
                      <Input
                        id="holderName"
                        value={cardData.holderName}
                        onChange={(e) => handleCardDataChange('holderName', e.target.value)}
                        placeholder="Nome como está no cartão"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardNumber">Número do Cartão *</Label>
                      <Input
                        id="cardNumber"
                        value={cardData.number}
                        onChange={(e) => handleCardDataChange('number', e.target.value)}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="expiryMonth">Mês *</Label>
                        <Select
                          value={cardData.expiryMonth}
                          onValueChange={(value) => handleCardDataChange('expiryMonth', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="MM" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => {
                              const month = (i + 1).toString().padStart(2, '0');
                              return (
                                <SelectItem key={month} value={month}>
                                  {month}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="expiryYear">Ano *</Label>
                        <Select
                          value={cardData.expiryYear}
                          onValueChange={(value) => handleCardDataChange('expiryYear', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="AAAA" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => {
                              const year = (new Date().getFullYear() + i).toString();
                              return (
                                <SelectItem key={year} value={year}>
                                  {year}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="ccv">CCV *</Label>
                        <Input
                          id="ccv"
                          value={cardData.ccv}
                          onChange={(e) => handleCardDataChange('ccv', e.target.value)}
                          placeholder="123"
                          maxLength={4}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setStep(1)}
                        disabled={loading}
                      >
                        Voltar
                      </Button>
                      <Button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processando...
                          </>
                        ) : (
                          `Finalizar Pagamento - R$ ${selectedPlan.preco.toFixed(2)}`
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}