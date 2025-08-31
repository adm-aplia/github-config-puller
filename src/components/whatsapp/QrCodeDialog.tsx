
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instanceName?: string; // Display name chosen by the user
  qrCode?: string | null;
  instanceId?: string; // DB id for polling status/qr updates
  instanceSlug?: string; // Evolution instance_name for refresh action
  onConnected?: () => void; // callback to refresh list
}

export function QrCodeDialog({ open, onOpenChange, instanceName, qrCode, instanceId, instanceSlug, onConnected }: QrCodeDialogProps) {
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

  useEffect(() => {
    if (!open || !instanceId || !instanceSlug) return;

    const interval = setInterval(async () => {
      try {
        // mantém comportamento de atualizar QR do DB
        const { data: dbData } = await supabase
          .from('whatsapp_instances')
          .select('status, qr_code')
          .eq('id', instanceId)
          .single();

        if (dbData?.qr_code && dbData.qr_code !== qrCode) {
          const dataUrl = dbData.qr_code.startsWith('data:image')
            ? dbData.qr_code
            : await QRCode.toDataURL(dbData.qr_code);
          setQrImage(dataUrl);
        }

        // consulta Evolution diretamente
        const { data: info } = await supabase.functions.invoke('evolution-manager', {
          body: { action: 'fetch_instance_info', instanceName: instanceSlug }
        });

        if (info?.success && (info.isConnected || info.phone_number)) {
          const update: any = {
            webhook_url: 'https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/aplia'
          };

          if (info.isConnected) {
            update.status = 'connected';
            update.last_connected_at = new Date().toISOString();
          }
          if (info.phone_number) {
            const n = info.phone_number.replace(/\D/g, '');
            update.phone_number = n;

            // refletir no perfil vinculado
            const { data: instRow } = await supabase
              .from('whatsapp_instances')
              .select('professional_profile_id')
              .eq('id', instanceId)
              .single();

            if (instRow?.professional_profile_id) {
              await supabase
                .from('professional_profiles')
                .update({ phonenumber: n })
                .eq('id', instRow.professional_profile_id);
            }
          }
          if (info.profile_picture_url) update.profile_picture_url = info.profile_picture_url;
          if (info.display_name) update.profile_name = info.display_name; // Use profile_name for real WhatsApp name

          await supabase.from('whatsapp_instances').update(update).eq('id', instanceId);
          onConnected?.();
          onOpenChange(false);
        }
      } catch (e) {
        console.error('[QrCodeDialog] polling error', e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [open, instanceId, instanceSlug, qrCode, onConnected, onOpenChange]);

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
            <div className="w-64 h-64 border rounded bg-gray-100 flex items-center justify-center">
              <div className="text-sm text-muted-foreground text-center">
                Gerando QR Code...
              </div>
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground text-center">
          O status será atualizado automaticamente quando conectar.
        </div>
      </DialogContent>
    </Dialog>
  );
}
