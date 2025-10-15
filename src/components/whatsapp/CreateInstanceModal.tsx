
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface CreateInstanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (displayName: string) => void | Promise<void>;
}

export function CreateInstanceModal({ open, onOpenChange, onSubmit }: CreateInstanceModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || submitting) return;
    
    try {
      setSubmitting(true);
      await onSubmit(displayName.trim());
      setDisplayName("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!submitting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setDisplayName("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-xl">Adicionar número do WhatsApp</DialogTitle>
            <DialogDescription>
              Informe o nome de exibição que será mostrado no painel.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome de exibição</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting || !displayName.trim()}>
                {submitting ? "Criando..." : "Criar"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
