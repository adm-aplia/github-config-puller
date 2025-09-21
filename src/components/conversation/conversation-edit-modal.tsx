
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useProfessionalProfiles } from "@/hooks/use-professional-profiles"
import { Conversation } from "@/hooks/use-conversations"
import { Loader2 } from "lucide-react"
import { applyMask } from "@/lib/masks"

interface ConversationEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversation: Conversation | null
  onSaved: () => void
  onUpdate: (id: string, data: Partial<Conversation>) => Promise<boolean>
}

export function ConversationEditModal({ 
  open, 
  onOpenChange, 
  conversation, 
  onSaved, 
  onUpdate 
}: ConversationEditModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    contact_name: "",
    contact_phone: "",
    agent_id: ""
  })
  
  const { profiles } = useProfessionalProfiles()
  const { toast } = useToast()

  // Sync form data when conversation changes
  useEffect(() => {
    console.log('ConversationEditModal useEffect', { open, conversation });
    if (open && conversation) {
      setFormData({
        contact_name: conversation.contact_name || "",
        contact_phone: conversation.contact_phone || "",
        agent_id: conversation.agent_id || "none"
      })
    }
  }, [open, conversation])

  const handleSave = async () => {
    if (!conversation) return
    
    setLoading(true)
    try {
      const updateData: Partial<Conversation> = {
        contact_name: formData.contact_name.trim() || null,
        contact_phone: formData.contact_phone.replace(/\D/g, ''), // Store clean phone number
        agent_id: formData.agent_id === "none" ? null : formData.agent_id || null
      }

      const success = await onUpdate(conversation.id, updateData)
      
      if (success) {
        toast({
          title: "Conversa atualizada",
          description: "As informações da conversa foram atualizadas com sucesso.",
        })
        onSaved()
        onOpenChange(false)
      }
    } catch (error) {
      console.error('Error updating conversation:', error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a conversa.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] z-[60]">
        <DialogHeader>
          <DialogTitle>Editar Conversa</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="contact-name">Nome do Contato</Label>
            <Input
              id="contact-name"
              value={formData.contact_name}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
              placeholder="Digite o nome do contato"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="contact-phone">Telefone</Label>
            <Input
              id="contact-phone"
              value={formData.contact_phone}
              onChange={(e) => {
                const maskedValue = applyMask.phone(e.target.value);
                setFormData(prev => ({ ...prev, contact_phone: maskedValue }));
              }}
              placeholder="(11) 99999-9999"
              required
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="agent">Assistente Responsável</Label>
            <Select
              value={formData.agent_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, agent_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um assistente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum assistente</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.fullname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !formData.contact_phone.trim()}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
