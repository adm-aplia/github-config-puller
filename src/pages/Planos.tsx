
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Escolha seu Plano</h1>
        <p className="text-muted-foreground">
          Selecione o plano ideal para suas necessidades
        </p>
      </div>

      {hasActiveSubscription && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
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

      {/* Nota sobre ambiente Sandbox */}
      <Card className="mb-6 border-yellow-200 bg-yellow-50">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.id);
          
          return (
            <Card 
              key={plan.id} 
              className={`relative ${
                isCurrent 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-border hover:border-primary/50 transition-colors'
              }`}
            >
              {isCurrent && (
                <Badge className="absolute -top-2 left-4 bg-primary">
                  Plano Atual
                </Badge>
              )}
              
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.nome}
                  {plan.nome !== 'Gratuito' && (
                    <Crown className="h-5 w-5 text-primary" />
                  )}
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">
                    R$ {plan.preco}
                  </span>
                  <span className="text-muted-foreground">/{plan.periodo === 'monthly' ? 'mês' : 'ano'}</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{plan.max_assistentes} Assistente{plan.max_assistentes > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{plan.max_instancias_whatsapp} Número{plan.max_instancias_whatsapp > 1 ? 's' : ''} WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{plan.max_conversas_mes} Conversas/mês</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{plan.max_agendamentos_mes} Agendamentos/mês</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {isCurrent ? (
                    'Plano Atual'
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Selecionar Plano
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
