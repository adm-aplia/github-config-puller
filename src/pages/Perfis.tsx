import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { RefreshCw, Plus, User, SquarePen, Link, Trash2 } from "lucide-react"

const profiles = [
  {
    id: "1",
    name: "Dra. Mariana",
    specialty: "Cardiologia",
    createdAt: "10/04/2025",
    googleAccount: "Não vinculado",
    whatsappStatus: "Aplia"
  }
]

export default function PerfilsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Perfis Profissionais</h1>
              <p className="text-muted-foreground">Visualize seus perfis profissionais cadastrados</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              <Button className="bg-red-500 hover:bg-red-600 text-white gap-2">
                <Plus className="h-4 w-4" />
                Novo Perfil
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge className="bg-red-500 text-white hover:bg-red-600">
                  Profissional
                </Badge>
                <span className="text-sm">
                  <span className="font-medium">1</span> de <span className="font-medium">3</span> perfis utilizados
                </span>
                <span className="text-sm text-green-600">
                  <span className="font-medium">2</span> perfis disponíveis
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Seus Perfis</CardTitle>
                  <CardDescription>
                    Lista de perfis profissionais cadastrados no sistema
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Especialidade</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead>Conta Google</TableHead>
                      <TableHead>Status WhatsApp</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">{profile.name}</TableCell>
                        <TableCell>{profile.specialty}</TableCell>
                        <TableCell>{profile.createdAt}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {profile.googleAccount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {profile.whatsappStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="gap-1 hover:bg-gray-100">
                              <SquarePen className="h-4 w-4" />
                              Editar
                            </Button>
                            <Button variant="ghost" size="sm" className="gap-1 hover:bg-gray-100">
                              <Link className="h-4 w-4" />
                              Vincular
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="gap-1 text-red-600 hover:text-red-800 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}