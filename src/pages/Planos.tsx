import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Calendar as CalendarIcon, Bot, Users, ChartColumn, Building2, Settings, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { usePlans } from '@/hooks/use-plans';
import { useSubscription } from '@/hooks/use-subscription';

export default function Planos() {
  const navigate = useNavigate();
  const { plans, loading: plansLoading } = usePlans();
  const { subscription, loading: subscriptionLoading } = useSubscription();

  const loading = plansLoading || subscriptionLoading;

  const handleSelectPlan = (planId: string) => {
    navigate('/dashboard/checkout', { state: { planId } });
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

  const getPlanFeatures = (planName: string) => {
    const featuresMap: { [key: string]: { text: string; icon: any }[] } = {
      'Básico': [
        { text: '1 Número de whatsapp', icon: MessageCircle },
        { text: 'Até 300 agendamentos/mês', icon: CalendarIcon },
        { text: '1 Assistente personalizado', icon: Bot },
        { text: 'Suporte por e-mail', icon: Mail },
      ],
      'Profissional': [
        { text: '3 Números de WhatsApp', icon: MessageCircle },
        { text: 'Até 1.000 agendamentos/mês', icon: CalendarIcon },
        { text: '3 assistentes personalizados', icon: Bot },
        { text: 'Suporte prioritário', icon: Users },
        { text: 'Relatórios Avançados', icon: ChartColumn },
      ],
      'Empresarial': [
        { text: '+10 Números de WhatsApp', icon: MessageCircle },
        { text: 'Agendamentos ilimitados', icon: CalendarIcon },
        { text: 'Assistentes ilimitados', icon: Bot },
        { text: 'Suporte 24/7 dedicado', icon: Users },
        { text: 'Integração com sistemas hospitalares', icon: Building2 },
        { text: 'Personalização avançada', icon: Settings },
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

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
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
                    R$ {plan.preco}/{plan.periodo}
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
            <div className="text-xs text-muted-foreground">🔒 Pagamento Seguro</div>
            <div className="text-xs text-muted-foreground">✅ Cancele Quando Quiser</div>
            <div className="text-xs text-muted-foreground">📞 Suporte Especializado</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}