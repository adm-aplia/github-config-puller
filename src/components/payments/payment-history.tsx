import { usePayments } from '@/hooks/use-payments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PaymentHistory() {
  const { payments, loading, error } = usePayments();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
          <CardDescription>
            Visualize suas últimas cobranças
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2 text-sm">Carregando pagamentos...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Histórico de Pagamentos
          </CardTitle>
          <CardDescription>
            Visualize suas últimas cobranças
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-700 border-green-200 font-medium">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 font-medium">Pendente</Badge>;
      case 'overdue':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-medium">Em Atraso</Badge>;
      case 'cancelled':
        return <Badge className="bg-muted text-muted-foreground border-muted-foreground/20 font-medium">Cancelado</Badge>;
      case 'refunded':
        return <Badge className="bg-red-50 text-red-600 border-red-200 font-medium">Reembolsado</Badge>;
      default:
        return <Badge variant="outline" className="font-medium">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const translatePaymentMethod = (method: string) => {
    const methodMap: { [key: string]: string } = {
      'CREDIT_CARD': 'Cartão de Crédito',
      'PIX': 'PIX',
      'BOLETO': 'Boleto',
      'DEBIT_CARD': 'Cartão de Débito'
    };
    return methodMap[method] || method;
  };

  return (
    <Card className="border-muted shadow-card flex flex-col h-full">
      <CardHeader className="bg-gradient-to-r from-muted/30 to-transparent">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          Histórico de Pagamentos
        </CardTitle>
        <CardDescription className="text-base">
          Visualize suas últimas cobranças e faturas
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 flex-grow overflow-auto">
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Nenhum pagamento encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="border border-muted rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{payment.descricao}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      Vencimento: {formatDate(payment.data_vencimento)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg text-foreground whitespace-nowrap">{formatCurrency(payment.valor)}</p>
                    <div className="mt-1">
                      {getStatusBadge(payment.status)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-muted/50">
                  <div className="text-xs text-muted-foreground space-y-1">
                    {payment.forma_pagamento && (
                      <div><span className="font-medium text-foreground">{translatePaymentMethod(payment.forma_pagamento)}</span></div>
                    )}
                    {payment.data_pagamento && (
                      <div>Pago em: {formatDate(payment.data_pagamento)}</div>
                    )}
                  </div>
                  {payment.link_pagamento && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(payment.link_pagamento, '_blank')}
                      className="flex items-center gap-1 h-8 text-xs"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver Fatura
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}