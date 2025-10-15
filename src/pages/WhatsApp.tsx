
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Settings, Smartphone, Signal, User, UserPlus, QrCode, EllipsisVertical, Pen, UserCheck, UserX, Trash2, RefreshCw } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useWhatsAppInstances } from "@/hooks/use-whatsapp-instances"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"
import { QrCodeDialog } from "@/components/whatsapp/QrCodeDialog"
import { CreateInstanceModal } from "@/components/whatsapp/CreateInstanceModal"
import { AssignProfileModal } from "@/components/whatsapp/AssignProfileModal"
import { EditInstanceNameModal } from "@/components/whatsapp/edit-instance-name-modal"
import { useToast } from "@/hooks/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { supabase } from "@/integrations/supabase/client"
import { formatPhoneNumber, extractPhoneNumberFromApi, normalizePhoneNumber } from "@/lib/whatsapp"

const getStatusConfig = (status: string) => {
  const configs = {
    connected: {
      label: "Conectado",
      variant: "outline" as const,
      className: "text-gray-700 border-gray-300 bg-gray-100"
    },
    qr_pending: {
      label: "Aguardando QR",
      variant: "outline" as const,
      className: "text-gray-700 border-gray-200 bg-gray-50"
    },
    disconnected: {
      label: "Desconectado",
      variant: "destructive" as const,
      className: "text-red-700 border-red-200 bg-red-50"
    }
  }
  return configs[status as keyof typeof configs] || configs.disconnected
}

