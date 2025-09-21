import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, XCircle } from 'lucide-react';
import { Subscription } from '@/hooks/use-subscription';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlanCancelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSubscription: Subscription | null;
  onSuccess: () => void;
}

export function PlanCancelModal({ 
  open, 
  onOpenChange, 
  currentSubscription,
  onSuccess 
}: PlanCancelModalProps) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { toast } = useToast();

  const handleCancel = async () => {
    if (!confirmed || !currentSubscription) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription');

      if (error) throw error;

      toast({
        title: 'Assinatura cancelada',
        description: 'Sua assinatura foi cancelada com sucesso. Você manterá acesso até o final do período pago.',
      });

      onSuccess();
      onOpenChange(false);
      setConfirmed(false);
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Erro ao cancelar assinatura',
        description: error.message || 'Não foi possível cancelar a assinatura.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const nextDueDate = currentSubscription?.proxima_cobranca 
    ? new Date(currentSubscription.proxima_cobranca).toLocaleDateString('pt-BR')
    : 'N/A';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Cancelar Assinatura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Atenção
              </CardTitle>
              <CardDescription>
                Ao cancelar sua assinatura, você perderá acesso aos seguintes recursos:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Todos os assistentes personalizados (voltará para 0)</li>
                <li>Números WhatsApp extras (manterá apenas 1)</li>
                <li>Recursos premium do plano atual</li>
                <li>Suporte prioritário</li>
              </ul>
            </CardContent>
          </Card>

          {currentSubscription && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Plano atual:</span>
                    <span className="font-medium">{currentSubscription.plano.nome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor mensal:</span>
                    <span className="font-medium">R$ {currentSubscription.plano.preco}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Acesso até:</span>
                    <span className="font-medium">{nextDueDate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="confirm" 
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <label htmlFor="confirm" className="text-sm leading-none">
              Entendo que perderei acesso aos recursos premium e confirmo o cancelamento
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Manter Assinatura
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancel} 
              disabled={!confirmed || loading}
              className="flex-1"
            >
              {loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}