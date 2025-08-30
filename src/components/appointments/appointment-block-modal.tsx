
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
import { format, startOfDay, addDays, addWeeks } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { useProfessionalProfiles } from "@/hooks/use-professional-profiles"
import { useAuth } from "@/components/auth-provider"
import { useGoogleIntegrations } from "@/hooks/use-google-integrations"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"

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
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState("daily") // "daily" or "weekly"
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([])
  const [formData, setFormData] = useState({
    professional_profile_id: "",
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

  // Helper function to generate dates based on recurrence
  const generateRecurringDates = (startDate: Date, endDate: Date): Date[] => {
    const dates = []
    const current = new Date(startDate)
    
    if (!isRecurring) {
      // No recurrence, just generate dates between start and end
      while (current <= endDate) {
        dates.push(new Date(current))
        current.setDate(current.getDate() + 1)
      }
    } else if (recurrenceType === "daily") {
      // Daily recurrence
      while (current <= endDate) {
        dates.push(new Date(current))
        current.setDate(current.getDate() + 1)
      }
    } else if (recurrenceType === "weekly") {
      // Weekly recurrence based on selected weekdays
      while (current <= endDate) {
        if (selectedWeekdays.includes(current.getDay())) {
          dates.push(new Date(current))
        }
        current.setDate(current.getDate() + 1)
      }
    }
    
    return dates
  }

  const generateSpecificTimeSlots = (dates: Date[], startTime: string, endTime: string) => {
    const slots = []
    const [startHours, startMinutes] = startTime.split(':')
    const [endHours, endMinutes] = endTime.split(':')
    
    dates.forEach(date => {
      const slotStart = new Date(date)
      slotStart.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0)
      
      const slotEnd = new Date(date)
      slotEnd.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0)
      
      slots.push({
        start: slotStart,
        end: slotEnd
      })
    })
    
    return slots
  }

  const generateFullDaySlots = (dates: Date[]) => {
    const slots = []
    
    dates.forEach(date => {
      const slotStart = new Date(date)
      slotStart.setHours(0, 0, 0, 0)
      
      const slotEnd = new Date(date)
      slotEnd.setHours(23, 59, 59, 999)
      
      slots.push({
        start: slotStart,
        end: slotEnd
      })
    })
    
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

    // Validate recurrence settings
    if (isRecurring && recurrenceType === "weekly" && selectedWeekdays.length === 0) {
      toast({
        title: "Dias da semana obrigatórios",
        description: "Para recorrência semanal, selecione pelo menos um dia da semana.",
        variant: "destructive"
      })
      return
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
      // Generate recurring dates first
      const dates = generateRecurringDates(startDate, endDate)
      
      if (dates.length === 0) {
        toast({
          title: "Nenhuma data válida",
          description: "Verifique as configurações de recorrência.",
          variant: "destructive"
        })
        return
      }

      let slots = []

      if (blockType === "fullday") {
        // Generate full day slots for each date
        slots = generateFullDaySlots(dates)
      } else {
        // Validate end time is after start time
        const [startHours, startMinutes] = startTime.split(':')
        const [endHours, endMinutes] = endTime.split(':')
        const startMinutesTotal = parseInt(startHours) * 60 + parseInt(startMinutes)
        const endMinutesTotal = parseInt(endHours) * 60 + parseInt(endMinutes)
        
        if (endMinutesTotal <= startMinutesTotal) {
          toast({
            title: "Horário inválido",
            description: "O horário final deve ser posterior ao horário inicial.",
            variant: "destructive"
          })
          return
        }

        // Generate specific time slots for each date
        slots = generateSpecificTimeSlots(dates, startTime, endTime)
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
          notes: `${formData.reason ? `Motivo: ${formData.reason}. ` : ""}${blockType === "fullday" ? "Dia inteiro bloqueado" : `Horário bloqueado de ${format(slot.start, "HH:mm")} até ${slotEndFormatted}`}${isRecurring ? ` (Recorrência: ${recurrenceType === "daily" ? "Diária" : "Semanal"})` : ""}.`,
          ...(blockType === "fullday" && { 
            full_day: true,
            duration_minutes: 1440 
          }),
          ...(blockType === "specific" && {
            duration_minutes: Math.round((slot.end.getTime() - slot.start.getTime()) / (1000 * 60))
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
          reason: ""
        })
        setStartDate(undefined)
        setEndDate(undefined)
        setStartTime("")
        setEndTime("")
        setIsRecurring(false)
        setRecurrenceType("daily")
        setSelectedWeekdays([])
        
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

            {/* Time - only for specific period */}
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
              </>
            )}

            {/* Recurrence Options */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
                <Label htmlFor="recurring">Bloqueio recorrente</Label>
              </div>
              
              {isRecurring && (
                <div className="mt-4 space-y-4">
                  <div>
                    <Label>Frequência</Label>
                    <Select
                      value={recurrenceType}
                      onValueChange={setRecurrenceType}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {recurrenceType === "weekly" && (
                    <div>
                      <Label>Dias da semana</Label>
                      <div className="grid grid-cols-7 gap-2 mt-2">
                        {[
                          { label: "Dom", value: 0 },
                          { label: "Seg", value: 1 },
                          { label: "Ter", value: 2 },
                          { label: "Qua", value: 3 },
                          { label: "Qui", value: 4 },
                          { label: "Sex", value: 5 },
                          { label: "Sáb", value: 6 }
                        ].map((day) => (
                          <div key={day.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`day-${day.value}`}
                              checked={selectedWeekdays.includes(day.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedWeekdays([...selectedWeekdays, day.value])
                                } else {
                                  setSelectedWeekdays(selectedWeekdays.filter(d => d !== day.value))
                                }
                              }}
                            />
                            <Label htmlFor={`day-${day.value}`} className="text-xs">
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

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
