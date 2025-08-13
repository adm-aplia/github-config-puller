import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CalendarDays, RefreshCw, Mail, Check, Trash2 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useGoogleIntegrations } from "@/hooks/use-google-integrations"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"

export default function IntegracoesPage() {
  const { credentials, profileLinks, loading, connectGoogleAccount, disconnectGoogleAccount, refetch } = useGoogleIntegrations();
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

    // Feedback de autenticação
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
  }, [toast, refetch]);

  const handleConnectGoogle = (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    connectGoogleAccount({ preferPopup: true });
  };

  const handleConnectGoogleRedirect = (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    connectGoogleAccount({ preferPopup: false });
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
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
                <p className="text-muted-foreground">
                  Conecte-se com outros serviços e plataformas
                </p>
              </div>
              <Button disabled>
                <CalendarDays className="mr-2 h-4 w-4" />
                Conectar Google Agenda
              </Button>
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
              <p className="text-muted-foreground">
                Conecte-se com outros serviços e plataformas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" onClick={handleConnectGoogle}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Conectar Google Agenda
              </Button>
              <Button type="button" variant="outline" onClick={handleConnectGoogleRedirect}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Abrir por redirecionamento
              </Button>
            </div>
            </div>

            <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Google Agenda</CardTitle>
                <CardDescription>
                  Sincronize seus agendamentos com o Google Agenda automaticamente
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Contas Conectadas</h3>
                    <Button variant="outline" size="sm" onClick={refetch}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>
                  
                  {credentials.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">Nenhuma conta Google conectada</p>
                      <div className="flex items-center justify-center gap-2">
                        <Button type="button" onClick={handleConnectGoogle}>
                          <CalendarDays className="mr-2 h-4 w-4" />
                          Conectar primeira conta
                        </Button>
                        <Button type="button" variant="outline" onClick={handleConnectGoogleRedirect}>
                          <CalendarDays className="mr-2 h-4 w-4" />
                          Abrir por redirecionamento
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Perfis Vinculados</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {credentials.map((credential) => {
                            const linkedProfiles = profileLinks.filter(link => link.google_credential_id === credential.id);
                            return (
                              <TableRow key={credential.id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="bg-gray-100 dark:bg-gray-800">
                                        <Mail className="h-3 w-3 text-gray-500" />
                                      </AvatarFallback>
                                    </Avatar>
                                    {credential.email}
                                  </div>
                                </TableCell>
                                <TableCell>{credential.name || 'Nome não informado'}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {linkedProfiles.length > 0 ? `${linkedProfiles.length} perfis` : 'Não vinculado'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary">
                                    <Check className="h-3 w-3 mr-1" />
                                    Conectado
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDisconnectGoogle(credential.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Desconectar
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}