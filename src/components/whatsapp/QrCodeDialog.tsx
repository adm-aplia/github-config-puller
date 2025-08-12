
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceName?: string;
  qrCode?: string | null;
}

export function QrCodeDialog({ open, onOpenChange, instanceName, qrCode }: QrCodeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code para conectar a instância {instanceName || ""} no WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="w-full flex items-center justify-center py-4">
          {qrCode ? (
            <img
              src={qrCode}
              alt="QR Code"
              className="w-64 h-64 border rounded bg-white"
            />
          ) : (
            <div className="text-sm text-muted-foreground">
              QR Code não disponível no momento.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
