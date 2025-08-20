
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
    if (!open || !instanceId) return;
    
    // More frequent polling when QR dialog is open (every 5 seconds)
    const interval = setInterval(async () => {
      try {
        // Check DB for status and potential QR updates
        const { data } = await supabase
          .from('whatsapp_instances')
          .select('status, qr_code')
          .eq('id', instanceId)
          .single();

        if (data?.qr_code && data.qr_code !== qrCode) {
          const dataUrl = data.qr_code.startsWith('data:image') ? data.qr_code : await QRCode.toDataURL(data.qr_code);
          setQrImage(dataUrl);
        }

        if (data?.status === 'connected') {
          console.log('[QrCodeDialog] Instance connected, fetching instance info');
          
          // Fetch instance info to get phone number and sync with profile
          if (instanceSlug) {
            try {
              const { data: infoData } = await supabase.functions.invoke('evolution-manager', {
                body: { action: 'fetch_instance_info', instanceName: instanceSlug }
              });
              
              if (infoData?.success && infoData.phone_number) {
                // Update the WhatsApp instance with phone number and profile info
                await supabase
                  .from('whatsapp_instances')
                  .update({
                    phone_number: infoData.phone_number,
                    profile_picture_url: infoData.profile_picture_url,
                    display_name: infoData.display_name
                  })
                  .eq('id', instanceId);
                
                // If this instance has a linked profile, update the profile's phone number
                const { data: instanceData } = await supabase
                  .from('whatsapp_instances')
                  .select('professional_profile_id')
                  .eq('id', instanceId)
                  .single();
                
                if (instanceData?.professional_profile_id) {
                  await supabase
                    .from('professional_profiles')
                    .update({ phonenumber: infoData.phone_number })
                    .eq('id', instanceData.professional_profile_id);
                }
              }
            } catch (error) {
              console.error('[QrCodeDialog] Failed to fetch instance info:', error);
            }
          }
          
          onConnected?.();
          onOpenChange(false);
        }
      } catch (e) {
        console.error('[QrCodeDialog] polling error', e);
      }
    }, 5000); // 5 seconds when dialog is open

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
