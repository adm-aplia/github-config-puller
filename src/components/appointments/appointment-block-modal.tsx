
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format, startOfDay, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useProfessionalProfiles } from "@/hooks/use-professional-profiles"
import { useAuth } from "@/components/auth-provider"
import { useGoogleIntegrations } from "@/hooks/use-google-integrations"

interface AppointmentBlockModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AppointmentBlockModal({ open, onOpenChange, onSuccess }: AppointmentBlockModalProps) {
  const [loading, setLoading] = useState(false)
  const [blockType, setBlockType] = useState("fullday") // "specific" or "fullday"
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [formData, setFormData] = useState({
    professional_profile_id: "",
    interval_minutes: 30,
    reason: ""
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

  // Helper function to send individual appointment to webhook
  const sendAppointmentToWebhook = async (queryObj: any) => {
    const payload = [{ query: JSON.stringify(queryObj) }]
    
    const response = await fetch('https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/agendamento-aplia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status}`)
    }

    // Add delay between requests
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  const generateTimeSlots = (start: Date, end: Date, intervalMinutes: number) => {
    const slots = []
    const current = new Date(start)
    
    while (current < end) {
      const slotEnd = new Date(current.getTime() + intervalMinutes * 60000)
      slots.push({
        start: new Date(current),
        end: slotEnd
      })
      current.setTime(current.getTime() + intervalMinutes * 60000)
    }
    
    return slots
  }

  const generateFullDaySlots = (startDate: Date, endDate: Date) => {
    const slots = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      // Generate a single full-day slot (00:00 to 23:59) for each day
      const slotStart = new Date(currentDate)
      slotStart.setHours(0, 0, 0, 0)
      
      const slotEnd = new Date(currentDate)
      slotEnd.setHours(23, 59, 59, 999)
      
      slots.push({
        start: slotStart,
        end: slotEnd
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return slots
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation based on block type
    if (blockType === "specific") {
      if (!startDate || !endDate || !startTime || !endTime || !formData.professional_profile_id) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive"
        })
        return
      }
    } else {
      if (!startDate || !endDate || !formData.professional_profile_id) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, selecione o profissional e as datas.",
          variant: "destructive"
        })
        return
      }
    }

