import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { WhatsAppInstance } from "@/hooks/use-whatsapp-instances"
import { MessageCircle, Plus, CheckCircle, Phone } from "lucide-react"

interface SelectWhatsAppInstanceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instances: WhatsAppInstance[]
  profileId: string
  onLinkInstance: (instanceId: string, profileId: string) => Promise<boolean>
  onCreateNewInstance: () => void
  loading?: boolean
}

export function SelectWhatsAppInstanceModal({
  open,
  onOpenChange,
  instances,
  profileId,
  onLinkInstance,
  onCreateNewInstance,
  loading = false
}: SelectWhatsAppInstanceModalProps) {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)

  const handleLink = async () => {
    if (!selectedInstanceId) return
    
    setLinking(true)
    const success = await onLinkInstance(selectedInstanceId, profileId)
    setLinking(false)
    
    if (success) {
      onOpenChange(false)
      setSelectedInstanceId(null)
    }
  }

  const handleCreateNew = () => {
    onCreateNewInstance()
    onOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (linking) return
    onOpenChange(newOpen)
    if (!newOpen) {
      setSelectedInstanceId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-600/10 text-green-700 border-green-600/20">Conectado</Badge>
      case 'qr_pending':
        return <Badge variant="secondary">Aguardando QR</Badge>
      default:
        return <Badge variant="outline">Desconectado</Badge>
    }
  }

  const getProviderName = (provider?: string) => {
    switch (provider) {
      case 'evolution':
        return 'Aplia'
      default:
        return provider || 'Aplia'
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conectar WhatsApp
          </DialogTitle>
          <DialogDescription>
            Selecione uma instância do WhatsApp já configurada ou crie uma nova para vincular ao perfil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {instances.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Instâncias disponíveis:</h4>
              {instances.map((instance) => (
                <Card 
                  key={instance.id}
                  className={`cursor-pointer transition-colors ${
                    selectedInstanceId === instance.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedInstanceId(instance.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">
                            {instance.display_name || instance.instance_name}
                          </p>
                          {selectedInstanceId === instance.id && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(instance.status)}
                          <Badge variant="outline" className="text-xs">
                            {getProviderName(instance.integration_provider)}
                          </Badge>
                        </div>

                        {instance.phone_number && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{instance.phone_number}</span>
                          </div>
                        )}

                        {instance.status === 'connected' && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Recomendado - Já conectado
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h4 className="font-medium mb-2">Nenhuma instância configurada</h4>
              <p className="text-sm text-muted-foreground">
                Crie uma nova instância do WhatsApp para conectar ao perfil.
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleCreateNew}
              disabled={linking}
            >
              <Plus className="h-4 w-4" />
              Criar nova instância
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={linking}
          >
            Cancelar
          </Button>
          {instances.length > 0 && (
            <Button 
              onClick={handleLink}
              disabled={!selectedInstanceId || linking}
            >
              {linking ? 'Vinculando...' : 'Vincular Instância'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}