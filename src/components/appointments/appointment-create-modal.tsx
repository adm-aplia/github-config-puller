import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useProfessionalProfiles } from "@/hooks/use-professional-profiles"
import { useAuth } from "@/components/auth-provider"
import { useGoogleIntegrations } from "@/hooks/use-google-integrations"
import { sendAppointmentWebhook } from "@/lib/n8n-proxy"

// Map Portuguese status to English for webhook
const mapStatusToEnglish = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'agendado': 'schedule',
    'confirmado': 'confirmed',
    'cancelled': 'cancelled',
    'blocked': 'blocked',
  };
  return statusMap[status] || status;
};

interface AppointmentCreateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AppointmentCreateModal({ open, onOpenChange, onSuccess }: AppointmentCreateModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [selectedTime, setSelectedTime] = useState("")
  const [formData, setFormData] = useState({
    professional_profile_id: "",
    patient_name: "",
    patient_phone: "",
    patient_email: "",
    appointment_type: "",
    duration: 60,
    status: "agendado",
    notes: ""
  })

  const { user } = useAuth()
  const { profiles } = useProfessionalProfiles()
  const { credentials, profileLinks } = useGoogleIntegrations()
  const { toast } = useToast()

  // Helper function to resolve Google email for selected professional
  const resolveLinkedGoogleEmail = (professionalId: string): string => {
    // Check if this professional is linked to a Google account
    const profileLink = profileLinks.find(link => link.professional_profile_id === professionalId)
    
    if (profileLink) {
      const credential = credentials.find(cred => cred.id === profileLink.google_credential_id)
      if (credential) {
        return credential.email
      }
    }
    
    // Fallback to first available Google credential if only one exists
    if (credentials.length === 1) {
      return credentials[0].email
    }
    
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDate || !selectedTime || !formData.patient_name || !formData.professional_profile_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':')
      const appointmentDate = new Date(selectedDate)
      appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      // Format as required: "YYYY-MM-DD HH:mm:ss+00"
      const year = appointmentDate.getFullYear()
      const month = String(appointmentDate.getMonth() + 1).padStart(2, '0')
      const day = String(appointmentDate.getDate()).padStart(2, '0')
      const hour = String(appointmentDate.getHours()).padStart(2, '0')
      const minute = String(appointmentDate.getMinutes()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${day} ${hour}:${minute}:00+00`

      // Format phone with +55 prefix if not already present
      let formattedPhone = formData.patient_phone.replace(/\D/g, '') // Remove non-digits
      if (formattedPhone && !formattedPhone.startsWith('55')) {
        formattedPhone = `+55${formattedPhone}`
      } else if (formattedPhone) {
        formattedPhone = `+${formattedPhone}`
      }

      const myEmail = resolveLinkedGoogleEmail(formData.professional_profile_id)
      if (!myEmail) {
        console.warn('No Google email found for professional profile, proceeding without Google sync')
      }

      // Create the webhook payload in the exact format requested
      const mappedStatus = mapStatusToEnglish(formData.status);
      console.log('[appointment-create] Status original:', formData.status, '→ Mapeado:', mappedStatus);
      
      const queryObj = {
        action: "create",
        user_id: user?.id,
        agent_id: formData.professional_profile_id,
        patient_name: formData.patient_name,
        patient_phone: formattedPhone,
        patient_email: formData.patient_email || "",
        appointment_date: formattedDate,
        duration_minutes: formData.duration,
        status: formData.status,
        summary: `${formData.appointment_type || 'Consulta'} com ${formData.patient_name}`,
        notes: formData.notes || `Paciente: ${formData.patient_name}. Telefone: ${formattedPhone}. E-mail: ${formData.patient_email || 'Não informado'}. Motivo: ${formData.appointment_type || 'consulta'}.`,
        ...(myEmail && { my_email: myEmail })
      }

      // Send to webhook via secure proxy
      console.log('Sending webhook payload:', queryObj)

      const result = await sendAppointmentWebhook(queryObj)

      if (result.success) {
        toast({
          title: "Agendamento criado",
          description: "O agendamento foi criado com sucesso.",
        })
        
        // Reset form
        setFormData({
          professional_profile_id: "",
          patient_name: "",
          patient_phone: "",
          patient_email: "",
          appointment_type: "",
          duration: 60,
          status: "agendado",
          notes: ""
        })
        setSelectedDate(undefined)
        setSelectedTime("")
        
        onOpenChange(false)
        onSuccess?.()
      } else {
        throw new Error(`Erro ao criar agendamento: ${result.status}`)
      }
    } catch (error) {
      toast({
        title: "Erro ao criar agendamento",
        description: "Não foi possível criar o agendamento. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Professional Selection */}
            <div className="md:col-span-2">
              <Label htmlFor="professional_profile_id">Profissional *</Label>
              <Select
                value={formData.professional_profile_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, professional_profile_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.fullname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Patient Information */}
            <div>
              <Label htmlFor="patient_name">Nome do Paciente *</Label>
              <Input
                id="patient_name"
                value={formData.patient_name}
                onChange={(e) => setFormData(prev => ({ ...prev, patient_name: e.target.value }))}
                placeholder="Nome completo do paciente"
                required
              />
            </div>

            <div>
              <Label htmlFor="patient_phone">Telefone</Label>
              <Input
                id="patient_phone"
                value={formData.patient_phone}
                onChange={(e) => setFormData(prev => ({ ...prev, patient_phone: e.target.value }))}
                placeholder="+55 41 99999-9999"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="patient_email">E-mail</Label>
              <Input
                id="patient_email"
                type="email"
                value={formData.patient_email}
                onChange={(e) => setFormData(prev => ({ ...prev, patient_email: e.target.value }))}
                placeholder="paciente@email.com"
              />
            </div>

            {/* Appointment Details */}
            <div>
              <Label htmlFor="appointment_type">Tipo de Consulta</Label>
              <Input
                id="appointment_type"
                value={formData.appointment_type}
                onChange={(e) => setFormData(prev => ({ ...prev, appointment_type: e.target.value }))}
                placeholder="Consulta de rotina"
              />
            </div>

            <div>
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                min="15"
                max="480"
              />
            </div>

            {/* Date and Time */}
            <div>
              <Label>Data do Agendamento *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < startOfDay(new Date())}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="time">Horário *</Label>
              <Input
                id="time"
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações adicionais sobre o agendamento"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Criando..." : "Criar Agendamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}