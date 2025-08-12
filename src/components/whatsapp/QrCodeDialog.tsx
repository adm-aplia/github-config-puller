
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceName?: string;
  qrCode?: string | null;
}

export function QrCodeDialog({ open, onOpenChange, instanceName, qrCode }: QrCodeDialogProps) {
  const [qrImage, setQrImage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function generate() {
      if (!qrCode) {
        if (active) setQrImage(null);
        return;
      }
      if (qrCode.startsWith("data:image")) {
        if (active) setQrImage(qrCode);
        return;
      }
      try {
        const dataUrl = await QRCode.toDataURL(qrCode);
        if (active) setQrImage(dataUrl);
      } catch (e) {
        console.error("[QrCodeDialog] Failed to render QR image", e);
        if (active) setQrImage(null);
      }
    }
    generate();
    return () => { active = false };
  }, [qrCode]);

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
          {qrImage ? (
            <img
              src={qrImage}
              alt={`QR Code para conectar ${instanceName || "instância"}`}
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