    // Validate end date is not before start date
    if (endDate < startDate) {
      toast({
        title: "Data inválida",
        description: "A data final deve ser posterior à data inicial.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      let slots = []

      if (blockType === "fullday") {
        // Generate full day slots
        slots = generateFullDaySlots(startDate, endDate)
      } else {
        // Generate specific time slots
        const [startHours, startMinutes] = startTime.split(':')
        const [endHours, endMinutes] = endTime.split(':')
        
        const startDateTime = new Date(startDate)
        startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0)
        
        const endDateTime = new Date(endDate)
        endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0)

        // Validate end time is after start time for same day
        if (startDate.toDateString() === endDate.toDateString() && endDateTime <= startDateTime) {
          toast({
            title: "Horário inválido",
            description: "O horário final deve ser posterior ao horário inicial.",
            variant: "destructive"
          })
          return
        }

        slots = generateTimeSlots(startDateTime, endDateTime, formData.interval_minutes)
      }
      
      if (slots.length === 0) {
        toast({
          title: "Nenhum slot gerado",
          description: "Verifique os horários informados.",
          variant: "destructive"
        })
        return
      }

      // Limit number of slots to prevent overload
      if (slots.length > 500) {
        toast({
          title: "Muitos bloqueios",
          description: "Limite máximo de 500 slots. Reduza o período ou aumente o intervalo.",
          variant: "destructive"
        })
        return
      }

      const myEmail = resolveLinkedGoogleEmail(formData.professional_profile_id)
      if (!myEmail) {
        toast({
          title: "Aviso",
          description: "Nenhuma conta Google vinculada. Os bloqueios serão criados sem sincronização com o Google Calendar.",
        })
      }

      // Send each slot as a separate webhook request
      let successCount = 0
      let errorCount = 0

      for (let i = 0; i < slots.length; i++) {
        const slot = slots[i]
        
        // Format slot start date
        const year = slot.start.getFullYear()
        const month = String(slot.start.getMonth() + 1).padStart(2, '0')
        const day = String(slot.start.getDate()).padStart(2, '0')
        const hour = String(slot.start.getHours()).padStart(2, '0')
        const minute = String(slot.start.getMinutes()).padStart(2, '0')
        const formattedDate = `${year}-${month}-${day} ${hour}:${minute}:00+00`

        const slotEndFormatted = format(slot.end, "HH:mm", { locale: ptBR })
        
        const queryObj = {
          action: "create",
          user_id: user?.id,
          agent_id: formData.professional_profile_id,
          patient_name: "Bloqueado",
          patient_phone: "",
          patient_email: "",
          appointment_date: formattedDate,
          status: "blocked",
          appointment_type: "blocked",
          summary: "Bloqueio de agenda",
          notes: `${formData.reason ? `Motivo: ${formData.reason}. ` : ""}${blockType === "fullday" ? "Dia inteiro bloqueado" : `Horário bloqueado até ${slotEndFormatted}`}.`,
          ...(blockType === "fullday" && { 
            full_day: true,
            duration_minutes: 1440 
          }),
          ...(myEmail && { my_email: myEmail })
        }

        try {
          await sendAppointmentToWebhook(queryObj)
          successCount++
        } catch (error) {
          console.error(`Error sending slot ${i + 1}:`, error)
          errorCount++
        }
      }

      // Show results
      if (successCount > 0) {
        toast({
          title: "Bloqueios criados",
          description: `${successCount} bloqueio(s) criado(s) com sucesso${errorCount > 0 ? `. ${errorCount} erro(s).` : '.'}`,
        })
      } else {
        toast({
          title: "Erro ao criar bloqueios",
          description: "Não foi possível criar os bloqueios. Tente novamente.",
          variant: "destructive"
        })
      }
      
      // Reset form on success
      if (successCount > 0) {
        setBlockType("fullday")
        setFormData({
          professional_profile_id: "",
          interval_minutes: 30,
          reason: ""
        })
        setStartDate(undefined)
        setEndDate(undefined)
        setStartTime("")
        setEndTime("")
        
        onOpenChange(false)
        
        // Call success callback after delay to allow backend processing
        if (onSuccess) {
          setTimeout(onSuccess, 1500)
        }
      }
      
    } catch (error) {
      console.error('Error creating time blocks:', error)
      toast({
        title: "Erro ao criar bloqueios",
        description: "Não foi possível criar os bloqueios. Tente novamente.",
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
          <DialogTitle>Bloquear Horários</DialogTitle>
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

            {/* Block Type Selection */}
            <div className="md:col-span-2">
              <Label>Tipo de bloqueio</Label>
              <RadioGroup
                value={blockType}
                onValueChange={setBlockType}
                className="flex flex-col space-y-2 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fullday" id="fullday" />
                  <Label htmlFor="fullday" className="text-sm font-normal">
                    Dia inteiro
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific" id="specific" />
                  <Label htmlFor="specific" className="text-sm font-normal">
                    Período específico
                  </Label>
                </div>
              </RadioGroup>
              {blockType === "fullday" && (
                <p className="text-xs text-muted-foreground mt-2">
                  Criará um único bloco de dia inteiro para cada data selecionada.
                </p>
              )}
            </div>

            {/* Date Range */}
            <div>
              <Label>Data Inicial *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < startOfDay(new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Data Final *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < startOfDay(new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time and Interval - only for specific period */}
            {blockType === "specific" && (
              <>
                <div>
                  <Label htmlFor="start_time">Horário Inicial *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_time">Horário Final *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>

                {/* Interval */}
                <div className="md:col-span-2">
                  <Label htmlFor="interval_minutes">Intervalo</Label>
                  <Select
                    value={formData.interval_minutes.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, interval_minutes: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutos</SelectItem>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="60">1 hora</SelectItem>
                      <SelectItem value="120">2 horas</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Define o tamanho de cada slot de bloqueio enviado
                  </p>
                </div>
              </>
            )}

            {/* Reason */}
            <div className="md:col-span-2">
              <Label htmlFor="reason">Motivo/Observação</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Motivo do bloqueio (opcional)"
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
              {loading ? "Criando bloqueios..." : "Bloquear Horários"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