export default function WhatsAppPage() {
  const { instances, loading, createInstance, updateInstance, deleteInstance, refetch, syncInstances } = useWhatsAppInstances();
  const isMobile = useIsMobile();
  const [qrOpen, setQrOpen] = useState(false);
  const [qrData, setQrData] = useState<{ id?: string; slug?: string; displayName?: string; code?: string | null }>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [assignProfileOpen, setAssignProfileOpen] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const { toast } = useToast();

  const handleCreateSubmit = async (displayName: string) => {
    const created = await createInstance({ display_name: displayName });
    setCreateOpen(false);
    if (created) {
      handleShowQr(created);
    }
  };

  const handleCreateInstance = () => {
    setCreateOpen(true);
  };

  const handleDeleteInstance = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este número?')) {
      deleteInstance(id);
    }
  };

  const handleShowQr = (instance: any) => {
    setQrData({
      id: instance.id,
      slug: instance.instance_name,
      displayName: instance.display_name || instance.instance_name,
      code: instance.qr_code,
    });
    setQrOpen(true);
  };

  const handleAssignProfile = (instance: any) => {
    setSelectedInstance(instance);
    setAssignProfileOpen(true);
  };

  const handleAssignProfileSubmit = async (profileId: string) => {
    if (!selectedInstance) return;

    const success = await updateInstance(selectedInstance.id, {
      professional_profile_id: profileId,
    });

    if (success) {
      // If instance doesn't have phone number, fetch it
      if (!selectedInstance.phone_number) {
        try {
          const { data } = await supabase.functions.invoke('evolution-manager', {
            body: {
              action: 'fetch_instance_info',
              instanceName: selectedInstance.instance_name,
            },
          });

          if (data?.success) {
            const extractedPhone = extractPhoneNumberFromApi(data) || data.phone_number;
            const normalizedPhone = extractedPhone ? normalizePhoneNumber(extractedPhone) : null;
            
            // Update instance with phone number
            await supabase
              .from('whatsapp_instances')
              .update({
                phone_number: normalizedPhone,
                profile_picture_url: data.profile_picture_url,
                display_name: data.display_name
              })
              .eq('id', selectedInstance.id);

            // Update profile with phone number
            await supabase
              .from('professional_profiles')
              .update({ phonenumber: normalizedPhone })
              .eq('id', profileId);
          }
        } catch (error) {
          console.error('Error fetching phone number:', error);
        }
      }

      setAssignProfileOpen(false);
      setSelectedInstance(null);
      refetch();
    }
  };

  const handleEditName = (instance: any) => {
    setSelectedInstance(instance);
    setEditNameOpen(true);
  };

  const handleEditNameSubmit = async (newName: string) => {
    if (!selectedInstance) return;
    
    const success = await updateInstance(selectedInstance.id, {
      display_name: newName
    });
    
    if (success) {
      refetch();
    }
  };

  const handleDisconnect = async (instance: any) => {
    if (!confirm('Tem certeza que deseja desconectar este número?')) {
      return;
    }

    try {
      // Call Evolution API to disconnect
      const response = await supabase.functions.invoke('evolution-manager', {
        body: {
          action: 'disconnect_instance',
          instanceName: instance.instance_name,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Falha ao desconectar instância');
      }

      // Update local database status
      await updateInstance(instance.id, {
        status: 'disconnected',
      });

      toast({
        title: 'Número desconectado',
        description: 'O número foi desconectado com sucesso.',
      });

      refetch();
    } catch (error) {
      console.error('Error disconnecting instance:', error);
      toast({
        title: 'Erro ao desconectar',
        description: 'Não foi possível desconectar o número.',
        variant: 'destructive',
      });
    }
  };

  const handleSyncInstance = async (instance: any) => {
    try {
      // First enforce webhook configuration for N8N with messages_upsert only
      console.log('Enforcing webhook configuration for instance:', instance.instance_name);
      const { data: webhookData } = await supabase.functions.invoke('evolution-manager', {
        body: {
          action: 'enforce_webhook',
          instanceName: instance.instance_name,
        },
      });
      
      if (webhookData?.success) {
        console.log('Webhook enforced successfully:', webhookData);
        // Update webhook_url in database to N8N URL
        await supabase
          .from('whatsapp_instances')
          .update({ webhook_url: 'https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/aplia' })
          .eq('id', instance.id);
      }

      // Then fetch instance info
      const { data } = await supabase.functions.invoke('evolution-manager', {
        body: {
          action: 'fetch_instance_info',
          instanceName: instance.instance_name,
        },
      });

      if (data && data.success) {
        const updateData: any = {};
        
        const extractedPhone = extractPhoneNumberFromApi(data) || data.phone_number;
        if (extractedPhone) {
          updateData.phone_number = normalizePhoneNumber(extractedPhone);
        }
        
        if (data.profile_picture_url) {
          updateData.profile_picture_url = data.profile_picture_url;
        }
        
        if (data.display_name) {
          updateData.display_name = data.display_name;
        }
        
        if (data.isConnected) {
          updateData.status = 'connected';
          updateData.last_connected_at = new Date().toISOString();
        }

        if (Object.keys(updateData).length > 0) {
          await supabase
            .from('whatsapp_instances')
            .update(updateData)
            .eq('id', instance.id);

          toast({
            title: 'Número sincronizado',
            description: 'Dados do número atualizados com sucesso.',
          });
          refetch();
        } else {
          toast({
            title: 'Nenhuma atualização necessária',
            description: 'A instância já está atualizada.',
          });
        }
      } else {
        toast({
          title: 'Erro na sincronização',
          description: 'Não foi possível sincronizar a instância.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao sincronizar instância:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Erro interno ao sincronizar a instância.',
        variant: 'destructive',
      });
    }
  };

  // Sync on mount and periodic sync every 15 seconds
  useEffect(() => {
    syncInstances();
    
    const interval = setInterval(() => {
      syncInstances();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
                <p className="text-muted-foreground hidden md:block">
                  Gerencie seus números de WhatsApp Business
                </p>
              </div>
              <Button disabled>
                <Plus className="h-4 w-4 mr-2" />
                Novo Número
              </Button>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
              <p className="text-muted-foreground hidden md:block">
                Gerencie seus números de WhatsApp Business
              </p>
            </div>
            <Button onClick={handleCreateInstance} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Número
            </Button>
          </div>

          {instances.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhum número encontrado</p>
              <Button onClick={handleCreateInstance}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro número
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              {/* Header */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border-b bg-gray-50/50 dark:bg-gray-800/50 font-medium text-sm">
                <div>Nome</div>
                <div>Número</div>
                <div>Perfil Vinculado</div>
                <div>Status</div>
                <div className="text-right">Ações</div>
              </div>
              
              {/* Items */}
              {instances.map((instance) => {
                const statusConfig = getStatusConfig(instance.status)
                return (
                  <div key={instance.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border-b last:border-b-0 items-center group">
                    {/* Nome com Avatar */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={instance.profile_picture_url || undefined} alt={instance.display_name || instance.instance_name} />
                        <AvatarFallback className="bg-gray-2 00 dark:bg-gray-700">
                          <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </AvatarFallback>
                      </Avatar>
                       <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2">
                           <div className="font-medium">{instance.display_name || instance.instance_name}</div>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                             onClick={() => handleEditName(instance)}
                           >
                             <Pen className="h-3 w-3 text-gray-500" />
                           </Button>
                         </div>
                         {instance.profile_name && (
                           <div className="text-xs text-gray-600">
                             WhatsApp: {instance.profile_name}
                           </div>
                         )}
                       </div>
                    </div>

                    {/* Número */}
                    <div>
                      {instance.phone_number ? (
                        <span className="font-mono text-sm">
                          {formatPhoneNumber(instance.phone_number)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">
                          Número não disponível
                        </span>
                      )}
                    </div>

                     {/* Perfil Vinculado */}
                     <div className="text-sm">
                       {instance.professional_profile_name ? (
                         <div>
                           <div className="font-medium">{instance.professional_profile_name}</div>
                           <div className="text-xs text-muted-foreground">Perfil vinculado</div>
                         </div>
                       ) : (
                         <span className="text-gray-500">Nenhum perfil</span>
                       )}
                     </div>

                    {/* Status */}
                    <div>
                      <Badge variant={statusConfig.variant} className={statusConfig.className}>
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Ações */}
                    <div className="flex justify-end items-center gap-2">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs"
                          onClick={() => handleAssignProfile(instance)}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          {instance.professional_profile_id ? "Alterar Perfil" : "Atribuir Perfil"}
                        </Button>
                        {instance.status !== "connected" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs"
                            onClick={() => handleShowQr(instance)}
                          >
                            <QrCode className="h-3 w-3 mr-1" />
                            QR Code
                          </Button>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 ml-2 border-gray-300 bg-white hover:bg-gray-50 flex-shrink-0"
                          >
                            <EllipsisVertical className="h-4 w-4 text-black" />
                          </Button>
                        </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="w-48 bg-white border shadow-lg z-50">
                            <DropdownMenuItem 
                              className="flex items-center gap-2 text-black"
                              onClick={() => handleSyncInstance(instance)}
                            >
                              <RefreshCw className="h-4 w-4" />
                              Sincronizar
                            </DropdownMenuItem>
                           <DropdownMenuItem 
                             className="flex items-center gap-2 text-black"
                             onClick={() => handleDisconnect(instance)}
                           >
                             <UserX className="h-4 w-4" />
                             Desconectar
                           </DropdownMenuItem>
                           <DropdownMenuItem 
                             className="flex items-center gap-2 text-destructive"
                             onClick={() => handleDeleteInstance(instance.id)}
                           >
                             <Trash2 className="h-4 w-4" />
                             Excluir
                           </DropdownMenuItem>
                         </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <CreateInstanceModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreateSubmit}
      />

      <QrCodeDialog
        open={qrOpen}
        onOpenChange={setQrOpen}
        instanceName={qrData.displayName}
        qrCode={qrData.code}
        instanceId={qrData.id}
        instanceSlug={qrData.slug}
        onConnected={refetch}
      />

      <AssignProfileModal
        open={assignProfileOpen}
        onOpenChange={setAssignProfileOpen}
        onSubmit={handleAssignProfileSubmit}
        currentProfileId={selectedInstance?.professional_profile_id}
      />

      <EditInstanceNameModal
        open={editNameOpen}
        onOpenChange={setEditNameOpen}
        currentName={selectedInstance?.display_name || selectedInstance?.instance_name || ""}
        onSave={handleEditNameSubmit}
      />
    </DashboardLayout>
  )
}
