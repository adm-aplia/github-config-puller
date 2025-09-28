
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlanChangeModal } from '@/components/plans/plan-change-modal';
import { PlanCancelModal } from '@/components/plans/plan-cancel-modal';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { usePlans } from '@/hooks/use-plans';
import { useSubscription } from '@/hooks/use-subscription';
import { formatLimit } from '@/lib/limits';
import { 
  MessageCircle, 
  Calendar, 
  Bot, 
  Users, 
  ChartColumn, 
  Building2, 
  Settings, 
  CreditCard,
  Crown,
  Check,
  XCircle
} from 'lucide-react';
import { PaymentHistory } from '@/components/payments/payment-history';

export default function Planos() {
  const navigate = useNavigate();
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const { plans, loading: plansLoading } = usePlans();
  const { subscription, loading: subscriptionLoading, refetch } = useSubscription();

  const handleSelectPlan = (plan: any) => {
    navigate(`/dashboard/checkout/${plan.id}`);
  };

  const handleChangePlanSuccess = () => {
    refetch();
    setChangeModalOpen(false);
  };

  const handleCancelSuccess = () => {
    refetch();
    setCancelModalOpen(false);
  };

  if (plansLoading || subscriptionLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Carregando planos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isCurrentPlan = (planId: string) => subscription?.plano_id === planId;
  const hasActiveSubscription = subscription?.status === 'active';

  const getPlanFeatures = (plan: any, isEnterprise: boolean) => {
    if (isEnterprise) {
      return [
        { icon: MessageCircle, text: "+10 Números de WhatsApp" },
        { icon: CreditCard, text: "Agendamentos ilimitados" },
        { icon: Bot, text: "Assistentes ilimitados" },
        { icon: Users, text: "Suporte 24/7 dedicado" },
        { icon: Building2, text: "Integração com sistemas hospitalares" },
        { icon: Settings, text: "Personalização avançada" }
      ];
    } else if (plan.nome.toLowerCase().includes('profissional')) {
      return [
        { icon: MessageCircle, text: `${plan.max_instancias_whatsapp} Números de WhatsApp` },
        { icon: Calendar, text: `Até ${formatLimit(plan.max_agendamentos_mes)} agendamentos/mês` },
        { icon: Bot, text: `${formatLimit(plan.max_assistentes)} assistente${plan.max_assistentes > 1 ? 's' : ''} personalizado${plan.max_assistentes > 1 ? 's' : ''}` },
        { icon: Users, text: "Suporte prioritário" },
        { icon: ChartColumn, text: "Relatórios Avançados" }
      ];
    } else {
      // Básico
      return [
        { icon: MessageCircle, text: `${plan.max_instancias_whatsapp} Número de WhatsApp` },
        { icon: Calendar, text: `Até ${formatLimit(plan.max_agendamentos_mes)} agendamentos/mês` },
        { icon: Bot, text: `${formatLimit(plan.max_assistentes)} Assistente personalizado` },
        { icon: Users, text: "Suporte por e-mail" }
      ];
    }
  };

  const getPlanDescription = (plan: any, isEnterprise: boolean) => {
    if (isEnterprise) {
      return "Desenvolvido para clínicas e hospitais de grande porte.";
    } else if (plan.nome.toLowerCase().includes('profissional')) {
      return "Recomendado para clínicas que desejam crescer.";
    } else {
      return "Para profissionais individuais que buscam eficiência e baixo custo.";
    }
  };

  const getPlanButtonText = (plan: any, isEnterprise: boolean, isCurrent: boolean) => {
    if (isCurrent) return "Plano Atual";
    if (isEnterprise) return "Contato comercial";
    if (plan.nome.toLowerCase().includes('profissional')) return "Escolher plano";
    return "Começar agora";
  };

  const getPlanFooterText = (plan: any, isEnterprise: boolean) => {
    if (isEnterprise) {
      return "Inicie agora e organize sua agenda com praticidade.";
    } else if (plan.nome.toLowerCase().includes('profissional')) {
      return "Adquira já e otimize sua operação.";
    } else {
      return "Inicie agora e organize sua agenda com praticidade.";
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold mb-3 md:mb-4">Planos & Pagamentos</h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Gerencie sua assinatura e histórico de pagamentos
          </p>
        </div>

        <Tabs defaultValue="planos" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="planos">Planos Disponíveis</TabsTrigger>
            <TabsTrigger value="gestao">Gestão de Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="planos" className="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto mt-6 md:mt-8">
              {plans.map((plan, index) => {
                const isCurrent = isCurrentPlan(plan.id);
                const isPopular = index === 1; // Middle card is popular
                const isEnterprise = plan.nome.toLowerCase().includes('empresarial') || plan.nome.toLowerCase().includes('enterprise');
                const features = getPlanFeatures(plan, isEnterprise);
                
                return (
                  <div 
                    key={plan.id} 
                    className={`relative rounded-3xl shadow-lg border-2 flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                      isEnterprise 
                        ? 'bg-slate-900 border-slate-700 hover:bg-slate-800/80 hover:border-slate-600' 
                        : 'bg-card border-border hover:bg-white/80 hover:border-gray-200'
                    } text-card-foreground`}
                  >
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

                    <div className="flex flex-col space-y-1.5 p-4 md:p-6 pb-3 md:pb-4 pt-6 md:pt-8 px-4 md:px-8">
                      <div className={`tracking-tight text-xl md:text-2xl font-bold mb-2 ${isEnterprise ? 'text-white' : 'text-foreground'}`}>
                        {plan.nome}
                      </div>
                      <div className={`text-xl md:text-2xl font-bold mb-3 md:mb-4 ${isEnterprise ? 'text-red-400' : 'text-foreground'}`}>
                        R$ {plan.preco}/{plan.periodo === 'monthly' ? 'mês' : 'ano'}
                      </div>
                      <hr className={`border-t-2 mb-4 ${isEnterprise ? 'border-slate-600' : 'border-border'}`} />
                      <div className={`text-sm leading-relaxed ${isEnterprise ? 'text-white' : 'text-foreground'}`}>
                        {getPlanDescription(plan, isEnterprise)}
                      </div>
                    </div>

                    <div className="p-4 md:p-6 pt-0 px-4 md:px-8 pb-4 md:pb-6 flex-grow">
                      <ul className="space-y-3">
                        {features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-3">
                            <feature.icon className="h-4 w-4 text-red-500" />
                            <span className={`text-sm ${isEnterprise ? 'text-white' : 'text-foreground'}`}>
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6">
                        <p className={`text-sm leading-relaxed ${isEnterprise ? 'text-white' : 'text-foreground'}`}>
                          {getPlanFooterText(plan, isEnterprise)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center p-4 md:p-6 pt-0 px-4 md:px-8 pb-6 md:pb-8 mt-auto">
                      <Button 
                        className="w-full bg-red-500 hover:bg-red-600 text-white py-3 text-base font-medium rounded-xl transition-colors duration-200 h-10 px-4"
                        disabled={isCurrent}
                        onClick={() => handleSelectPlan(plan)}
                      >
                        {getPlanButtonText(plan, isEnterprise, isCurrent)}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 md:mt-16 text-center">
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 opacity-60">
                <div className="text-xs text-muted-foreground">🔒 Pagamento Seguro</div>
                <div className="text-xs text-muted-foreground">✅ Cancele Quando Quiser</div>
                <div className="text-xs text-muted-foreground">📞 Suporte Especializado</div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gestao" className="mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 space-y-8">
            {hasActiveSubscription ? (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    Plano Atual
                  </CardTitle>
                  <CardDescription>
                    Você está no plano <strong>{subscription.plano.nome}</strong> por R$ {subscription.plano.preco}/mês
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      Próxima cobrança: {subscription.proxima_cobranca 
                        ? new Date(subscription.proxima_cobranca).toLocaleDateString('pt-BR')
                        : 'N/A'
                      }
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setChangeModalOpen(true)}
                        className="flex items-center justify-center gap-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        Alterar Plano
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setCancelModalOpen(true)}
                        className="flex items-center justify-center gap-2 text-destructive hover:text-destructive"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Nenhuma assinatura ativa</h3>
                <p className="text-muted-foreground mb-4">
                  Escolha um plano na aba "Planos Disponíveis" para começar
                </p>
              </div>
            )}

            <PaymentHistory />
          </TabsContent>
        </Tabs>

        <PlanChangeModal
          open={changeModalOpen}
          onOpenChange={setChangeModalOpen}
          plans={plans}
          currentSubscription={subscription}
          onSuccess={handleChangePlanSuccess}
        />

        <PlanCancelModal
          open={cancelModalOpen}
          onOpenChange={setCancelModalOpen}
          currentSubscription={subscription}
          onSuccess={handleCancelSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
