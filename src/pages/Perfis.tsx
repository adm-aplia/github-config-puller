import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { RefreshCw, Plus, User, SquarePen, Link, Trash2, AlertCircle } from "lucide-react"
import { useProfessionalProfiles } from "@/hooks/use-professional-profiles"
import { ProfileForm } from "@/components/profiles/profile-form"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function PerfilsPage() {
  const { profiles, limits, loading, createProfile, updateProfile, deleteProfile, refetch } = useProfessionalProfiles()
  const [showForm, setShowForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)

  const handleCreateProfile = async (data) => {
    const success = await createProfile(data)
    if (success) {
      setShowForm(false)
    }
    return success
  }

  const handleUpdateProfile = async (data) => {
    if (!editingProfile) return false
    const success = await updateProfile(editingProfile.id, data)
    if (success) {
      setEditingProfile(null)
      setShowForm(false)
    }
    return success
  }

  const handleDeleteProfile = async (profileId) => {
    await deleteProfile(profileId)
  }

  const openEditForm = (profile) => {
    setEditingProfile(profile)
    setShowForm(true)
  }

  const openCreateForm = () => {
    setEditingProfile(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setEditingProfile(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Carregando perfis...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Perfis Profissionais</h1>
              <p className="text-muted-foreground">Gerencie seus perfis profissionais cadastrados</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2" onClick={refetch}>
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              <Button 
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2"
                onClick={openCreateForm}
                disabled={limits && profiles.length >= limits.max_assistentes}
              >
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
                <Badge variant="secondary">
                  Profissional
                </Badge>
                <span className="text-sm">
                  <span className="font-medium">{profiles.length}</span> de{" "}
                  <span className="font-medium">{limits?.max_assistentes || 0}</span> perfis utilizados
                </span>
                {limits && profiles.length < limits.max_assistentes && (
                  <span className="text-sm text-green-600">
                    <span className="font-medium">{limits.max_assistentes - profiles.length}</span> perfis disponíveis
                  </span>
                )}
                {limits && profiles.length >= limits.max_assistentes && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Limite atingido</span>
                  </div>
                )}
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
                <Button variant="outline" size="sm" className="gap-2" onClick={refetch}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {profiles.length === 0 ? (
                <div className="text-center py-12">
                  <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum perfil cadastrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie seu primeiro perfil profissional para começar
                  </p>
                  <Button onClick={openCreateForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Perfil
                  </Button>
                </div>
              ) : (
                <div className="relative w-full overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Especialidade</TableHead>
                        <TableHead>CRM/ID</TableHead>
                        <TableHead>Data de Criação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">{profile.fullname}</TableCell>
                          <TableCell>{profile.specialty}</TableCell>
                          <TableCell>
                            {profile.professionalid ? (
                              <Badge variant="outline">{profile.professionalid}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="gap-1 hover:bg-muted"
                                onClick={() => openEditForm(profile)}
                              >
                                <SquarePen className="h-4 w-4" />
                                Editar
                              </Button>
                              <Button variant="ghost" size="sm" className="gap-1 hover:bg-muted">
                                <Link className="h-4 w-4" />
                                Vincular
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Excluir
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza de que deseja excluir o perfil "{profile.fullname}"? 
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteProfile(profile.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ProfileForm
        profile={editingProfile}
        isOpen={showForm}
        onClose={closeForm}
        onSubmit={editingProfile ? handleUpdateProfile : handleCreateProfile}
      />
    </DashboardLayout>
  )
}