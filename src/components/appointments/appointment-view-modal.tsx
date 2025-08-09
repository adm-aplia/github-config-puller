import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Phone, Mail, MapPin, FileText } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Appointment } from "@/hooks/use-appointments"

interface AppointmentViewModalProps {
  appointment: Appointment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AppointmentViewModal({ appointment, open, onOpenChange }: AppointmentViewModalProps) {
  if (!appointment) return null

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { variant: 'default' as const, label: 'Confirmado' }
      case 'pending':
        return { variant: 'secondary' as const, label: 'Pendente' }
      case 'cancelled':
        return { variant: 'destructive' as const, label: 'Cancelado' }
      case 'completed':
        return { variant: 'outline' as const, label: 'Concluído' }
      default:
        return { variant: 'secondary' as const, label: 'Pendente' }
    }
  }

  const statusBadge = getStatusBadge(appointment.status)
  const appointmentDate = new Date(appointment.appointment_date)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Detalhes do Agendamento
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{appointment.patient_name}</h3>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
          
          <div className="grid gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(appointmentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{format(appointmentDate, "HH:mm")}</span>
              {appointment.duration_minutes && (
                <span className="text-muted-foreground">
                  ({appointment.duration_minutes} minutos)
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.appointment_type || 'Consulta'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.patient_phone}</span>
            </div>
            
            {appointment.patient_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{appointment.patient_email}</span>
              </div>
            )}
            
            {appointment.notes && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Observações:</p>
                  <p className="text-muted-foreground">{appointment.notes}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <p>Criado em: {format(new Date(appointment.created_at), "dd/MM/yyyy 'às' HH:mm")}</p>
            <p>Atualizado em: {format(new Date(appointment.updated_at), "dd/MM/yyyy 'às' HH:mm")}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}