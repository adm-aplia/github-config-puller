import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useAuth } from "@/components/auth-provider"
import { useProfessionalProfiles } from "@/hooks/use-professional-profiles"
import { useAppointments } from "@/hooks/use-appointments"
import { useToast } from "@/hooks/use-toast"
import { 
  Calendar as CalendarIcon, 
  Plus, 
  RefreshCw, 
  Filter,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  MoreHorizontal,
  Eye,
  Edit,
  UserCheck,
  Clock4,
  Repeat,
  X,
  UserX,
  Trash2,
  Download,
  HelpCircle
} from "lucide-react"
import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Appointment } from "@/hooks/use-appointments"
import { AppointmentViewModal } from "@/components/appointments/appointment-view-modal"
import { AppointmentEditModal } from "@/components/appointments/appointment-edit-modal"
import { AppointmentRescheduleModal } from "@/components/appointments/appointment-reschedule-modal"
import { cn } from "@/lib/utils"

const mockAppointments = [
  { id: 1, patient: "Maria Silva", time: "09:00", status: "confirmed", type: "Consulta", date: new Date(2025, 7, 4) },
  { id: 2, patient: "João Santos", time: "10:30", status: "pending", type: "Retorno", date: new Date(2025, 7, 4) },
  { id: 3, patient: "Ana Costa", time: "14:00", status: "completed", type: "Consulta", date: new Date(2025, 7, 5) },
  { id: 4, patient: "Pedro Lima", time: "15:30", status: "cancelled", type: "Consulta", date: new Date(2025, 7, 11) },
  { id: 5, patient: "Teste", time: "09:00", status: "pending", type: "Consulta", date: new Date(2025, 7, 15) },
  { id: 6, patient: "Outro Teste", time: "10:00", status: "confirmed", type: "Consulta", date: new Date(2025, 7, 15) },
  { id: 7, patient: "Consulta Teste", time: "14:00", status: "confirmed", type: "Consulta", date: new Date(2025, 7, 20) },
]

const stats = [
  { title: "Total de Agendamentos", value: "24", icon: CalendarIcon, color: "default" },
  { title: "Agendados", value: "8", percentage: "33%", icon: Clock, color: "secondary" },
  { title: "Confirmados", value: "12", percentage: "50%", icon: CheckCircle, color: "default" },
  { title: "Concluídos", value: "3", percentage: "13%", icon: CheckCircle, color: "default" },
  { title: "Cancelados", value: "1", percentage: "4%", icon: XCircle, color: "destructive" },
  { title: "Remarcados", value: "0", percentage: "0%", icon: RotateCcw, color: "default" },
]

const getStatusBadge = (status: string) => {
  const statusConfig = {
    confirmed: { label: "Confirmado", variant: "default" as const },
    pending: { label: "Pendente", variant: "secondary" as const },
    completed: { label: "Concluído", variant: "default" as const },
    cancelled: { label: "Cancelado", variant: "destructive" as const },
  }
  return statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "default" as const }
}

