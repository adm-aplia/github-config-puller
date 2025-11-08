import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { RefreshCw, Plus, User, SquarePen, MessageCircle, CalendarDays, Trash2, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { useProfessionalProfiles } from "@/hooks/use-professional-profiles"
import { useGoogleIntegrations } from "@/hooks/use-google-integrations"
import { useWhatsAppInstances } from "@/hooks/use-whatsapp-instances"
import { useSubscription } from "@/hooks/use-subscription"
import { Switch } from "@/components/ui/switch"
import { ProfileForm } from "@/components/profiles/profile-form"
import { CreateInstanceModal } from "@/components/whatsapp/CreateInstanceModal"
import { QrCodeDialog } from "@/components/whatsapp/QrCodeDialog"
import { SelectGoogleAccountModal } from "@/components/google/SelectGoogleAccountModal"
import { SelectWhatsAppInstanceModal } from "@/components/whatsapp/SelectWhatsAppInstanceModal"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatLimit, formatUsage, canCreateMore, isUnlimited } from "@/lib/limits"

export default function PerfilsPage() {
  const { profiles, limits, loading, createProfile, updateProfile, deleteProfile, refetch } = useProfessionalProfiles()
  const { credentials, profileLinks, connectGoogleAccount, linkProfileToGoogle, unlinkProfileFromGoogle, refetch: refetchGoogle } = useGoogleIntegrations()
  const { instances, createInstance, updateInstance, refetch: refetchInstances } = useWhatsAppInstances()
  const { subscription } = useSubscription()
  const [showForm, setShowForm] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [showGoogleModal, setShowGoogleModal] = useState(false)
  const [showCreateInstanceModal, setShowCreateInstanceModal] = useState(false)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [showQrDialog, setShowQrDialog] = useState(false)
  const [createdInstance, setCreatedInstance] = useState<any>(null)

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

  const handleWhatsAppCreate = async (displayName: string) => {
    if (!selectedProfileId) {
      console.error('No profile selected for WhatsApp instance creation')
      return
    }

    const instance = await createInstance({
      display_name: displayName,
      professional_profile_id: selectedProfileId,
    })

    if (instance) {
      setCreatedInstance(instance)
      setShowCreateInstanceModal(false)
      setShowQrDialog(true)
    }
  }

  const handleWhatsAppClick = (profileId: string) => {
    setSelectedProfileId(profileId)
    setShowWhatsAppModal(true)
  }

  const handleQrConnected = () => {
    setShowQrDialog(false)
    setCreatedInstance(null)
    setSelectedProfileId(null)
    refetchInstances()
    refetch()
  }

  const handleGoogleConnect = (profileId: string) => {
    setSelectedProfileId(profileId)
    setShowGoogleModal(true)
  }

  const handleLinkGoogleAccount = async (credentialId: string, profileId: string) => {
    const success = await linkProfileToGoogle(credentialId, profileId)
    if (success) {
      refetchGoogle()
      refetch()
    }
    return success
  }

  const handleConnectNewGoogleAccount = async () => {
    if (selectedProfileId) {
      localStorage.setItem('pending_google_link_profile_id', selectedProfileId)
    }
    await connectGoogleAccount()
  }

  const handleLinkWhatsAppInstance = async (instanceId: string, profileId: string) => {
    const success = await updateInstance(instanceId, { professional_profile_id: profileId })
    if (success) {
      refetchInstances()
      refetch()
    }
    return success
  }

  const handleCreateNewWhatsAppInstance = () => {
    setShowWhatsAppModal(false)
    setShowCreateInstanceModal(true)
  }

  const handleUnlinkWhatsAppInstance = async (instanceId: string) => {
    // Remove profile association from the specific instance
    const success = await updateInstance(instanceId, { professional_profile_id: null })
    if (success) {
      refetchInstances()
      refetch()
    }
    return success
  }

  const handleUnlinkGoogleAccount = async (profileId: string) => {
    // Find the linked credential and unlink it
    const linkedCredential = credentials.find(cred => cred.professional_profile_id === profileId)
    if (linkedCredential) {
      // Find the link in profileLinks
      const link = profileLinks.find(link => 
        link.google_credential_id === linkedCredential.id && 
        link.professional_profile_id === profileId
      )
      if (link) {
        const success = await unlinkProfileFromGoogle(link.id)
        if (success) {
          refetchGoogle()
          refetch()
        }
        return success
      }
    }
    return false
  }

  const handleToggleStatus = async (profileId: string, isActive: boolean) => {
    const success = await updateProfile(profileId, { is_active: isActive })
    if (success) {
      refetch()
    }
  }

  // Helper functions to check connection status
  const getWhatsAppInfo = (profileId: string) => {
    const linkedInstances = instances.filter(inst => inst.professional_profile_id === profileId)
    const hasConnected = linkedInstances.some(inst => inst.status === 'connected')
    return {
      count: linkedInstances.length,
      hasConnected,
      instances: linkedInstances
    }
  }

  const getGoogleStatus = (profileId: string) => {
    // Now we can check directly from credentials using the synchronized professional_profile_id
    const credential = credentials.find(cred => cred.professional_profile_id === profileId)
    return credential ? true : false
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
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <div className="space-y-4 sm:flex sm:justify-between sm:items-start sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Perfis Profissionais</h1>
              <p className="text-muted-foreground text-sm sm:text-base mt-1">
                Gerencie seus perfis profissionais cadastrados
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center justify-center gap-2 w-full sm:w-auto order-2 sm:order-1" 
                onClick={refetch}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="sm:inline">Atualizar</span>
              </Button>
              <Button 
                size="sm"
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 w-full sm:w-auto order-1 sm:order-2"
                onClick={openCreateForm}
                disabled={limits && !canCreateMore(profiles.length, limits.max_assistentes)}
              >
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Novo Perfil</span>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <User className="h-5 w-5" />
                Informações do Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <Badge variant="secondary" className="w-fit">
                  {subscription?.plano?.nome || 'Gratuito'}
                </Badge>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm">
                    <span className="font-medium">{formatUsage(profiles.length, limits?.max_assistentes || 0)}</span> perfis utilizados
                  </span>
                  {limits && canCreateMore(profiles.length, limits.max_assistentes) && !isUnlimited(limits.max_assistentes) && (
                    <span className="text-sm text-green-600">
                      <span className="font-medium">{limits.max_assistentes - profiles.length}</span> perfis disponíveis
                    </span>
                  )}
                  {limits && isUnlimited(limits.max_assistentes) && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Perfis ilimitados
                    </span>
                  )}
                  {limits && !canCreateMore(profiles.length, limits.max_assistentes) && !isUnlimited(limits.max_assistentes) && (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Limite atingido</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>
                  Lista de perfis profissionais cadastrados no sistema
                </CardDescription>
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
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block relative w-full overflow-auto">
                    <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Google</TableHead>
                <TableHead>Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
                      <TableBody>
                       {profiles.map((profile) => {
                            const whatsappInfo = getWhatsAppInfo(profile.id)
                            const googleConnected = getGoogleStatus(profile.id)
                            
                            return (
                            <TableRow key={profile.id}>
                              <TableCell>
                                <Switch
                                  checked={profile.is_active ?? true}
                                  onCheckedChange={(checked) => handleToggleStatus(profile.id, checked)}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{profile.fullname}</TableCell>
                              <TableCell>{profile.specialty}</TableCell>
                              <TableCell>
                                {whatsappInfo.count > 0 ? (
                                  <Badge 
                                    variant="default" 
                                    className={whatsappInfo.hasConnected 
                                      ? "bg-green-600/10 text-green-700 border-green-600/20"
                                      : "bg-amber-600/10 text-amber-700 border-amber-600/20"
                                    }
                                  >
                                    {whatsappInfo.count === 1 
                                      ? "1 número"
                                      : `${whatsappInfo.count} números`
                                    }
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">Não conectado</span>
                                )}
                              </TableCell>
                             <TableCell>
                               {googleConnected ? (
                                 <Badge variant="default" className="bg-green-600/10 text-green-700 border-green-600/20">
                                   Conectado
                                 </Badge>
                               ) : (
                                 <span className="text-muted-foreground">Não conectado</span>
                               )}
                             </TableCell>
                             <TableCell>
                               {format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })}
                             </TableCell>
                             <TableCell className="text-right">
                               <div className="flex justify-end gap-1">
                                 <Button 
                                   variant="ghost" 
                                   size="sm" 
                                   className="gap-1 hover:bg-muted hover:text-foreground"
                                   onClick={() => openEditForm(profile)}
                                 >
                                   <SquarePen className="h-4 w-4" />
                                   Editar
                                 </Button>
                                   <Button 
                                     variant="ghost" 
                                     size="sm" 
                                     className={`gap-1 hover:bg-muted hover:text-foreground ${
                                       whatsappInfo.hasConnected ? 'text-green-600' : ''
                                     }`}
                                     onClick={() => handleWhatsAppClick(profile.id)}
                                   >
                                     <MessageCircle className="h-4 w-4" />
                                     WhatsApp
                                   </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className={`gap-1 hover:bg-muted hover:text-foreground ${
                                      googleConnected ? 'text-green-600' : ''
                                    }`}
                                    onClick={() => handleGoogleConnect(profile.id)}
                                  >
                                    <CalendarDays className="h-4 w-4" />
                                    Google
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
                                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Esta ação não pode ser desfeita. O perfil profissional será permanentemente excluído.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteProfile(profile.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Excluir
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                               </div>
                             </TableCell>
                           </TableRow>
                           )
                         })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-4">
                    {profiles.map((profile) => {
                      const whatsappInfo = getWhatsAppInfo(profile.id)
                      const googleConnected = getGoogleStatus(profile.id)
                      
                      return (
                        <Card key={profile.id} className="border border-border/50">
                          <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <h3 className="font-medium text-base">{profile.fullname}</h3>
                                <p className="text-sm text-muted-foreground">{profile.specialty}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Status:</span>
                                <Switch
                                  checked={profile.is_active ?? true}
                                  onCheckedChange={(checked) => handleToggleStatus(profile.id, checked)}
                                  className="h-4 w-7 sm:h-6 sm:w-11 border-0"
                                  style={{
                                    '--switch-thumb-size': '12px',
                                    '--switch-translate': '12px',
                                  } as React.CSSProperties}
                                />
                              </div>
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(profile.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              {whatsappInfo.count > 0 ? (
                                <Badge 
                                  variant="default" 
                                  className={whatsappInfo.hasConnected 
                                    ? "bg-green-600/10 text-green-700 border-green-600/20 text-xs"
                                    : "bg-amber-600/10 text-amber-700 border-amber-600/20 text-xs"
                                  }
                                >
                                  WhatsApp: {whatsappInfo.count === 1 
                                    ? "1 número"
                                    : `${whatsappInfo.count} números`
                                  }
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  WhatsApp: Não conectado
                                </Badge>
                              )}
                              
                              {googleConnected ? (
                                <Badge variant="default" className="bg-green-600/10 text-green-700 border-green-600/20 text-xs">
                                  Google: Conectado
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Google: Não conectado
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 min-w-[80px] text-xs h-8"
                                onClick={() => openEditForm(profile)}
                              >
                                <SquarePen className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className={`flex-1 min-w-[80px] text-xs h-8 ${
                                  whatsappInfo.hasConnected ? 'text-green-600 border-green-600/20' : ''
                                }`}
                                onClick={() => handleWhatsAppClick(profile.id)}
                              >
                                <MessageCircle className="h-3 w-3 mr-1" />
                                WhatsApp
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className={`flex-1 min-w-[80px] text-xs h-8 ${
                                  googleConnected ? 'text-green-600 border-green-600/20' : ''
                                }`}
                                onClick={() => handleGoogleConnect(profile.id)}
                              >
                                <CalendarDays className="h-3 w-3 mr-1" />
                                Google
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 min-w-[80px] text-xs h-8 text-destructive border-destructive/20 hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Excluir
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. O perfil profissional será permanentemente excluído.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteProfile(profile.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </>
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

      <SelectWhatsAppInstanceModal
        open={showWhatsAppModal}
        onOpenChange={setShowWhatsAppModal}
        instances={instances}
        profileId={selectedProfileId || ''}
        onLinkInstance={handleLinkWhatsAppInstance}
        onCreateNewInstance={handleCreateNewWhatsAppInstance}
        onUnlinkInstance={handleUnlinkWhatsAppInstance}
      />

      <SelectGoogleAccountModal
        open={showGoogleModal}
        onOpenChange={setShowGoogleModal}
        credentials={credentials}
        profileId={selectedProfileId || ''}
        onLinkAccount={handleLinkGoogleAccount}
        onConnectNewAccount={handleConnectNewGoogleAccount}
        onUnlinkAccount={handleUnlinkGoogleAccount}
      />

      <CreateInstanceModal
        open={showCreateInstanceModal}
        onOpenChange={setShowCreateInstanceModal}
        onSubmit={handleWhatsAppCreate}
      />

      <QrCodeDialog
        open={showQrDialog}
        onOpenChange={setShowQrDialog}
        instanceName={createdInstance?.display_name}
        qrCode={createdInstance?.qr_code}
        instanceId={createdInstance?.id}
        instanceSlug={createdInstance?.instance_name}
        onConnected={handleQrConnected}
      />
    </DashboardLayout>
  )
}
