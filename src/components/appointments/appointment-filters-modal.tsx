import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useProfessionalProfiles } from "@/hooks/use-professional-profiles"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface AppointmentFilters {
  status: string[]
  professionalIds: string[]
  dateFrom: Date | undefined
  dateTo: Date | undefined
  appointmentType: string
}

interface AppointmentFiltersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: AppointmentFilters
  onFiltersChange: (filters: AppointmentFilters) => void
  onApplyFilters: () => void
}

const statusOptions = [
  { value: "confirmed", label: "Confirmado" },
  { value: "rescheduled", label: "Remarcado" },
  { value: "cancelled", label: "Cancelado" },
]

const appointmentTypeOptions = [
  { value: "all", label: "Todos os tipos" },
  { value: "consultation", label: "Consulta" },
  { value: "followup", label: "Retorno" },
  { value: "exam", label: "Exame" },
  { value: "procedure", label: "Procedimento" },
  { value: "other", label: "Outro" },
]

export function AppointmentFiltersModal({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onApplyFilters
}: AppointmentFiltersModalProps) {
  const { profiles } = useProfessionalProfiles()
  const [localFilters, setLocalFilters] = useState<AppointmentFilters>(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters, open])

  const handleStatusToggle = (statusValue: string) => {
    const newStatus = localFilters.status.includes(statusValue)
      ? localFilters.status.filter(s => s !== statusValue)
      : [...localFilters.status, statusValue]
    
    setLocalFilters(prev => ({ ...prev, status: newStatus }))
  }

  const handleProfessionalToggle = (professionalId: string) => {
    const newProfessionals = localFilters.professionalIds.includes(professionalId)
      ? localFilters.professionalIds.filter(id => id !== professionalId)
      : [...localFilters.professionalIds, professionalId]
    
    setLocalFilters(prev => ({ ...prev, professionalIds: newProfessionals }))
  }

  const handleClearAll = () => {
    const clearedFilters: AppointmentFilters = {
      status: [],
      professionalIds: [],
      dateFrom: undefined,
      dateTo: undefined,
      appointmentType: "all"
    }
    setLocalFilters(clearedFilters)
  }

  const handleApply = () => {
    onFiltersChange(localFilters)
    onApplyFilters()
    onOpenChange(false)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (localFilters.status.length > 0) count++
    if (localFilters.professionalIds.length > 0) count++
    if (localFilters.dateFrom || localFilters.dateTo) count++
    if (localFilters.appointmentType !== "all") count++
    return count
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros Avançados de Agendamentos
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} ativo{getActiveFiltersCount() > 1 ? 's' : ''}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status do Agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={localFilters.status.length === 0 ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setLocalFilters(prev => ({ ...prev, status: [] }))}
                >
                  Total
                  {localFilters.status.length === 0 && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
                {statusOptions.map((status) => (
                  <Badge
                    key={status.value}
                    variant={localFilters.status.includes(status.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleStatusToggle(status.value)}
                  >
                    {status.label}
                    {localFilters.status.includes(status.value) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Profissionais */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Profissionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profiles.map((profile) => (
                  <Badge
                    key={profile.id}
                    variant={localFilters.professionalIds.includes(profile.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleProfessionalToggle(profile.id)}
                  >
                    {profile.fullname}
                    {localFilters.professionalIds.includes(profile.id) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Período */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !localFilters.dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.dateFrom ? (
                          format(localFilters.dateFrom, "PPP", { locale: ptBR })
                        ) : (
                          "Selecione uma data"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.dateFrom}
                        onSelect={(date) => setLocalFilters(prev => ({ ...prev, dateFrom: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !localFilters.dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.dateTo ? (
                          format(localFilters.dateTo, "PPP", { locale: ptBR })
                        ) : (
                          "Selecione uma data"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.dateTo}
                        onSelect={(date) => setLocalFilters(prev => ({ ...prev, dateTo: date }))}
                        initialFocus
                        disabled={(date) => 
                          localFilters.dateFrom ? date < localFilters.dateFrom : false
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tipo de Agendamento */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tipo de Agendamento</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={localFilters.appointmentType} 
                onValueChange={(value) => setLocalFilters(prev => ({ ...prev, appointmentType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleClearAll}>
            Limpar Filtros
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApply}>
              Aplicar Filtros ({getActiveFiltersCount()})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}