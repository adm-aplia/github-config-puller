import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckoutModal } from "@/components/checkout/checkout-modal";
import { usePlans } from "@/hooks/use-plans";
import { useSubscription } from "@/hooks/use-subscription";
import { usePayments } from "@/hooks/use-payments";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, CreditCard, Smartphone, Users, HeadphonesIcon, Database, Building } from "lucide-react";

export default function PlanosPage() {
  const { plans, loading: plansLoading } = usePlans();
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const { payments, loading: paymentsLoading } = usePayments();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setCheckoutOpen(true);
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
    if (feature.includes('whatsapp') || feature.includes('WhatsApp')) {
      return <Smartphone className="h-4 w-4 text-green-600" />;
    }
    if (feature.includes('agendamento')) {
      return <CalendarDays className="h-4 w-4 text-blue-600" />;
    }
    if (feature.includes('assistente')) {
      return <Users className="h-4 w-4 text-purple-600" />;
    }
    if (feature.includes('suporte') || feature.includes('Suporte')) {
      return <HeadphonesIcon className="h-4 w-4 text-orange-600" />;
    }
    return <CreditCard className="h-4 w-4 text-gray-600" />;
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

          <TabsContent value="planos" className="space-y-6">
            {plansLoading ? (
              <div className="text-center py-8">Carregando planos...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan, index) => (
                  <Card 
                    key={plan.id} 
                    className={`relative ${index === 1 ? 'border-primary shadow-lg scale-105' : ''}`}
                  >
                    {index === 1 && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">
                          Mais Popular
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="text-center pb-4">
                      <div className="flex justify-center mb-2">
                        {getPlanIcon(plan.nome)}
                      </div>
                      <CardTitle className="text-xl">{plan.nome}</CardTitle>
                      <div className="text-3xl font-bold">
                        R$ {plan.preco.toFixed(0)}
                        <span className="text-sm font-normal text-muted-foreground">/mês</span>
                      </div>
                      <CardDescription>{plan.descricao}</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        {plan.recursos.features?.map((feature: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            {getFeatureIcon(feature)}
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button 
                        className="w-full mt-6" 
                        variant={index === 1 ? "default" : "outline"}
                        onClick={() => handleSelectPlan(plan)}
                      >
                        {index === 2 ? 'Contato Comercial' : 'Escolher Plano'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assistentes:</span>
                      <span>1/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">WhatsApp:</span>
                      <span>1/3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Conversas este mês:</span>
                      <span>45/1000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Agendamentos:</span>
                      <span>12/1000</span>
                    </div>
                  </div>
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