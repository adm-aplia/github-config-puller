import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfessionalProfiles } from "@/hooks/use-professional-profiles";
import { User } from "lucide-react";

interface AssignProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (profileId: string) => void;
  currentProfileId?: string;
}

export function AssignProfileModal({ open, onOpenChange, onSubmit, currentProfileId }: AssignProfileModalProps) {
  const [selectedProfileId, setSelectedProfileId] = useState(currentProfileId || "");
  const [submitting, setSubmitting] = useState(false);
  const { profiles, loading } = useProfessionalProfiles();

  const handleSubmit = async () => {
    if (!selectedProfileId) return;
    
    setSubmitting(true);
    try {
      await onSubmit(selectedProfileId);
      onOpenChange(false);
      setSelectedProfileId("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedProfileId(currentProfileId || "");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atribuir Perfil</DialogTitle>
          <DialogDescription>
            Selecione um perfil profissional para vincular a este número do WhatsApp.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Perfil Profissional</label>
            <Select value={selectedProfileId} onValueChange={setSelectedProfileId} disabled={loading}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder={loading ? "Carregando..." : "Selecione um perfil"} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {profiles.map((profile) => (
                  <SelectItem 
                    key={profile.id} 
                    value={profile.id}
                    className="hover:bg-muted focus:bg-muted data-[state=checked]:bg-muted text-foreground focus:text-foreground data-[state=checked]:text-foreground"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{profile.fullname}</div>
                        <div className="text-xs text-muted-foreground">{profile.specialty}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedProfileId || submitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {submitting ? "Atribuindo..." : "Atribuir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}