export default function AgendamentosPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [viewPeriod, setViewPeriod] = useState("today")
  const [selectedProfessional, setSelectedProfessional] = useState("all")
  const [isGoogleEventsDialogOpen, setIsGoogleEventsDialogOpen] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [selectedProfessionalForImport, setSelectedProfessionalForImport] = useState<string>("")
  const [isImporting, setIsImporting] = useState(false)
  
  const { user } = useAuth()
  const { profiles, loading: profilesLoading } = useProfessionalProfiles()
  const { appointments, loading: appointmentsLoading, fetchAppointments, createAppointmentsFromGoogleEvents, updateAppointment, updateAppointmentStatus, rescheduleAppointment, deleteAppointment } = useAppointments()
  const { toast } = useToast()

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointment_date)
      return aptDate.toDateString() === date.toDateString()
    })
  }

  // Get appointments for selected date
  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'cancelled':
        return 'bg-red-500'
      case 'completed':
        return 'bg-green-500'
      default:
        return 'bg-yellow-500'
    }
  }

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus)
      await fetchAppointments()
      toast({
        title: 'Status atualizado',
        description: 'O status do agendamento foi atualizado com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status do agendamento.',
        variant: 'destructive',
      })
    }
  }

  const handleEditAppointment = async (appointmentData: Partial<Appointment>) => {
    if (!selectedAppointment) return
    
    try {
      await updateAppointment(selectedAppointment.id, appointmentData)
      await fetchAppointments()
      toast({
        title: 'Agendamento atualizado',
        description: 'O agendamento foi atualizado com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o agendamento.',
        variant: 'destructive',
      })
    }
  }

  const handleReschedule = async (appointmentId: string, newDateTime: string) => {
    try {
      await rescheduleAppointment(appointmentId, newDateTime)
      await fetchAppointments()
      toast({
        title: 'Agendamento remarcado',
        description: 'O agendamento foi remarcado com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao remarcar',
        description: 'Não foi possível remarcar o agendamento.',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) {
      return
    }
    
    try {
      await deleteAppointment(appointmentId)
      await fetchAppointments()
      toast({
        title: 'Agendamento excluído',
        description: 'O agendamento foi excluído com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o agendamento.',
        variant: 'destructive',
      })
    }
  }

  // Function to pull Google Calendar events
  const handleGoogleEventsSync = async () => {
    if (!startDate || !endDate || !user?.email) return

    setIsImporting(true)

    const query = {
      my_email: user.email,
      calendarId: "primary",
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString()
    }

    try {
      const response = await fetch('https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/eventos-google-agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ query: JSON.stringify(query) }])
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data && data[0]?.response) {
          const events = JSON.parse(data[0].response)
          const eventsCount = await createAppointmentsFromGoogleEvents(events, selectedProfessionalForImport)
          
          alert(`Foram atualizados ${eventsCount} eventos`)
          setIsGoogleEventsDialogOpen(false)
          setStartDate(undefined)
          setEndDate(undefined)
        }
      }
    } catch (error) {
      console.error('Erro ao enviar eventos:', error)
      alert('Erro ao importar eventos do Google Agenda')
    } finally {
      setIsImporting(false)
    }
  }

  // Custom day content renderer
  const renderDayContent = (date: Date) => {
    const dayAppointments = getAppointmentsForDate(date)
    const appointmentCount = dayAppointments.length
    
    return (
      <div className="relative w-full h-full flex flex-col justify-between p-1">
        <span className="text-xs font-medium text-left">{date.getDate()}</span>
        {appointmentCount > 0 && (
          <div className="w-full">
            <div className="text-xs px-1 py-0.5 bg-gray-200 text-gray-700 rounded text-center font-medium">
              {appointmentCount} consulta{appointmentCount > 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Agendamentos</h1>
              <p className="text-sm text-muted-foreground">Estatísticas e calendário de agendamentos da sua clínica</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtrar
              </Button>
              <Button size="sm" className="flex items-center gap-2 bg-secondary hover:bg-secondary/90">
                <Plus className="h-4 w-4" />
                Novo Agendamento
              </Button>
            </div>
          </header>

          {/* Statistics Section */}
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold">Estatísticas de Agendamentos</h2>
                <p className="text-sm text-muted-foreground">Acompanhe o desempenho dos seus agendamentos</p>
              </div>
              <div className="flex items-center gap-2">
                <Tabs value={viewPeriod} onValueChange={setViewPeriod}>
                  <TabsList>
                    <TabsTrigger value="today">Hoje</TabsTrigger>
                    <TabsTrigger value="7days">Últimos 7 dias</TabsTrigger>
                    <TabsTrigger value="30days">Últimos 30 dias</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex items-center gap-2 text-sm border rounded-md px-3 py-1">
                  <CalendarIcon className="h-4 w-4" />
                  01/08/2025 - 31/08/2025
                </div>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">{stat.title}</span>
                        <span className="text-xl font-bold">{stat.value}</span>
                        {stat.percentage && (
                          <Badge variant={stat.color as any} className="w-fit mt-1 text-xs">
                            {stat.percentage}
                          </Badge>
                        )}
                      </div>
                      <stat.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Calendar and Appointments Section */}
          <div className="space-y-4">
            {/* Calendar */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      Calendário de Agendamentos
                    </CardTitle>
                    <CardDescription>Visualize e gerencie todos os agendamentos</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                      <SelectTrigger className="w-56">
                        <SelectValue>
                          {selectedProfessional === "all" ? "Todos os profissionais" : 
                           profiles.find(p => p.id === selectedProfessional)?.fullname || "Profissional não encontrado"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os profissionais</SelectItem>
                        {profiles.map(profile => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.fullname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-1">
                      <Dialog open={isGoogleEventsDialogOpen} onOpenChange={setIsGoogleEventsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Eventos Google Agenda
                          </Button>
                        </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Importar Eventos do Google Agenda</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Data Inicial</label>
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
                                        {startDate ? format(startDate, "dd/MM/yyyy") : <span>Selecione a data inicial</span>}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                      <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={setStartDate}
                                        initialFocus
                                        className="pointer-events-auto"
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                
                                 <div className="space-y-2">
                                   <label className="text-sm font-medium">Data Final</label>
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
                                         {endDate ? format(endDate, "dd/MM/yyyy") : <span>Selecione a data final</span>}
                                       </Button>
                                     </PopoverTrigger>
                                     <PopoverContent className="w-auto p-0">
                                       <Calendar
                                         mode="single"
                                         selected={endDate}
                                         onSelect={setEndDate}
                                         initialFocus
                                         className="pointer-events-auto"
                                       />
                                     </PopoverContent>
                                   </Popover>
                                 </div>
                                 
                                 <div className="space-y-2">
                                   <label className="text-sm font-medium">Perfil Profissional</label>
                                   <Select value={selectedProfessionalForImport} onValueChange={setSelectedProfessionalForImport}>
                                     <SelectTrigger>
                                       <SelectValue placeholder="Selecione o perfil profissional" />
                                     </SelectTrigger>
                                     <SelectContent>
                                       {profiles.map(profile => (
                                         <SelectItem key={profile.id} value={profile.id}>
                                           {profile.fullname}
                                         </SelectItem>
                                       ))}
                                     </SelectContent>
                                   </Select>
                                 </div>
                                
                                <div className="flex gap-2 pt-4">
                                   <Button 
                                     onClick={handleGoogleEventsSync}
                                     disabled={!startDate || !endDate || !selectedProfessionalForImport || isImporting}
                                     className="flex-1"
                                   >
                                    {isImporting ? "Importando..." : "Importar Eventos"}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setIsGoogleEventsDialogOpen(false)}
                                    className="flex-1"
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                      </Dialog>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Use esse botão para puxar os eventos do seu google agenda</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="w-full">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="w-full rounded-md border"
                    locale={ptBR}
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                      month: "space-y-4 w-full",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex w-full",
                      head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] text-center",
                      row: "flex w-full mt-2",
                      cell: "h-16 w-full text-center text-sm p-0 relative border-r border-b border-gray-100 [&:has([aria-selected='true'])]:bg-red-500 [&:has([aria-selected='true'])]:text-white",
                      day: "h-16 w-full p-1 font-normal bg-transparent text-foreground cursor-pointer aria-selected:bg-red-500 aria-selected:text-white",
                      day_range_end: "day-range-end",
                      day_selected: "bg-red-500 text-white hover:bg-red-600 focus:bg-red-600",
                      day_today: "bg-transparent text-foreground",
                      day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                    components={{
                      DayContent: ({ date }) => renderDayContent(date)
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Appointments List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Agendamentos do Dia
                </CardTitle>
                <CardDescription>
                  {selectedDate ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione uma data"}
                  {selectedDateAppointments.length > 0 && (
                    <span className="ml-2 text-sm font-medium">
                      ({selectedDateAppointments.length} agendamento{selectedDateAppointments.length > 1 ? 's' : ''})
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {appointmentsLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  </div>
                ) : selectedDateAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum agendamento encontrado</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Não há agendamentos para {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : "esta data"}.
                    </p>
                    <Button size="sm" className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Novo Agendamento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateAppointments.map((appointment, index) => {
                      const statusBadge = getStatusBadge(appointment.status)
                      const appointmentDate = new Date(appointment.appointment_date)
                      const timeString = appointmentDate.toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })
                      
                      return (
                        <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-8 ${getStatusColor(appointment.status)} rounded-full`}></div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{appointment.patient_name}</span>
                                <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock4 className="h-3 w-3" />
                                  {timeString}
                                </span>
                                <span>{appointment.appointment_type || 'Consulta'}</span>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[180px] z-50 bg-background border shadow-lg">
                              <DropdownMenuItem 
                                className="flex items-center gap-2 cursor-pointer whitespace-nowrap"
                                onClick={() => {
                                  setSelectedAppointment(appointment)
                                  setViewModalOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="flex items-center gap-2 cursor-pointer whitespace-nowrap"
                                onClick={() => {
                                  setSelectedAppointment(appointment)
                                  setEditModalOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              {appointment.status !== 'confirmed' && (
                                <DropdownMenuItem 
                                  className="flex items-center gap-2 cursor-pointer whitespace-nowrap"
                                  onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}
                                >
                                  <UserCheck className="h-4 w-4" />
                                  Confirmar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="flex items-center gap-2 cursor-pointer whitespace-nowrap"
                                onClick={() => {
                                  setSelectedAppointment(appointment)
                                  setRescheduleModalOpen(true)
                                }}
                              >
                                <Repeat className="h-4 w-4" />
                                Remarcar
                              </DropdownMenuItem>
                              {appointment.status !== 'cancelled' && (
                                <DropdownMenuItem 
                                  className="flex items-center gap-2 text-destructive cursor-pointer whitespace-nowrap"
                                  onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
                                >
                                  <UserX className="h-4 w-4" />
                                  Cancelar
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="flex items-center gap-2 text-destructive cursor-pointer whitespace-nowrap"
                                onClick={() => handleDeleteAppointment(appointment.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AppointmentViewModal
        appointment={selectedAppointment}
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
      />
      
      <AppointmentEditModal
        appointment={selectedAppointment}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSave={handleEditAppointment}
      />
      
      <AppointmentRescheduleModal
        appointment={selectedAppointment}
        open={rescheduleModalOpen}
        onOpenChange={setRescheduleModalOpen}
        onReschedule={handleReschedule}
      />
    </DashboardLayout>
  )
}