
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap } from 'lucide-react';
import { Plan } from '@/hooks/use-plans';
import { Subscription } from '@/hooks/use-subscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatLimit } from '@/lib/limits';

interface PlanChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: Plan[];
  currentSubscription: Subscription | null;
  onSuccess: () => void;
}

export function PlanChangeModal({ 
  open, 
  onOpenChange, 
  plans, 
  currentSubscription, 
  onSuccess 
}: PlanChangeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const currentPlanId = currentSubscription?.plano_id;
  const availablePlans = plans.filter(plan => plan.id !== currentPlanId);

  const handlePlanChange = async () => {
    if (!selectedPlan) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('change-subscription', {
        body: { newPlanId: selectedPlan.id }
      });

      if (error) throw error;

      toast({
        title: 'Plano alterado com sucesso!',
        description: `Seu plano foi alterado para ${selectedPlan.nome}.`,
      });

      onSuccess();
      onOpenChange(false);
      setSelectedPlan(null);
    } catch (error: any) {
      console.error('Error changing plan:', error);
      toast({
        title: 'Erro ao alterar plano',
        description: error.message || 'Não foi possível alterar o plano.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProration = (newPlan: Plan) => {
    if (!currentSubscription) return 0;
    
    const currentPrice = currentSubscription.plano.preco;
    const newPrice = newPlan.preco;
    
    if (newPrice <= currentPrice) return 0;
    
    const today = new Date();
    const nextDueDate = new Date(currentSubscription.proxima_cobranca || '');
    const daysRemaining = Math.ceil((nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = 30;
    
    const priceDifference = newPrice - currentPrice;
    return (priceDifference * daysRemaining) / totalDays;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Alternar Plano
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {currentSubscription && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm">Plano Atual</CardTitle>
                <CardDescription>
                  {currentSubscription.plano.nome} - R$ {currentSubscription.plano.preco}/mês
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {availablePlans.map((plan) => {
              const isUpgrade = currentSubscription && plan.preco > currentSubscription.plano.preco;
              const prorationAmount = calculateProration(plan);
              
              return (
                <Card 
                  key={plan.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedPlan?.id === plan.id 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {plan.nome}
                        {isUpgrade && <Badge variant="secondary">Upgrade</Badge>}
                        {!isUpgrade && currentSubscription && (
                          <Badge variant="outline">Downgrade</Badge>
                        )}
                      </CardTitle>
                      {selectedPlan?.id === plan.id && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <CardDescription>
                      R$ {plan.preco}/mês
                      {isUpgrade && prorationAmount > 0 && (
                        <span className="block text-sm text-orange-600 mt-1">
                          + R$ {prorationAmount.toFixed(2)} (cobrança proporcional)
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Assistentes: {formatLimit(plan.max_assistentes)}</div>
                      <div>WhatsApp: {formatLimit(plan.max_instancias_whatsapp)}</div>
                      <div>Conversas/mês: {formatLimit(plan.max_conversas_mes)}</div>
                      <div>Agendamentos/mês: {formatLimit(plan.max_agendamentos_mes)}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedPlan && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <h4 className="font-medium">Resumo da alteração:</h4>
                  <div className="flex justify-between">
                    <span>Plano atual:</span>
                    <span>{currentSubscription?.plano.nome} (R$ {currentSubscription?.plano.preco}/mês)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Novo plano:</span>
                    <span>{selectedPlan.nome} (R$ {selectedPlan.preco}/mês)</span>
                  </div>
                  {currentSubscription && selectedPlan.preco > currentSubscription.plano.preco && (
                    <div className="flex justify-between text-orange-600">
                      <span>Cobrança proporcional hoje:</span>
                      <span>R$ {calculateProration(selectedPlan).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium pt-2 border-t">
                    <span>Total a cobrar hoje:</span>
                    <span>
                      {currentSubscription && selectedPlan.preco > currentSubscription.plano.preco
                        ? `R$ ${calculateProration(selectedPlan).toFixed(2)}`
                        : 'R$ 0,00'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handlePlanChange} 
              disabled={!selectedPlan || loading}
              className="flex-1"
            >
              {loading ? (
                'Processando...'
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Confirmar Alteração
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
