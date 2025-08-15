import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckoutModal } from "@/components/checkout/checkout-modal";
import { usePlans } from "@/hooks/use-plans";
import { useSubscription } from "@/hooks/use-subscription";
import { usePayments } from "@/hooks/use-payments";
import { useUserUsage } from "@/hooks/use-user-usage";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CalendarDays, 
  CreditCard, 
  Smartphone, 
  Users, 
  HeadphonesIcon, 
  Database, 
  Building, 
  MessageCircle, 
  Calendar,
  Bot,
  Mail,
  ChartColumn,
  Clock,
  Building2,
  Settings
} from "lucide-react";

export default function PlanosPage() {
  const navigate = useNavigate();
  const { plans, loading: plansLoading } = usePlans();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { payments, loading: paymentsLoading } = usePayments();
  const { usage, loading: usageLoading } = useUserUsage();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleSelectPlan = (plan: any) => {
    navigate(`/dashboard/checkout/${plan.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'básico':
        return <Users className="h-5 w-5" />;
      case 'profissional':
        return <Building className="h-5 w-5" />;
      case 'empresarial':
        return <Database className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('whatsapp') || feature.includes('WhatsApp') || feature.includes('Número')) {
      return <MessageCircle className="h-4 w-4 text-red-500" />;
    }
    if (feature.includes('agendamento')) {
      return <Calendar className="h-4 w-4 text-red-500" />;
    }
    if (feature.includes('assistente') || feature.includes('Assistente')) {
      return <Bot className="h-4 w-4 text-red-500" />;
    }
    if (feature.includes('suporte') || feature.includes('Suporte')) {
      return <Users className="h-4 w-4 text-red-500" />;
    }
    if (feature.includes('e-mail') || feature.includes('email')) {
      return <Mail className="h-4 w-4 text-red-500" />;
    }
    if (feature.includes('Relatório') || feature.includes('relatório')) {
      return <ChartColumn className="h-4 w-4 text-red-500" />;
    }
    if (feature.includes('24/7') || feature.includes('dedicado')) {
      return <Clock className="h-4 w-4 text-red-500" />;
    }
    if (feature.includes('sistema') || feature.includes('Integração')) {
      return <Building2 className="h-4 w-4 text-red-500" />;
    }
    if (feature.includes('Personalização') || feature.includes('personalização')) {
      return <Settings className="h-4 w-4 text-red-500" />;
    }
    return <CreditCard className="h-4 w-4 text-red-500" />;
  };

  const getPlanFeatures = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'básico':
        return [
          "1 Número de whatsapp",
          "Até 300 agendamentos/mês", 
          "1 Assistente personalizado",
          "Suporte por e-mail"
        ];
      case 'profissional':
        return [
          "3 Números de whatsApp",
          "Até 1.000 agendamentos/mês",
          "3 assistentes personalizado", 
          "Suporte prioritário",
          "Relatórios Avançados"
        ];
      case 'empresarial':
        return [
          "+10 Números de whatsApp",
          "Agendamentos ilimitados",
          "Assistentes ilimitados",
          "Suporte 24/7 dedicado",
          "Integração com sistemas hospitalares",
          "Personalização avançada"
        ];
      default:
        return [];
    }
  };

  const getPlanButtonText = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'básico':
        return "Começar agora";
      case 'profissional':
        return "Escolher plano";
      case 'empresarial':
        return "Contato comercial";
      default:
        return "Escolher plano";
    }
  };

  const getPlanDescription = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'básico':
        return "Para profissionais individuais que buscam eficiência e baixo custo.";
      case 'profissional':
        return "Recomendado para clínicas que desejam crescer.";
      case 'empresarial':
        return "Desenvolvido para clínicas e hospitais de grande porte.";
      default:
        return "";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Planos & Pagamentos</h1>
          <p className="text-muted-foreground">
            Gerencie sua assinatura e histórico de pagamentos
          </p>
        </div>

        <Tabs defaultValue="planos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="planos">Planos Disponíveis</TabsTrigger>
            <TabsTrigger value="pagamentos">Gestão de Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="planos" className="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 space-y-8">
            {plansLoading ? (
              <div className="text-center py-8">Carregando planos...</div>
            ) : (
              <>
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8">
                  {plans.map((plan, index) => {
                    const features = getPlanFeatures(plan.nome);
                    const isEnterprise = plan.nome.toLowerCase() === 'empresarial';
                    const isProfessional = plan.nome.toLowerCase() === 'profissional';
                    
                    return (
                      <div 
                        key={plan.id} 
                        className={`text-card-foreground relative rounded-3xl shadow-lg border-2 flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                          isEnterprise 
                            ? 'bg-slate-900 border-slate-700 hover:bg-slate-800/80 hover:border-slate-600' 
                            : 'bg-card border-border hover:bg-white/80 hover:border-gray-200'
                        }`}
                      >
                        {isProfessional && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 text-sm font-medium rounded-full border-transparent">
                              Mais popular
                            </Badge>
                          </div>
                        )}
                        
                        <div className="flex flex-col space-y-1.5 p-6 pb-4 pt-8 px-8">
                          <div className={`tracking-tight text-2xl font-bold mb-2 ${isEnterprise ? 'text-white' : 'text-foreground'}`}>
                            {plan.nome}
                          </div>
                          <div className={`text-2xl font-bold mb-4 ${isEnterprise ? 'text-red-400' : 'text-foreground'}`}>
                            R$ {plan.preco.toFixed(0)}/mês
                          </div>
                          <hr className={`border-t-2 mb-4 ${isEnterprise ? 'border-slate-600' : 'border-border'}`} />
                          <div className={`text-sm leading-relaxed ${isEnterprise ? 'text-white' : 'text-foreground'}`}>
                            {getPlanDescription(plan.nome)}
                          </div>
                        </div>

                        <div className="p-6 pt-0 px-8 pb-6 flex-grow">
                          <ul className="space-y-3">
                            {features.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-3">
                                {getFeatureIcon(feature)}
                                <span className={`text-sm ${isEnterprise ? 'text-white' : 'text-foreground'}`}>
                                  {feature}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-6">
                            <p className={`text-sm leading-relaxed ${isEnterprise ? 'text-white' : 'text-foreground'}`}>
                              {isEnterprise ? 'Inicie agora e organize sua agenda com praticidade.' : 
                               isProfessional ? 'Adquira já e otimize sua operação.' : 
                               'Inicie agora e organize sua agenda com praticidade.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center p-6 pt-0 px-8 pb-8 mt-auto">
                          <Button 
                            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 text-base font-medium rounded-xl transition-colors duration-200 h-10 px-4"
                            onClick={() => handleSelectPlan(plan)}
                          >
                            {getPlanButtonText(plan.nome)}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-16 text-center">
                  <div className="flex justify-center items-center gap-8 opacity-60">
                    <div className="text-xs text-muted-foreground">🔒 Pagamento Seguro</div>
                    <div className="text-xs text-muted-foreground">✅ Cancele Quando Quiser</div>
                    <div className="text-xs text-muted-foreground">📞 Suporte Especializado</div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="pagamentos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Assinatura Atual */}
              <Card>
                <CardHeader>
                  <CardTitle>Assinatura Atual</CardTitle>
                </CardHeader>
                <CardContent>
                  {subscriptionLoading ? (
                    <div>Carregando...</div>
                  ) : subscription ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Plano:</span>
                        <span className="font-medium">{subscription.plano.nome}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor:</span>
                        <span className="font-medium">R$ {subscription.plano.preco}/mês</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className={subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {subscription.status === 'active' ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      {subscription.proxima_cobranca && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Próxima cobrança:</span>
                          <span className="font-medium">
                            {format(new Date(subscription.proxima_cobranca), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Nenhuma assinatura ativa</p>
                      <Button className="mt-2" onClick={() => setCheckoutOpen(true)}>
                        Assinar Plano
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resumo de Uso */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Uso</CardTitle>
                </CardHeader>
                 <CardContent>
                   {usageLoading ? (
                     <div>Carregando...</div>
                   ) : usage ? (
                     <div className="space-y-3">
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Assistentes:</span>
                         <span>{usage.assistentes.usado}/{usage.assistentes.limite}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">WhatsApp:</span>
                         <span>{usage.instancias.usado}/{usage.instancias.limite}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Conversas este mês:</span>
                         <span>{usage.conversas_mes.usado}/{usage.conversas_mes.limite}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-muted-foreground">Agendamentos:</span>
                         <span>{usage.agendamentos_mes.usado}/{usage.agendamentos_mes.limite}</span>
                       </div>
                     </div>
                   ) : (
                     <div className="text-center text-muted-foreground">
                       Erro ao carregar dados de uso
                     </div>
                   )}
                 </CardContent>
              </Card>
            </div>

            {/* Histórico de Pagamentos */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div>Carregando...</div>
                ) : payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{payment.descricao}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(payment.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">R$ {payment.valor.toFixed(2)}</p>
                          <Badge className={getStatusColor(payment.status)}>
                            {payment.status === 'paid' ? 'Pago' : 
                             payment.status === 'pending' ? 'Pendente' : 'Falhou'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <CheckoutModal 
          plan={selectedPlan}
          open={checkoutOpen}
          onOpenChange={setCheckoutOpen}
        />
      </div>
    </DashboardLayout>
  );
}