import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CalendarDays, RefreshCw, Mail, Check, Trash2 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useGoogleIntegrations } from "@/hooks/use-google-integrations"
import { Skeleton } from "@/components/ui/skeleton"

export default function IntegracoesPage() {
  const { credentials, profileLinks, loading, connectGoogleAccount, disconnectGoogleAccount, refetch } = useGoogleIntegrations();

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
            <Button onClick={handleConnectGoogle}>
              <CalendarDays className="mr-2 h-4 w-4" />
              Conectar Google Agenda
            </Button>
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
                      <Button onClick={handleConnectGoogle}>
                        <CalendarDays className="mr-2 h-4 w-4" />
                        Conectar primeira conta
                      </Button>
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