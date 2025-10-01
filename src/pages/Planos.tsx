import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Crown, Star, Shield, Users, Zap, Calendar, HeadphonesIcon, CreditCard, AlertTriangle, Sparkles } from 'lucide-react';
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-aplia-blue/10 text-aplia-blue px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Planos e Preços
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Escolha o plano ideal
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Automatize suas conversas, gerencie agendamentos e escale seu atendimento com inteligência artificial
            </p>
          </div>

          <Tabs defaultValue="plans" className="space-y-8">
            <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto h-12 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="plans" className="text-sm font-medium">Planos Disponíveis</TabsTrigger>
              <TabsTrigger value="management" className="text-sm font-medium">Gestão de Pagamentos</TabsTrigger>
            </TabsList>

            <TabsContent value="plans" className="space-y-10">
              {/* Trust elements */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 py-6">
                <div className="flex items-center gap-4 group cursor-default">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="font-semibold text-foreground">🔒 Pagamento 100% seguro</span>
                </div>
                <div className="flex items-center gap-4 group cursor-default">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                    <Zap className="h-6 w-6 text-yellow-600" />
                  </div>
                  <span className="font-semibold text-foreground">⚡ Ativação imediata</span>
                </div>
                <div className="flex items-center gap-4 group cursor-default">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-sky-100 rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                    <HeadphonesIcon className="h-6 w-6 text-aplia-blue" />
                  </div>
                  <span className="font-semibold text-foreground">💬 Suporte especializado</span>
                </div>
              </div>

              {/* Plans grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 max-w-7xl mx-auto px-4">{" "}
                {plans.map((plan) => {
                  const isPopular = plan.id === mostPopularPlan?.id;
                  const isCurrent = subscription?.plano_id === plan.id;
                  const isFree = plan.preco === 0;
                  
                  return (
                    <Card 
                      key={plan.id} 
                      className={`relative rounded-3xl transition-all duration-500 group border-2 ${
                        isPopular 
                          ? 'border-aplia-blue shadow-xl hover:shadow-2xl scale-[1.02] bg-gradient-to-br from-white via-aplia-blue/5 to-aplia-blue/10 dark:from-card dark:via-aplia-blue/5 dark:to-aplia-blue/10' 
                          : 'border-border/50 hover:border-aplia-blue/50 hover:shadow-xl hover:scale-[1.02] bg-card'
                      } ${isCurrent ? 'ring-2 ring-green-500 ring-offset-4 border-green-500/50' : ''} ${
                        isFree ? 'bg-gradient-to-br from-muted/30 to-muted/50' : ''
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                          <Badge className="bg-gradient-to-r from-aplia-blue to-blue-600 text-white px-5 py-2 shadow-lg font-semibold text-sm border-0">
                            <Crown className="h-4 w-4 mr-1.5" />
                            👑 Mais Popular
                          </Badge>
                        </div>
                      )}
                      
                      {isCurrent && (
                        <div className="absolute -top-3 right-6 z-10">
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 shadow-lg font-semibold text-sm border-0">
                            <Check className="h-4 w-4 mr-1.5" />
                            🌟 Ativo
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="pb-8 pt-10">
                        <div className="text-center space-y-4">
                          <CardTitle className="text-2xl md:text-3xl font-bold tracking-tight">{plan.nome}</CardTitle>
                          <CardDescription className="text-base text-muted-foreground leading-relaxed px-2">
                            {getPlanDescription(plan)}
                          </CardDescription>
                          
                          <div className="py-6">
                            <div className="flex items-baseline justify-center gap-1">
                              {plan.preco === 0 ? (
                                <span className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                  Grátis
                                </span>
                              ) : (
                                <>
                                  <span className="text-lg font-semibold text-muted-foreground">R$</span>
                                  <span className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                                    {plan.preco.toFixed(0)}
                                  </span>
                                  <span className="text-lg text-muted-foreground font-medium">/{plan.periodo}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-6 pb-10 px-8">
                        <div className="border-t border-border/50 pt-6">
                          <ul className="space-y-4">
                            {getPlanFeatures(plan).map((feature, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 shadow-sm">
                                  <Check className="h-3.5 w-3.5 text-green-600 font-bold" />
                                </div>
                                <span className="text-sm text-foreground/80 leading-relaxed font-medium">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="pt-6 space-y-4 border-t border-border/50">
                          {isCurrent ? (
                            <Button 
                              disabled 
                              className="w-full h-14 font-semibold text-base rounded-xl shadow-sm" 
                              variant="secondary"
                            >
                              <Check className="h-5 w-5 mr-2" />
                              {getButtonText(plan)}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleSelectPlan(plan.id)}
                              className={`w-full h-14 font-semibold text-base rounded-xl transition-all duration-300 ${
                                isPopular 
                                  ? 'bg-gradient-to-r from-aplia-blue to-blue-600 hover:from-aplia-blue/90 hover:to-blue-600/90 text-white shadow-lg hover:shadow-2xl hover:scale-[1.02]' 
                                  : 'hover:shadow-lg hover:scale-[1.02]'
                              }`}
                              variant={isPopular ? "default" : "outline"}
                            >
                              {getButtonText(plan)}
                            </Button>
                          )}
                          <p className="text-xs text-muted-foreground text-center font-medium pt-1">
                            {getFooterText(plan)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="management" className="space-y-8">
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
      </div>
    </DashboardLayout>
  );
}