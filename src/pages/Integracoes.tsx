import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, RefreshCw, Mail, Check, Trash2 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useGoogleIntegrations } from "@/hooks/use-google-integrations"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

export default function IntegracoesPage() {
  const { credentials, profileLinks, loading, refreshing, connectGoogleAccount, disconnectGoogleAccount, refetch } = useGoogleIntegrations();
  const { toast } = useToast();

  useEffect(() => {
    // SEO
    document.title = "Integrações - Google Agenda | Aplia";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Gerencie integrações e conecte o Google Agenda');
    const canonicalHref = `${window.location.origin}/dashboard/integracoes`;
    let linkEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.setAttribute('rel', 'canonical');
      document.head.appendChild(linkEl);
    }
    linkEl.setAttribute('href', canonicalHref);

    // Feedback de autenticação (para casos onde não há popup)
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get('auth_error');
    const authSuccess = urlParams.get('auth_success');

    if (authError) {
      toast({
        variant: 'destructive',
        title: 'Erro na autenticação',
        description: decodeURIComponent(authError),
      });
    }

    if (authSuccess) {
      toast({
        title: 'Google Agenda conectado',
        description: 'Sua conta foi conectada com sucesso.',
      });
      refetch();
    }

    if (authError || authSuccess) {
      window.history.replaceState({}, document.title, '/dashboard/integracoes');
    }

    // Listener para mensagens do popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.googleAuth) {
        const { type, message } = event.data.googleAuth;
        
        if (type === 'success') {
          toast({
            title: 'Google Agenda conectado',
            description: 'Sua conta foi conectada com sucesso.',
          });
          refetch();
        } else if (type === 'error') {
          toast({
            variant: 'destructive',
            title: 'Erro na autenticação',
            description: message === 'no_code' ? 'Código de autorização não recebido' : 
                        message === 'webhook_failed' ? 'Falha ao finalizar conexão com o Google' :
                        decodeURIComponent(message || 'Erro desconhecido'),
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast, refetch]);

  const handleConnectGoogle = () => {
    connectGoogleAccount();
  };

  const handleDisconnectGoogle = (credentialId: string) => {
    if (confirm('Tem certeza que deseja desconectar esta conta?')) {
      disconnectGoogleAccount(credentialId);
    }
  };
  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Integrações</h1>
          <p className="text-muted-foreground">
            Conecte suas ferramentas e sincronize seus dados
          </p>
        </div>

          {/* Tabs */}
          <Tabs defaultValue="google" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="google">Google Agenda</TabsTrigger>
            </TabsList>

            <TabsContent value="google" className="space-y-6">
              {/* Integration Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-6 w-6 text-aplia-blue" />
                      <div>
                        <CardTitle>Google Agenda</CardTitle>
                        <CardDescription>
                          Sincronize seus agendamentos com o Google Agenda
                        </CardDescription>
                      </div>
                    </div>
                    <Button 
                      onClick={handleConnectGoogle}
                      className="bg-aplia-blue hover:bg-aplia-blue/90 text-white"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Conectar Conta
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* Connected Accounts Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Contas Conectadas</h3>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={refetch} 
                        disabled={refreshing}
                        className="border-aplia-blue/20 hover:bg-aplia-blue/5"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Atualizando...' : 'Atualizar'}
                      </Button>
                    </div>

                    {/* No Accounts State */}
                    {credentials.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">
                          Nenhuma conta conectada
                        </p>
                        <Button 
                          onClick={handleConnectGoogle}
                          variant="outline"
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          Conectar primeira conta
                        </Button>
                      </div>
                    ) : (
                      /* Connected Accounts List */
                      <div className="space-y-3">
                        {credentials.map((credential) => {
                          const linkedProfiles = profileLinks.filter(link => link.google_credential_id === credential.id);
                          return (
                            <div 
                              key={credential.id} 
                              className="flex items-center justify-between p-4 border rounded-lg"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{credential.email}</p>
                                    <Badge variant="outline" className="text-xs">
                                      <Check className="h-3 w-3 mr-1" />
                                      Conectado
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {credential.name || 'Nome não informado'}
                                  </p>
                                  {linkedProfiles.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {linkedProfiles.length} {linkedProfiles.length === 1 ? 'perfil vinculado' : 'perfis vinculados'}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDisconnectGoogle(credential.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Desconectar
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
    </DashboardLayout>
  )
}