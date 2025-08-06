import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CalendarDays, RefreshCw, Mail, Check, Trash2 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

const connectedAccounts = [
  {
    id: "1",
    email: "nathancwb@gmail.com",
    name: "Nathan Almeida",
    profilesLinked: "Não vinculado",
    status: "connected"
  },
  {
    id: "2", 
    email: "adm.aplia@gmail.com",
    name: "Aplia",
    profilesLinked: "Não vinculado",
    status: "connected"
  },
  {
    id: "3",
    email: "ignes.quintelaps@gmail.com", 
    name: "Ignês Quintela",
    profilesLinked: "Não vinculado",
    status: "connected"
  },
  {
    id: "4",
    email: "ntnmarcs@gmail.com",
    name: "NTN Videos", 
    profilesLinked: "Não vinculado",
    status: "connected"
  }
]

export default function IntegracoesPage() {
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
            <Button>
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
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>
                  
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
                        {connectedAccounts.map((account) => (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="bg-gray-100 dark:bg-gray-800">
                                    <Mail className="h-3 w-3 text-gray-500" />
                                  </AvatarFallback>
                                </Avatar>
                                {account.email}
                              </div>
                            </TableCell>
                            <TableCell>{account.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {account.profilesLinked}
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
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Desconectar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}