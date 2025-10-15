import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Pen } from "lucide-react"

interface EditInstanceNameModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
  onSave: (newName: string) => void
}

export function EditInstanceNameModal({ 
  open, 
  onOpenChange, 
  currentName, 
  onSave 
}: EditInstanceNameModalProps) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setName(currentName)
    }
  }, [open, currentName])

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "O nome do número não pode estar vazio.",
        variant: "destructive",
      })
      return
    }

    if (name.trim() === currentName) {
      onOpenChange(false)
      return
    }

    setLoading(true)
    try {
      await onSave(name.trim())
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving name:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pen className="h-4 w-4" />
            Editar Nome do Número
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instance-name">Nome do Número</Label>
            <Input
              id="instance-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite o nome do número"
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Esta alteração é apenas cosmética e não afeta o número no WhatsApp
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading || !name.trim()}
          >
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}