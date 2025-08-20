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
  loading?: boolean
}

export function SelectGoogleAccountModal({
  open,
  onOpenChange,
  credentials,
  profileId,
  onLinkAccount,
  onConnectNewAccount,
  loading = false
}: SelectGoogleAccountModalProps) {
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)
  const [connecting, setConnecting] = useState(false)

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

  const handleOpenChange = (newOpen: boolean) => {
    if (linking || connecting) return
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
          {credentials.length > 0 ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Contas disponíveis:</h4>
              {credentials.map((credential) => (
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
                        {credential.name && (
                          <p className="text-xs text-muted-foreground mt-1">{credential.name}</p>
                        )}
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
          ) : (
            <div className="text-center py-6">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h4 className="font-medium mb-2">Nenhuma conta conectada</h4>
              <p className="text-sm text-muted-foreground">
                Conecte uma conta Google para sincronizar eventos de calendário.
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleConnectNew}
              disabled={connecting || linking}
            >
              <Plus className="h-4 w-4" />
              {connecting ? 'Conectando...' : 'Conectar nova conta Google'}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={linking || connecting}
          >
            Cancelar
          </Button>
          {credentials.length > 0 && (
            <Button 
              onClick={handleLink}
              disabled={!selectedCredentialId || linking || connecting}
            >
              {linking ? 'Vinculando...' : 'Vincular Conta'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}