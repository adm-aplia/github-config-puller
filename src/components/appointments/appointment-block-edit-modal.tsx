import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { useState, useEffect } from "react"
import { Appointment } from "@/hooks/use-appointments"
import { cn } from "@/lib/utils"
import { useProfessionalProfiles } from "@/hooks/use-professional-profiles"

interface AppointmentBlockEditModalProps {
  appointment: Appointment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (appointmentId: string, appointmentData: Partial<Appointment>) => Promise<void>
}

export function AppointmentBlockEditModal({ appointment, open, onOpenChange, onUpdate }: AppointmentBlockEditModalProps) {
  const { profiles: professionalProfiles } = useProfessionalProfiles()
  const [loading, setLoading] = useState(false)
  const [blockType, setBlockType] = useState<'fullday' | 'specific'>('fullday')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("18:00")
  const [selectedProfessional, setSelectedProfessional] = useState("")
  const [reason, setReason] = useState("")

  // Sync states when modal opens or appointment changes
  useEffect(() => {
    if (open && appointment) {
      const appointmentDate = new Date(appointment.appointment_date)
      setSelectedDate(appointmentDate)
      setEndDate(appointmentDate)
      
      if (appointment.all_day) {
        setBlockType('fullday')
      } else {
        setBlockType('specific')
        setStartTime(format(appointmentDate, "HH:mm"))
        
        // Calculate end time from duration
        const endDateTime = new Date(appointmentDate)
        endDateTime.setMinutes(endDateTime.getMinutes() + (appointment.duration_minutes || 60))
        setEndTime(format(endDateTime, "HH:mm"))
      }
      
      setSelectedProfessional(appointment.professional_profile_id || "")
      setReason(appointment.notes || "")
    }
  }, [open, appointment?.id])

  if (!appointment) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate) return

    setLoading(true)
    try {
      let appointmentDateTime: Date
      let duration: number

      if (blockType === 'fullday') {
        // Full day block - set to start of day
        appointmentDateTime = new Date(selectedDate)
        appointmentDateTime.setHours(0, 0, 0, 0)
        duration = 24 * 60 // Full day in minutes
      } else {
        // Specific time block
        const [startHours, startMinutes] = startTime.split(':').map(Number)
        const [endHours, endMinutes] = endTime.split(':').map(Number)
        
        appointmentDateTime = new Date(selectedDate)
        appointmentDateTime.setHours(startHours, startMinutes, 0, 0)
        
        // Calculate duration
        const start = new Date(appointmentDateTime)
        const end = new Date(appointmentDateTime)
        end.setHours(endHours, endMinutes, 0, 0)
        duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60))
      }

      await onUpdate(appointment.id, {
        appointment_date: appointmentDateTime.toISOString(),
        professional_profile_id: selectedProfessional || null,
        appointment_type: "blocked",
        status: "blocked",
        duration_minutes: duration,
        all_day: blockType === 'fullday',
        notes: reason,
        patient_name: "Bloqueio",
        patient_phone: "000000000"
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating block:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Bloqueio</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="professional">Profissional</Label>
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os profissionais</SelectItem>
                {professionalProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.fullname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3">
            <Label>Tipo de Bloqueio</Label>
            <RadioGroup value={blockType} onValueChange={(value: 'fullday' | 'specific') => setBlockType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fullday" id="fullday" />
                <Label htmlFor="fullday">Dia inteiro</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="specific" id="specific" />
                <Label htmlFor="specific">Horário específico</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid gap-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {blockType === 'specific' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start-time">Horário de Início</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end-time">Horário de Término</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {appointment.notes?.includes('recorrência') && (
            <div className="grid gap-2">
              <Label>Recorrência (somente leitura)</Label>
              <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                Bloqueio com recorrência - não editável
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="reason">Motivo do Bloqueio</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Digite o motivo do bloqueio..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}