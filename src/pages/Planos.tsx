
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckoutModal } from '@/components/checkout/checkout-modal';
import { PlanChangeModal } from '@/components/plans/plan-change-modal';
import { usePlans } from '@/hooks/use-plans';
import { useSubscription } from '@/hooks/use-subscription';
import { Check, Crown, Zap, CreditCard } from 'lucide-react';

export default function Planos() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const { plans, loading: plansLoading } = usePlans();
  const { subscription, loading: subscriptionLoading, refetch } = useSubscription();

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setCheckoutOpen(true);
  };

  const handleCheckoutSuccess = () => {
    refetch();
    setCheckoutOpen(false);
  };

  const handleChangePlanSuccess = () => {
    refetch();
    setChangeModalOpen(false);
  };

  if (plansLoading || subscriptionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Carregando planos...</p>
        </div>
      </div>
    );
  }

  const isCurrentPlan = (planId: string) => subscription?.plano_id === planId;
  const hasActiveSubscription = subscription?.status === 'active';

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Escolha seu Plano</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Selecione o plano ideal para suas necessidades e comece a transformar seu atendimento
        </p>
      </div>

      {hasActiveSubscription && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
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
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Próxima cobrança: {subscription.proxima_cobranca 
                  ? new Date(subscription.proxima_cobranca).toLocaleDateString('pt-BR')
                  : 'N/A'
                }
              </div>
              <Button 
                variant="outline" 
                onClick={() => setChangeModalOpen(true)}
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Alterar Plano
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {plans.map((plan, index) => {
          const isCurrent = isCurrentPlan(plan.id);
          const isPopular = index === 1; // Middle card is popular
          const isEnterprise = plan.nome.toLowerCase().includes('empresarial') || plan.nome.toLowerCase().includes('enterprise');
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${
                isEnterprise 
                  ? 'bg-slate-900 text-white border-slate-700' 
                  : isPopular 
                    ? 'border-primary ring-2 ring-primary/20 scale-105' 
                    : 'border-border'
              } transition-all duration-200 hover:shadow-lg`}
            >
              {isPopular && !isCurrent && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-4 py-1">
                    Mais popular
                  </Badge>
                </div>
              )}
              
              {isCurrent && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-600 text-white px-4 py-1">
                    Plano Atual
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className={`text-2xl font-bold ${isEnterprise ? 'text-white' : ''}`}>
                  {plan.nome}
                </CardTitle>
                <div className="mt-4">
                  <span className={`text-5xl font-bold ${isEnterprise ? 'text-white' : 'text-foreground'}`}>
                    R${plan.preco}
                  </span>
                  <span className={`text-lg ${isEnterprise ? 'text-slate-300' : 'text-muted-foreground'}`}>
                    /{plan.periodo === 'monthly' ? 'mês' : 'ano'}
                  </span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 pb-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Check className={`h-5 w-5 ${isEnterprise ? 'text-green-400' : 'text-green-500'}`} />
                    <span className={`${isEnterprise ? 'text-slate-200' : 'text-foreground'}`}>
                      {plan.max_assistentes} assistente{plan.max_assistentes > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className={`h-5 w-5 ${isEnterprise ? 'text-green-400' : 'text-green-500'}`} />
                    <span className={`${isEnterprise ? 'text-slate-200' : 'text-foreground'}`}>
                      {plan.max_instancias_whatsapp} número{plan.max_instancias_whatsapp > 1 ? 's' : ''} WhatsApp
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className={`h-5 w-5 ${isEnterprise ? 'text-green-400' : 'text-green-500'}`} />
                    <span className={`${isEnterprise ? 'text-slate-200' : 'text-foreground'}`}>
                      {plan.max_conversas_mes.toLocaleString()} conversas por mês
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className={`h-5 w-5 ${isEnterprise ? 'text-green-400' : 'text-green-500'}`} />
                    <span className={`${isEnterprise ? 'text-slate-200' : 'text-foreground'}`}>
                      {plan.max_agendamentos_mes} agendamentos por mês
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className={`h-5 w-5 ${isEnterprise ? 'text-green-400' : 'text-green-500'}`} />
                    <span className={`${isEnterprise ? 'text-slate-200' : 'text-foreground'}`}>
                      Suporte técnico
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className={`h-5 w-5 ${isEnterprise ? 'text-green-400' : 'text-green-500'}`} />
                    <span className={`${isEnterprise ? 'text-slate-200' : 'text-foreground'}`}>
                      Integrações avançadas
                    </span>
                  </div>
                </div>
                
                <div className="pt-6">
                  <Button 
                    className={`w-full py-3 text-base font-semibold ${
                      isEnterprise 
                        ? 'bg-white text-slate-900 hover:bg-slate-100' 
                        : isCurrent 
                          ? 'bg-green-600 text-white hover:bg-green-700' 
                          : isPopular 
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                    disabled={isCurrent}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isCurrent ? (
                      'Plano Atual'
                    ) : isEnterprise ? (
                      'Contato comercial'
                    ) : plan.nome.toLowerCase().includes('gratuito') ? (
                      'Começar agora'
                    ) : (
                      'Escolher plano'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Nota sobre ambiente Sandbox */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center mt-0.5">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <div className="text-sm">
              <p className="font-medium text-yellow-800 mb-1">Ambiente de Testes (Sandbox)</p>
              <p className="text-yellow-700">
                Estamos em ambiente de testes. Ao assinar um plano, você será cobrado imediatamente. 
                Para simular o pagamento no Asaas Sandbox, acesse o painel do Asaas e aprove manualmente 
                a cobrança criada. O status pode aparecer como "Aguardando pagamento" até a simulação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        plan={selectedPlan}
        onSuccess={handleCheckoutSuccess}
      />

      <PlanChangeModal
        open={changeModalOpen}
        onOpenChange={setChangeModalOpen}
        plans={plans}
        currentSubscription={subscription}
        onSuccess={handleChangePlanSuccess}
      />
    </div>
  );
}
