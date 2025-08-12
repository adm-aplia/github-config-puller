import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { MessageSquarePlus, QrCode } from "lucide-react";
interface CreateInstanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (displayName: string) => void | Promise<void>;
}

export function CreateInstanceModal({ open, onOpenChange, onSubmit }: CreateInstanceModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const progress = 50;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    try {
      setSubmitting(true);
      await onSubmit(displayName.trim());
      setDisplayName("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-xl">Criar nova instância</DialogTitle>
            <DialogDescription>
              Preencha as informações para criar sua instância do WhatsApp em 2 etapas.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="p-6 pt-2">
          <div className="w-full max-w-4xl mx-auto">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Etapa 1 de 2</span>
                <span className="text-sm text-muted-foreground">{progress}% concluído</span>
              </div>
              <div className="relative w-full overflow-hidden rounded-full h-2 bg-muted">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Steps */}
            <div className="mb-8">
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-2 min-w-max">
                  <button type="button" className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap bg-primary/10 text-primary border-2 border-primary/20">
                    <MessageSquarePlus className="h-4 w-4 flex-shrink-0" />
                    <span>Informações da Instância</span>
                  </button>
                  <button type="button" disabled className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap bg-muted text-muted-foreground border border-border cursor-not-allowed">
                    <QrCode className="h-4 w-4 flex-shrink-0" />
                    <span>Conexão</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm mb-6">
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MessageSquarePlus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Informações da Instância</h3>
                      <p className="text-sm text-muted-foreground">Dados básicos</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="displayName">Nome de exibição</Label>
                        <Input
                          id="displayName"
                          placeholder="Ex.: Clínica São Lucas"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* Footer actions */}
                    <div className="flex items-center justify-between">
                      <Button type="button" variant="outline" disabled>
                        Anterior
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={submitting}>
                          {submitting ? "Criando..." : "Próximo"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
