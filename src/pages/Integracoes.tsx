import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, RefreshCw, Mail, Check, Trash2, Sparkles } from "lucide-react"
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
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
          <div className="container mx-auto px-6 py-8">
            <div className="text-center mb-12">
              <Skeleton className="h-6 w-32 mx-auto mb-4" />
              <Skeleton className="h-10 w-64 mx-auto mb-4" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
            <Skeleton className="h-96 w-full max-w-6xl mx-auto" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-aplia-blue/10 text-aplia-blue hover:bg-aplia-blue/20 border-aplia-blue/20">
              <Sparkles className="h-3 w-3 mr-1" />
              Conexões
            </Badge>
            <h1 className="text-4xl font-bold mb-4">Integrações</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conecte suas ferramentas favoritas e potencialize sua produtividade
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="google" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-1 mb-8">
              <TabsTrigger value="google">Google Agenda</TabsTrigger>
            </TabsList>

            <TabsContent value="google" className="space-y-8">
              {/* Integration Card */}
              <Card className="max-w-6xl mx-auto border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="bg-gradient-to-r from-aplia-blue/5 to-transparent border-b">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-aplia-blue/10 rounded-full">
                      <CalendarDays className="h-6 w-6 text-aplia-blue" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl">Google Agenda</CardTitle>
                      <CardDescription className="text-base">
                        Sincronize seus agendamentos automaticamente com o Google Agenda
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={handleConnectGoogle}
                      className="bg-aplia-blue hover:bg-aplia-blue/90 text-white"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Conectar Nova Conta
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
                      <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/20">
                        <div className="max-w-md mx-auto space-y-4">
                          <div className="p-4 bg-aplia-blue/10 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                            <CalendarDays className="h-8 w-8 text-aplia-blue" />
                          </div>
                          <h4 className="text-xl font-semibold">Nenhuma conta conectada</h4>
                          <p className="text-muted-foreground">
                            Conecte sua conta do Google para sincronizar agendamentos automaticamente
                          </p>
                          <Button 
                            onClick={handleConnectGoogle}
                            className="bg-aplia-blue hover:bg-aplia-blue/90 text-white mt-4"
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            Conectar primeira conta
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Connected Accounts List */
                      <div className="grid gap-4">
                        {credentials.map((credential) => {
                          const linkedProfiles = profileLinks.filter(link => link.google_credential_id === credential.id);
                          return (
                            <Card 
                              key={credential.id} 
                              className="border-2 hover:shadow-md transition-all hover:border-aplia-blue/30"
                            >
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 flex-1">
                                    {/* Avatar */}
                                    <div className="p-3 bg-aplia-blue/10 rounded-full">
                                      <Mail className="h-5 w-5 text-aplia-blue" />
                                    </div>
                                    
                                    {/* Info */}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-lg">{credential.email}</h4>
                                        <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                                          <Check className="h-3 w-3 mr-1" />
                                          Conectado
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {credential.name || 'Nome não informado'}
                                      </p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className="border-aplia-blue/30 text-aplia-blue">
                                          {linkedProfiles.length > 0 
                                            ? `${linkedProfiles.length} ${linkedProfiles.length === 1 ? 'perfil vinculado' : 'perfis vinculados'}` 
                                            : 'Não vinculado a perfis'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                                    onClick={() => handleDisconnectGoogle(credential.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Desconectar
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Trust Elements */}
              <div className="mt-16 text-center">
                <div className="flex justify-center items-center gap-8 opacity-60">
                  <div className="text-xs text-muted-foreground">🔒 Conexão Segura</div>
                  <div className="text-xs text-muted-foreground">✅ Sincronização Automática</div>
                  <div className="text-xs text-muted-foreground">📞 Suporte Dedicado</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}