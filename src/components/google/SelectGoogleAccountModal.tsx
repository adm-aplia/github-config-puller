
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { GoogleCredential } from "@/hooks/use-google-integrations"
import { Calendar, Plus, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface SelectGoogleAccountModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  credentials: GoogleCredential[]
  profileId: string
  onLinkAccount: (credentialId: string, profileId: string) => Promise<boolean>
  onConnectNewAccount: () => Promise<void>
  onUnlinkAccount?: (profileId: string) => Promise<boolean>
  loading?: boolean
}

export function SelectGoogleAccountModal({
  open,
  onOpenChange,
  credentials,
  profileId,
  onLinkAccount,
  onConnectNewAccount,
  onUnlinkAccount,
  loading = false
}: SelectGoogleAccountModalProps) {
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [unlinking, setUnlinking] = useState(false)

  // Find credential linked to this profile
  const linkedCredential = credentials.find(credential => 
    credential.professional_profile_id === profileId
  )
  
  // Filter out credentials already linked to this profile
  const availableCredentials = credentials.filter(credential => 
    credential.professional_profile_id !== profileId
  )

  const handleLink = async () => {
    if (!selectedCredentialId) return
    
    setLinking(true)
    const success = await onLinkAccount(selectedCredentialId, profileId)
    setLinking(false)
    
    if (success) {
      onOpenChange(false)
      setSelectedCredentialId(null)
    }
  }

  const handleConnectNew = async () => {
    setConnecting(true)
    await onConnectNewAccount()
    setConnecting(false)
    onOpenChange(false)
  }

  const handleUnlink = async () => {
    if (!onUnlinkAccount) return
    
    setUnlinking(true)
    const success = await onUnlinkAccount(profileId)
    setUnlinking(false)
    
    if (success) {
      onOpenChange(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (linking || connecting || unlinking) return
    onOpenChange(newOpen)
    if (!newOpen) {
      setSelectedCredentialId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Conectar Google Agenda
          </DialogTitle>
          <DialogDescription>
            Selecione uma conta Google já conectada ou conecte uma nova conta para sincronizar eventos de calendário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {linkedCredential && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Conta atual:</h4>
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{linkedCredential.name || linkedCredential.email}</p>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {linkedCredential.email}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Conectado em {format(new Date(linkedCredential.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-green-600">
                        ✓ Vinculado a este perfil
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Google
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUnlink}
                      disabled={unlinking}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {unlinking ? 'Desvinculando...' : 'Desvincular'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {availableCredentials.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Contas disponíveis:</h4>
              {availableCredentials.map((credential) => (
                <Card 
                  key={credential.id}
                  className={`cursor-pointer transition-colors ${
                    selectedCredentialId === credential.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedCredentialId(credential.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{credential.email}</p>
                          {selectedCredentialId === credential.id && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Conectado em {format(new Date(credential.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Google
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !linkedCredential ? (
            <div className="text-center py-6">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h4 className="font-medium mb-2">Nenhuma conta disponível</h4>
              <p className="text-sm text-muted-foreground">
                Conecte uma conta Google para sincronizar eventos de calendário.
              </p>
            </div>
          ) : null}

          {(!linkedCredential || availableCredentials.length > 0) && (
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleConnectNew}
                disabled={connecting || linking || unlinking}
              >
                <Plus className="h-4 w-4" />
                {connecting ? 'Conectando...' : linkedCredential ? 'Conectar nova conta Google' : 'Conectar conta Google'}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={linking || connecting || unlinking}
          >
            {linkedCredential ? 'Fechar' : 'Cancelar'}
          </Button>
          {availableCredentials.length > 0 && (
            <Button 
              onClick={handleLink}
              disabled={!selectedCredentialId || linking || connecting || unlinking}
            >
              {linking ? 'Vinculando...' : 'Vincular Conta'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
