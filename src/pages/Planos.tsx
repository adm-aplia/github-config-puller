import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Calendar as CalendarIcon, Bot, Users, ChartColumn, Building2, Settings, Mail, Shield, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { usePlans } from '@/hooks/use-plans';
import { useSubscription } from '@/hooks/use-subscription';
import { PlanChangeModal } from '@/components/plans/plan-change-modal';
import { PlanCancelModal } from '@/components/plans/plan-cancel-modal';
import { PaymentHistory } from '@/components/payments/payment-history';

export default function Planos() {
  const navigate = useNavigate();
  const { plans, loading: plansLoading, refetch: refetchPlans } = usePlans();
  const { subscription, loading: subscriptionLoading, refetch: refetchSubscription } = useSubscription();
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const loading = plansLoading || subscriptionLoading;

  const handleSelectPlan = (planId: string) => {
    navigate(`/dashboard/checkout/${planId}`);
  };

  const handleSuccess = () => {
    refetchPlans();
    refetchSubscription();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando planos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getPlanFeatures = (planName: string) => {
    const featuresMap: { [key: string]: { text: string; icon: any }[] } = {
      'Básico': [
        { text: '1 Número de WhatsApp', icon: MessageCircle },
        { text: '1 Assistente Personalizado', icon: Bot },
        { text: 'Suporte por e-mail', icon: Mail },
        { text: 'Agendamentos ilimitados', icon: CalendarIcon },
        { text: 'Integração Google Agenda', icon: CalendarIcon },
        { text: 'Estatísticas Detalhadas', icon: ChartColumn },
      ],
      'Profissional': [
        { text: '3 Números de WhatsApp', icon: MessageCircle },
        { text: '3 Assistentes Personalizados', icon: Bot },
        { text: 'Suporte prioritário', icon: Users },
        { text: 'Agendamentos ilimitados', icon: CalendarIcon },
        { text: 'Lembretes de Consulta Automáticos', icon: Bell },
        { text: 'Estatísticas Detalhadas', icon: ChartColumn },
        { text: 'Integração Google Agenda', icon: CalendarIcon },
        { text: 'Suporte por e-mail', icon: Mail },
      ],
      'Empresarial': [
        { text: '10 Números de WhatsApp', icon: MessageCircle },
        { text: '10 Assistentes Personalizados', icon: Bot },
        { text: 'Suporte 24/7 dedicado', icon: Users },
        { text: 'Agendamentos ilimitados', icon: CalendarIcon },
        { text: 'Lembretes de Consulta Automáticos', icon: Bell },
        { text: 'Estatísticas Detalhadas', icon: ChartColumn },
        { text: 'Integração Google Agenda', icon: CalendarIcon },
        { text: 'Suporte por e-mail', icon: Mail },
      ],
    };
    
    return featuresMap[planName] || [];
  };

  const getPlanDescription = (planName: string) => {
    const descriptionsMap: { [key: string]: string } = {
      'Básico': 'Ideal para profissionais e pequenos consultórios que estão começando',
      'Profissional': 'Perfeito para clínicas em crescimento que precisam de mais recursos',
      'Empresarial': 'Para grandes clínicas e hospitais com alto volume de atendimentos',
    };
    
    return descriptionsMap[planName] || 'Escolha o plano ideal para você';
  };

  const getButtonText = (planName: string, isCurrent: boolean) => {
    if (isCurrent) return "Plano atual";
    
    const buttonTextMap: { [key: string]: string } = {
      'Básico': 'Começar agora',
      'Profissional': 'Escolher plano',
      'Empresarial': 'Contato comercial',
    };
    
    return buttonTextMap[planName] || 'Escolher plano';
  };

  const mostPopularPlan = plans.find(plan => plan.nome === 'Profissional');
  const hasActiveSubscription = subscription && subscription.status !== 'free';

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="planos" className="w-full">
          {hasActiveSubscription && (
            <TabsList className="grid w-full max-w-md mx-auto mb-8" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <TabsTrigger value="planos">Planos Disponíveis</TabsTrigger>
              <TabsTrigger value="gestao">Gestão de Pagamentos</TabsTrigger>
            </TabsList>
          )}

          {/* Tab: Planos Disponíveis */}
          <TabsContent value="planos" className="space-y-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Nossas Soluções</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Escolha o plano ideal para o seu negócio
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8">
              {plans.map((plan) => {
                const isPopular = plan.id === mostPopularPlan?.id;
                const isCurrent = subscription?.plano_id === plan.id;
                const isEnterprise = plan.nome === 'Empresarial';
                const planFeatures = getPlanFeatures(plan.nome);
                
                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-3xl shadow-lg border-2 flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                      isEnterprise
                        ? 'bg-slate-900 border-slate-700 hover:bg-slate-800/80 hover:border-slate-600'
                        : 'bg-card border-border hover:bg-white/80 hover:border-gray-200'
                    } text-card-foreground`}
                  >
                    {/* Badge */}
                    {isPopular && !isCurrent && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 text-sm font-medium rounded-full border-transparent">
                          Mais popular
                        </Badge>
                      </div>
                    )}
                    
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 text-sm font-medium rounded-full border-transparent">
                          Plano Atual
                        </Badge>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex flex-col space-y-1.5 p-6 pb-4 pt-8 px-8">
                      <div className={`tracking-tight text-2xl font-bold mb-2 ${isEnterprise ? 'text-white' : 'text-foreground'}`}>
                      {plan.nome}
                      </div>
                      <div className={`text-2xl font-bold mb-4 ${isEnterprise ? 'text-red-400' : 'text-foreground'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.preco)}/mês
                      </div>
                      <hr className={`border-t-2 mb-4 ${isEnterprise ? 'border-slate-600' : 'border-border'}`} />
                      <div className={`text-sm leading-relaxed ${isEnterprise ? 'text-white' : 'text-foreground'}`}>
                        {getPlanDescription(plan.nome)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 pt-0 px-8 pb-6 flex-grow">
                      <ul className="space-y-3">
                        {planFeatures.map((feature, index) => {
                          const FeatureIcon = feature.icon;
                          return (
                            <li key={index} className="flex items-center gap-3">
                              <FeatureIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <span className={`text-sm ${isEnterprise ? 'text-white' : 'text-foreground'}`}>
                                {feature.text}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center p-6 pt-0 px-8 pb-8 mt-auto">
                      {isCurrent ? (
                        <Button
                          disabled
                          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 text-base font-medium rounded-xl transition-colors duration-200 h-10 px-4"
                        >
                          Plano Atual
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSelectPlan(plan.id)}
                          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 text-base font-medium rounded-xl transition-colors duration-200 h-10 px-4"
                        >
                          {getButtonText(plan.nome, isCurrent)}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trust elements */}
            <div className="mt-16 text-center">
              <div className="flex justify-center items-center gap-8 opacity-60">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Pagamento Seguro via Asaas
                </div>
                <div className="text-xs text-muted-foreground">✅ Cancele Quando Quiser</div>
                <div className="text-xs text-muted-foreground">📞 Suporte Especializado</div>
              </div>
            </div>
          </TabsContent>

          {/* Tab: Gestão de Pagamentos */}
          {hasActiveSubscription && (
            <TabsContent value="gestao" className="space-y-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold mb-4">Gestão de Pagamentos</h1>
                <p className="text-muted-foreground text-lg">
                  Gerencie sua assinatura e histórico de pagamentos
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
                {/* Current Subscription Card */}
                <Card className="border-muted shadow-card flex flex-col">
                  <CardHeader className="bg-gradient-to-r from-muted/30 to-transparent">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Settings className="h-5 w-5 text-primary" />
                      </div>
                      Assinatura Atual
                    </CardTitle>
                    <CardDescription className="text-base">
                      Informações do seu plano ativo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6 flex-grow">
                    <div className="space-y-6">
                      <div className="border border-muted rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Plano</p>
                        <p className="font-semibold text-lg text-foreground">{subscription?.plano.nome}</p>
                      </div>
                      <div className="border border-muted rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Valor Mensal</p>
                        <p className="font-semibold text-lg text-foreground">
                          {subscription?.plano.preco ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subscription.plano.preco) : 'N/A'}
                        </p>
                      </div>
                      <div className="border border-muted rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-2">Status</p>
                        <Badge 
                          variant={subscription?.status === 'active' ? 'default' : 'secondary'} 
                          className={subscription?.status === 'active' ? 'text-sm bg-green-100 text-green-700 border-green-200 hover:bg-green-100/80' : 'text-sm'}
                        >
                          {subscription?.status === 'active' ? 'Ativo' : subscription?.status === 'cancelled' ? 'Cancelado' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="border border-muted rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-1">Próxima Cobrança</p>
                        <p className="font-semibold text-lg text-foreground">
                          {subscription?.proxima_cobranca 
                            ? new Date(subscription.proxima_cobranca).toLocaleDateString('pt-BR')
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-3 mt-auto">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setChangeModalOpen(true)}
                      disabled={subscription?.status === 'cancelled'}
                    >
                      Alterar Plano
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setCancelModalOpen(true)}
                      disabled={subscription?.status === 'cancelled'}
                    >
                      Cancelar Assinatura
                    </Button>
                  </CardFooter>
                </Card>

                {/* Payment History */}
                <PaymentHistory />
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Modals */}
        <PlanChangeModal
          open={changeModalOpen}
          onOpenChange={setChangeModalOpen}
          plans={plans}
          currentSubscription={subscription}
          onSuccess={handleSuccess}
        />
        <PlanCancelModal
          open={cancelModalOpen}
          onOpenChange={setCancelModalOpen}
          currentSubscription={subscription}
          onSuccess={handleSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
