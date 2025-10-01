import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Users, CreditCard, AlertTriangle, MessageCircle, Calendar as CalendarIcon, Bot, ChartColumn, Building2, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PlanChangeModal } from '@/components/plans/plan-change-modal';
import { PlanCancelModal } from '@/components/plans/plan-cancel-modal';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PaymentHistory } from '@/components/payments/payment-history';
import { usePlans } from '@/hooks/use-plans';
import { useSubscription } from '@/hooks/use-subscription';

export default function Planos() {
  const navigate = useNavigate();
  const { plans, loading: plansLoading } = usePlans();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const loading = plansLoading || subscriptionLoading;

  const handleSelectPlan = (planId: string) => {
    navigate('/dashboard/checkout', { state: { planId } });
  };

  const handlePlanChangeSuccess = () => {
    setChangeModalOpen(false);
    window.location.reload();
  };

  const handlePlanCancelSuccess = () => {
    setCancelModalOpen(false);
    window.location.reload();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aplia-blue mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando planos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const getPlanFeatures = (plan: any) => {
    const baseFeatures = [
      `${plan.max_assistentes || 0} assistentes IA`,
      `${plan.max_instancias_whatsapp || 0} instâncias WhatsApp`,
      `${plan.max_conversas_mes?.toLocaleString() || 0} conversas/mês`,
      `${plan.max_agendamentos_mes?.toLocaleString() || 0} agendamentos/mês`,
    ];
    
    const extraFeatures = plan.recursos ? Object.entries(plan.recursos)
      .filter(([_, value]) => value === true)
      .map(([key, _]) => {
        switch (key) {
          case 'suporte_prioritario': return 'Suporte prioritário 24/7';
          case 'integracoes_avancadas': return 'Integrações avançadas';
          case 'analytics_detalhados': return 'Analytics detalhados';
          case 'backup_automatico': return 'Backup automático';
          default: return key.replace(/_/g, ' ');
        }
      }) : [];
    
    return [...baseFeatures, ...extraFeatures];
  };

  const getPlanDescription = (plan: any) => {
    if (plan.preco === 0) return "Ideal para começar e testar a plataforma";
    if (plan.preco < 100) return "Perfeito para pequenas empresas e profissionais";
    if (plan.preco < 300) return "Ideal para empresas em crescimento";
    return "Para empresas com alto volume de atendimento";
  };

  const getButtonText = (plan: any) => {
    if (!subscription) return "Começar agora";
    if (subscription.plano_id === plan.id) return "Plano atual";
    return plan.preco > (plans.find(p => p.id === subscription.plano_id)?.preco || 0) 
      ? "Fazer upgrade" 
      : "Fazer downgrade";
  };

  const getFooterText = (plan: any) => {
    if (plan.preco === 0) return "Sempre gratuito";
    return "Renovação automática • Cancele quando quiser";
  };

  const availablePlans = plans.filter(plan => !subscription || plan.id !== subscription.plano_id);
  const currentPlan = subscription ? plans.find(p => p.id === subscription.plano_id) : null;
  const mostPopularPlan = plans.find(plan => plan.preco > 0 && plan.preco < 200);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Planos & Pagamentos</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Gerencie sua assinatura e histórico de pagamentos
          </p>
        </div>

        <Tabs defaultValue="planos" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="planos">Planos Disponíveis</TabsTrigger>
            <TabsTrigger value="gestao">Gestão de Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="planos" className="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 space-y-8">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8">
              {plans.map((plan) => {
                const isPopular = plan.id === mostPopularPlan?.id;
                const isCurrent = subscription?.plano_id === plan.id;
                const isEnterprise = plan.preco >= 300;
                
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
                        R$ {plan.preco}/{plan.periodo}
                      </div>
                      <hr className={`border-t-2 mb-4 ${isEnterprise ? 'border-slate-600' : 'border-border'}`} />
                      <div className={`text-sm leading-relaxed ${isEnterprise ? 'text-white' : 'text-foreground'}`}>
                        {getPlanDescription(plan)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 pt-0 px-8 pb-6 flex-grow">
                      <ul className="space-y-3">
                        {getPlanFeatures(plan).map((feature, index) => (
                          <li key={index} className="flex items-center gap-3">
                            <Check className="h-4 w-4 text-red-500" />
                            <span className={`text-sm ${isEnterprise ? 'text-white' : 'text-foreground'}`}>
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6">
                        <p className={`text-sm leading-relaxed ${isEnterprise ? 'text-white' : 'text-foreground'}`}>
                          {getFooterText(plan)}
                        </p>
                      </div>
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
                          {getButtonText(plan)}
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
                <div className="text-xs text-muted-foreground">🔒 Pagamento Seguro</div>
                <div className="text-xs text-muted-foreground">✅ Cancele Quando Quiser</div>
                <div className="text-xs text-muted-foreground">📞 Suporte Especializado</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gestao" className="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 space-y-8">
              {subscription ? (
                <div className="space-y-8">
                  {/* Current subscription card */}
                  <Card className="border-muted shadow-card">
                    <CardHeader className="bg-gradient-to-r from-aplia-blue/5 to-transparent">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="w-10 h-10 bg-aplia-blue/10 rounded-full flex items-center justify-center">
                          <Star className="h-5 w-5 text-aplia-blue" />
                        </div>
                        Assinatura Atual
                      </CardTitle>
                      <CardDescription className="text-base">
                        Gerencie sua assinatura e visualize detalhes do plano
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {currentPlan && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <h3 className="font-semibold text-xl text-foreground">{currentPlan.nome}</h3>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-bold text-aplia-blue">
                                R$ {currentPlan.preco.toFixed(2).replace('.', ',')}
                              </span>
                              <span className="text-muted-foreground">/{currentPlan.periodo}</span>
                            </div>
                            <p className="text-muted-foreground">
                              Próximo vencimento: {subscription.proxima_cobranca ? 
                                new Date(subscription.proxima_cobranca).toLocaleDateString('pt-BR') : 
                                'Não disponível'}
                            </p>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row gap-3 lg:justify-end">
                            <Button
                              onClick={() => setChangeModalOpen(true)}
                              variant="outline"
                              className="flex-1 lg:flex-none lg:min-w-[140px] h-11"
                              disabled={availablePlans.length === 0}
                            >
                              Alterar Plano
                            </Button>
                            <Button
                              onClick={() => setCancelModalOpen(true)}
                              variant="outline"
                              className="flex-1 lg:flex-none lg:min-w-[120px] h-11 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Payment history */}
                  <PaymentHistory />
                </div>
              ) : (
                <Card className="border-muted shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      </div>
                      Nenhuma Assinatura Ativa
                    </CardTitle>
                    <CardDescription className="text-base">
                      Você ainda não possui uma assinatura ativa
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Escolha um plano para começar a usar todos os recursos da plataforma
                      </p>
                      <Button 
                        onClick={() => {
                          const plansTab = document.querySelector('[value="plans"]') as HTMLButtonElement;
                          plansTab?.click();
                        }}
                        className="bg-aplia-blue hover:bg-aplia-blue/90 text-white px-8 h-12"
                      >
                        Ver Planos Disponíveis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
          <PlanChangeModal
            open={changeModalOpen}
            onOpenChange={setChangeModalOpen}
            plans={availablePlans}
            currentSubscription={subscription}
            onSuccess={handlePlanChangeSuccess}
          />

          <PlanCancelModal
            open={cancelModalOpen}
            onOpenChange={setCancelModalOpen}
            currentSubscription={subscription}
            onSuccess={handlePlanCancelSuccess}
        />
      </div>
    </DashboardLayout>
  );
}