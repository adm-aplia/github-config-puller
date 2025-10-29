import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MigrationResult {
  success: boolean;
  migrated: number;
  failed: number;
  results: Array<{
    assinatura_id: string;
    asaas_subscription_id?: string;
    status: string;
    message?: string;
  }>;
}

export function SubscriptionMigration() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const { toast } = useToast();

  const handleMigrate = async () => {
    try {
      setLoading(true);
      setResult(null);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      const response = await fetch(
        'https://vmqxzkukyfxxgxekkdem.supabase.co/functions/v1/migrate-subscriptions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao migrar assinaturas');
      }

      setResult(data);

      if (data.migrated > 0) {
        toast({
          title: 'Migração concluída',
          description: `${data.migrated} assinatura(s) migrada(s) com sucesso!`,
        });
      } else if (data.failed > 0) {
        toast({
          title: 'Migração com erros',
          description: `${data.failed} assinatura(s) falharam. Verifique os detalhes.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Nenhuma migração necessária',
          description: 'Todas as assinaturas já estão migradas.',
        });
      }
    } catch (error) {
      console.error('Erro na migração:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao migrar assinaturas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-muted shadow-card">
      <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-950/20">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          Migração de Assinaturas
        </CardTitle>
        <CardDescription className="text-base">
          Migre suas assinaturas para o sistema de cobrança recorrente do Asaas
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta ferramenta migra assinaturas ativas que ainda não possuem cobrança recorrente configurada no Asaas.
            Execute apenas uma vez após configurar o webhook.
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleMigrate}
          disabled={loading}
          className="w-full"
          variant="default"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrando...
            </>
          ) : (
            'Executar Migração'
          )}
        </Button>

        {result && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Migradas com sucesso:</span>
              <span className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                {result.migrated}
              </span>
            </div>
            {result.failed > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Falhas:</span>
                <span className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {result.failed}
                </span>
              </div>
            )}
            
            {result.results.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Ver detalhes
                </summary>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                  {result.results.map((r, i) => (
                    <div key={i} className="p-2 rounded bg-muted/50 text-xs">
                      <div className="flex items-center gap-2">
                        {r.status === 'success' ? (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-red-600" />
                        )}
                        <span className="font-mono">{r.assinatura_id.slice(0, 8)}...</span>
                      </div>
                      {r.message && (
                        <p className="text-muted-foreground mt-1">{r.message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
