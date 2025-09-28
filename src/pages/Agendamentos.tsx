import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useAuth } from "@/components/auth-provider"
import { useProfessionalProfiles } from "@/hooks/use-professional-profiles"
import { useAppointments } from "@/hooks/use-appointments"
import { useToast } from "@/hooks/use-toast"
import { useGoogleIntegrations } from "@/hooks/use-google-integrations"
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
  HelpCircle,
  MoreVertical,
  Copy
} from "lucide-react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Appointment } from "@/hooks/use-appointments"
import { AppointmentViewModal } from "@/components/appointments/appointment-view-modal"
import { AppointmentEditModal } from "@/components/appointments/appointment-edit-modal"
import { AppointmentRescheduleModal } from "@/components/appointments/appointment-reschedule-modal"
import { AppointmentFiltersModal, AppointmentFilters } from "@/components/appointments/appointment-filters-modal"
import { AppointmentCreateModal } from "@/components/appointments/appointment-create-modal"
import { AppointmentBlockModal } from "@/components/appointments/appointment-block-modal"
import { AppointmentBlockEditModal } from "@/components/appointments/appointment-block-edit-modal"
import { cn } from "@/lib/utils"

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { label: "Confirmado", variant: "default" as const },
      scheduled: { label: "Agendado", variant: "secondary" as const },
      pending: { label: "Pendente", variant: "secondary" as const },
      completed: { label: "Concluído", variant: "default" as const },
      cancelled: { label: "Cancelado", variant: "destructive" as const },
      rescheduled: { label: "Remarcado", variant: "secondary" as const },
      blocked: { label: "Bloqueado", variant: "outline" as const },
    }
    return statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "default" as const }
  }

export default function AgendamentosPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [viewPeriod, setViewPeriod] = useState("last30days")
  const [selectedProfessional, setSelectedProfessional] = useState("all")
  // Estados removidos - não mais necessários com sincronização automática
  
  const { user } = useAuth()
  const { profiles, loading: profilesLoading } = useProfessionalProfiles()
  const { appointments, loading: appointmentsLoading, fetchAppointments, createAppointmentsFromGoogleEvents, updateAppointment, updateAppointmentStatus, rescheduleAppointment, updateBlockedAppointment, deleteAppointment } = useAppointments()
  const { credentials, profileLinks, loading: googleLoading, connectGoogleAccount } = useGoogleIntegrations()
  const { toast } = useToast()

  // Helper function to get last 30 days range
  const getLast30DaysRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const last30Days = new Date(today)
    last30Days.setDate(today.getDate() - 29)
    return { from: last30Days, to: today }
  }

  // Get appointments for statistics (always last 30 days, respecting professional filter)
  const getAppointmentsForStats = () => {
    let filtered = [...appointments]
    
    // Apply 30-day period filter
    const periodRange = getLast30DaysRange()
    filtered = filtered.filter(apt => {
      const aptDate = new Date(apt.appointment_date)
      const aptDateOnly = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate())
      return aptDateOnly >= periodRange.from && aptDateOnly <= periodRange.to
    })

    // Apply professional filter from professional selector
    if (selectedProfessional !== "all") {
      filtered = filtered.filter(apt => 
        apt.professional_profile_id === selectedProfessional
      )
    }

    return filtered
  }

  // Calcular estatísticas dinamicamente baseadas nos dados dos últimos 30 dias (excluindo bloqueios)
  const calculateStats = (appointments: Appointment[]) => {
    const realAppointments = appointments.filter(apt => apt.appointment_type !== 'blocked')
    const total = realAppointments.length
    const confirmed = realAppointments.filter(apt => apt.status === 'confirmed').length
    const cancelled = realAppointments.filter(apt => apt.status === 'cancelled').length
    const rescheduled = realAppointments.filter(apt => apt.status === 'rescheduled').length

    return [
      { title: "Total de Agendamentos", value: total.toString(), icon: CalendarIcon, color: "default" },
      { title: "Confirmados", value: confirmed.toString(), percentage: total > 0 ? `${Math.round((confirmed/total)*100)}%` : "0%", icon: CheckCircle, color: "default" },
      { title: "Remarcados", value: rescheduled.toString(), percentage: total > 0 ? `${Math.round((rescheduled/total)*100)}%` : "0%", icon: RotateCcw, color: "default" },
      { title: "Cancelados", value: cancelled.toString(), percentage: total > 0 ? `${Math.round((cancelled/total)*100)}%` : "0%", icon: XCircle, color: "destructive" },
    ]
  }

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [filtersModalOpen, setFiltersModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [blockEditModalOpen, setBlockEditModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [selectedBlockForEdit, setSelectedBlockForEdit] = useState<Appointment | null>(null)
  
  // Filters state
  const [filters, setFilters] = useState<AppointmentFilters>({
    status: [],
    professionalIds: [],
    dateFrom: undefined,
    dateTo: undefined,
    appointmentType: "all"
  })
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])

  // Get period date range based on viewPeriod
  const getPeriodDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (viewPeriod) {
      case "today":
        return { from: today, to: today }
      case "last7days":
        const last7Days = new Date(today)
        last7Days.setDate(today.getDate() - 6)
        return { from: last7Days, to: today }
      case "last30days":
        const last30Days = new Date(today)
        last30Days.setDate(today.getDate() - 29)
        return { from: last30Days, to: today }
      default:
        return { from: today, to: today }
    }
  }

  // Apply filters to appointments
  const applyFilters = () => {
    let filtered = [...appointments]

    // Apply period filter if no manual date range is set
    if (!filters.dateFrom && !filters.dateTo) {
      const periodRange = getPeriodDateRange()
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointment_date)
        const aptDateOnly = new Date(aptDate.getFullYear(), aptDate.getMonth(), aptDate.getDate())
        return aptDateOnly >= periodRange.from && aptDateOnly <= periodRange.to
      })
    }

    // Apply professional filter from professional selector
    if (selectedProfessional !== "all") {
      filtered = filtered.filter(apt => 
        apt.professional_profile_id === selectedProfessional
      )
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter(apt => filters.status.includes(apt.status))
    }

    if (filters.professionalIds.length > 0) {
      filtered = filtered.filter(apt => 
        apt.professional_profile_id && filters.professionalIds.includes(apt.professional_profile_id)
      )
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(apt => 
        new Date(apt.appointment_date) >= filters.dateFrom!
      )
    }

    if (filters.dateTo) {
      filtered = filtered.filter(apt => 
        new Date(apt.appointment_date) <= filters.dateTo!
      )
    }

    if (filters.appointmentType !== "all") {
      filtered = filtered.filter(apt => 
        apt.appointment_type === filters.appointmentType
      )
    }

    setFilteredAppointments(filtered)
  }

  // Apply filters when appointments, filters, viewPeriod, or selectedProfessional change
  useEffect(() => {
    applyFilters()
  }, [appointments, filters, viewPeriod, selectedProfessional])

  // useEffects removidos - não mais necessários com sincronização automática

  // Helper function to check if appointment is blocked
  const isBlocked = (apt: Appointment) => {
    return apt.appointment_type === 'blocked' || 
           apt.status === 'blocked' || 
           (apt.patient_name && apt.patient_name.toLowerCase().includes('bloqueado'))
  }

  // Helper function to apply appointment filters (excluding period filters)
  const applyAppointmentFilters = (appointmentList: Appointment[]) => {
    let filtered = [...appointmentList]

    // Apply professional filter from professional selector
    if (selectedProfessional !== "all") {
      filtered = filtered.filter(apt => 
        apt.professional_profile_id === selectedProfessional
      )
    }

    // Apply modal filters (but not period filter)
    if (filters.status.length > 0) {
      filtered = filtered.filter(apt => filters.status.includes(apt.status))
    }

    if (filters.professionalIds.length > 0) {
      filtered = filtered.filter(apt => 
        apt.professional_profile_id && filters.professionalIds.includes(apt.professional_profile_id)
      )
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(apt => 
        new Date(apt.appointment_date) >= filters.dateFrom!
      )
    }

    if (filters.dateTo) {
      filtered = filtered.filter(apt => 
        new Date(apt.appointment_date) <= filters.dateTo!
      )
    }

    if (filters.appointmentType !== "all") {
      filtered = filtered.filter(apt => 
        apt.appointment_type === filters.appointmentType
      )
    }

    return filtered
  }

  // Appointments for calendar view - apply all filters except period filter
  const appointmentsForCalendar = () => {
    return applyAppointmentFilters(appointments)
  }

  // Appointments for day view - apply all filters except period filter
  const appointmentsForDayView = () => {
    return applyAppointmentFilters(appointments)
  }

  // Get appointments for a specific date (excluding blocked appointments and cancelled) - for calendar view
  const getAppointmentsForDate = (date: Date) => {
    return appointmentsForCalendar().filter(apt => {
      const aptDate = new Date(apt.appointment_date)
      return aptDate.toDateString() === date.toDateString() && !isBlocked(apt) && apt.status !== 'cancelled'
    })
  }

  // Get blocked appointments for a specific date - for calendar view
  const getBlockedAppointmentsForDate = (date: Date) => {
    return appointmentsForCalendar().filter(apt => {
      const aptDate = new Date(apt.appointment_date)
      return aptDate.toDateString() === date.toDateString() && isBlocked(apt)
    })
  }

  // Get appointments for selected date in day view (non-blocked and non-cancelled only for calendar)
  const getAppointmentsForSelectedDateDayView = (date: Date) => {
    return appointmentsForDayView().filter(apt => {
      const aptDate = new Date(apt.appointment_date)
      return aptDate.toDateString() === date.toDateString() && !isBlocked(apt)
    })
  }

  // Get blocked appointments for selected date in day view
  const getBlockedForSelectedDateDayView = (date: Date) => {
    return appointmentsForDayView().filter(apt => {
      const aptDate = new Date(apt.appointment_date)
      return aptDate.toDateString() === date.toDateString() && isBlocked(apt)
    })
  }

  // Helper function to format block display
  const formatBlockDisplay = (apt: Appointment) => {
    const durationMinutes = apt.duration_minutes || 0
    
    // Parse appointment_date (handle UTC format with "+00")
    let startDate: Date
    if (apt.appointment_date.includes('+00')) {
      // Convert UTC to local time
      startDate = new Date(apt.appointment_date.replace(' ', 'T'))
    } else {
      startDate = new Date(apt.appointment_date)
    }
    
    // For full day blocks (1440 minutes = 24 hours)
    if (durationMinutes === 1440) {
      return "🔒 Dia inteiro bloqueado"
    }
    
    // For specific period blocks, calculate end time
    if (durationMinutes > 0) {
      const endDate = new Date(startDate.getTime() + (durationMinutes * 60 * 1000))
      const startTime = format(startDate, 'HH:mm')
      const endTime = format(endDate, 'HH:mm')
      return `⏰ ${startTime} — ${endTime}`
    }
    
    // Fallback for blocks without duration
    return `⏰ ${format(startDate, 'HH:mm')}`
  }

  // Helper function to extract reason from notes
  const extractReasonFromNotes = (notes: string) => {
    if (!notes) return ""
    
    // Look for "Motivo: " pattern
    const motivoMatch = notes.match(/Motivo:\s*([^.]+)/)
    if (motivoMatch) {
      return motivoMatch[1].trim()
    }
    
    // Filter out old automatic phrases - don't show anything if it's just automatic text
    const filteredNotes = notes
      .replace(/Horário bloqueado de \d{2}:\d{2} até \d{2}:\d{2}/, '')
      .replace(/Horário bloqueado até \d{2}:\d{2}/, '')
      .replace(/Dia inteiro bloqueado/, '')
      .replace(/Bloqueio de período específico/, '')
      .replace(/\(Recorrência: [^)]+\)/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^[.,\s]+|[.,\s]+$/g, '') // Remove leading/trailing punctuation
    
    // Don't show empty or very short meaningless text
    return filteredNotes.length > 2 ? filteredNotes : ""
  }

  // Get appointments for selected date (excluding blocked appointments)
  const selectedDateAppointments = selectedDate ? getAppointmentsForSelectedDateDayView(selectedDate) : []
  
  // Get blocked appointments for selected date
  const selectedDateBlocked = selectedDate ? getBlockedForSelectedDateDayView(selectedDate) : []

  // Calculate stats from filtered appointments (respects period selection)
  const stats = calculateStats(filteredAppointments)

  // Get formatted date range for display
  const getFormattedDateRange = () => {
    if (filters.dateFrom && filters.dateTo) {
      return `${format(filters.dateFrom, 'dd/MM/yyyy', { locale: ptBR })} - ${format(filters.dateTo, 'dd/MM/yyyy', { locale: ptBR })}`
    }
    
    const periodRange = getPeriodDateRange()
    return `${format(periodRange.from, 'dd/MM/yyyy', { locale: ptBR })} - ${format(periodRange.to, 'dd/MM/yyyy', { locale: ptBR })}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-500'
      case 'scheduled':
        return 'bg-yellow-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'cancelled':
        return 'bg-red-500'
      case 'completed':
        return 'bg-green-500'
      case 'rescheduled':
        return 'bg-orange-500'
      case 'blocked':
        return 'bg-gray-600'
      default:
        return 'bg-gray-500'
    }
  }

  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(appointmentId, newStatus)
      await fetchAppointments()
      
      const statusMessages = {
        cancelled: 'Agendamento cancelado e notificação enviada',
        confirmed: 'Agendamento confirmado',
        pending: 'Status atualizado para pendente',
        completed: 'Agendamento marcado como concluído',
        rescheduled: 'Agendamento remarcado'
      }
      
      toast({
        title: 'Status atualizado',
        description: statusMessages[newStatus as keyof typeof statusMessages] || 'O status do agendamento foi atualizado com sucesso.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error?.message || 'Não foi possível atualizar o status do agendamento.',
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
        description: 'O agendamento foi excluído com sucesso e notificação enviada.',
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error?.message || 'Não foi possível excluir o agendamento.',
        variant: 'destructive',
      })
    }
  }

  const handleEditBlock = (appointment: Appointment) => {
    setSelectedBlockForEdit(appointment)
    setBlockEditModalOpen(true)
  }

  const handleUpdateBlock = async (appointmentId: string, updatedData: Partial<Appointment>) => {
    try {
      await updateBlockedAppointment(appointmentId, updatedData)
      await fetchAppointments()
      toast({
        title: "Bloqueio atualizado",
        description: "O bloqueio foi atualizado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao atualizar bloqueio",
        description: "Não foi possível atualizar o bloqueio.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteBlock = async (appointmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este bloqueio?')) {
      return
    }
    
    try {
      await deleteAppointment(appointmentId)
      await fetchAppointments()
      toast({
        title: "Bloqueio excluído",
        description: "O bloqueio foi excluído com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao excluir bloqueio",
        description: "Não foi possível excluir o bloqueio.",
        variant: "destructive",
      })
    }
  }

  const handleDuplicateBlock = (appointment: Appointment) => {
    // Set the appointment data for duplication in the create modal
    setSelectedAppointment({
      ...appointment,
      id: "", // Clear ID for new appointment
      appointment_date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss")
    })
    setBlockModalOpen(true)
  }

  // Função removida - sincronização agora é automática via vinculação de perfis


  // Custom day content renderer
  const renderDayContent = (date: Date) => {
    const dayAppointments = getAppointmentsForDate(date)
    const blockedAppointments = getBlockedAppointmentsForDate(date)
    const appointmentCount = dayAppointments.length
    const hasBlocked = blockedAppointments.length > 0
    
    return (
      <div className="relative w-full h-full flex flex-col justify-between p-1 sm:p-1.5">
        <span className="text-xs sm:text-sm font-medium text-left">{date.getDate()}</span>
        {appointmentCount > 0 && (
          <div className="w-full">
            <div className="text-[10px] sm:text-xs md:text-sm px-1 py-0.5 bg-gray-200 text-gray-700 rounded text-center font-medium">
              {appointmentCount}
              <span className="hidden sm:inline"> consulta{appointmentCount > 1 ? 's' : ''}</span>
            </div>
          </div>
        )}
        {hasBlocked && (
          <div className="absolute top-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-gray-500 rounded-full" title="Dia com bloqueios" />
        )}
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <header className="space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Agendamentos</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Período: {getFormattedDateRange()}
              </p>
            </div>
            
            {/* Controles organizados de forma responsiva */}
            <div className="space-y-3 sm:space-y-4">
              {/* Linha 1: Seletor de profissional (sempre em linha própria em mobile) */}
              <div className="w-full">
                <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                  <SelectTrigger className="w-full">
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
              </div>
              
              {/* Linha 2: Botões de ação em grid responsivo */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center justify-center gap-2 text-sm"
                  onClick={() => setFiltersModalOpen(true)}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filtrar</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center justify-center gap-2 text-sm"
                  onClick={async () => {
                    await fetchAppointments()
                    toast({
                      title: "Atualizado",
                      description: "Lista de agendamentos atualizada com sucesso."
                    })
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Atualizar</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center justify-center gap-2 text-sm"
                  onClick={() => setBlockModalOpen(true)}
                >
                  <X className="h-4 w-4" />
                  <span>Bloquear</span>
                </Button>
                
                <Button 
                  size="sm" 
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-sm"
                  onClick={() => setCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span>Novo</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Statistics Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">Estatísticas de Agendamentos</h2>
                <p className="text-sm text-muted-foreground">Acompanhe o desempenho dos seus agendamentos</p>
              </div>
              <div className="w-full sm:w-auto">
                <Tabs value={viewPeriod} onValueChange={setViewPeriod} className="w-full sm:w-auto">
                  <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:grid-cols-none sm:flex">
                    <TabsTrigger value="today" className="text-xs sm:text-sm">Hoje</TabsTrigger>
                    <TabsTrigger value="last7days" className="text-xs sm:text-sm">7 dias</TabsTrigger>
                    <TabsTrigger value="last30days" className="text-xs sm:text-sm">30 dias</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <Card key={index} className="border-border/50">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm text-muted-foreground truncate">{stat.title}</span>
                        <span className="text-lg sm:text-xl font-bold">{stat.value}</span>
                        {stat.percentage && (
                          <Badge variant={stat.color as any} className="w-fit mt-1 text-xs px-1 py-0 h-4">
                            {stat.percentage}
                          </Badge>
                        )}
                      </div>
                      <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
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
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 lg:p-6">
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
                      head_cell: "text-muted-foreground rounded-md w-full font-normal text-xs sm:text-sm text-center",
                      row: "flex w-full mt-1 sm:mt-2",
                      cell: "h-12 sm:h-14 md:h-16 lg:h-20 w-full text-center text-sm p-0 relative border-r border-b border-gray-100 [&:has([aria-selected='true'])]:bg-red-500 [&:has([aria-selected='true'])]:text-white",
                      day: "h-12 sm:h-14 md:h-16 lg:h-20 w-full p-1 sm:p-1.5 font-normal bg-transparent text-foreground cursor-pointer aria-selected:bg-red-500 aria-selected:text-white",
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

            {/* Daily Appointments and Blocks - Responsive Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Regular Appointments */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg">
                    <span>Agendamentos do Dia ({selectedDateAppointments.length})</span>
                    {selectedDate && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <ScrollArea className="h-[300px] sm:h-[400px]">
                    {appointmentsLoading ? (
                      <div className="flex justify-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      </div>
                    ) : selectedDateAppointments.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhum agendamento para esta data
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {/* Agendamentos ativos (não cancelados) */}
                        {selectedDateAppointments.filter(apt => apt.status !== 'cancelled').map((appointment) => (
                           <div
                             key={appointment.id}
                             className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                           >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {appointment.patient_name}
                                  </span>
                                   <Badge 
                                     variant={appointment.status === 'confirmed' ? "default" : getStatusBadge(appointment.status).variant}
                                     className={appointment.status === 'confirmed' ? "bg-green-500 text-white hover:bg-green-600" : ""}
                                   >
                                     {getStatusBadge(appointment.status).label}
                                   </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <div>⏰ {format(new Date(appointment.appointment_date), "HH:mm")}</div>
                                  {appointment.duration_minutes && (
                                    <div>Duração: {appointment.duration_minutes} min</div>
                                  )}
                                  {appointment.professional_profile_id && (
                                    <div>
                                      👨‍⚕️ {profiles.find(p => p.id === appointment.professional_profile_id)?.fullname || 'Profissional não encontrado'}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedAppointment(appointment)
                                    setViewModalOpen(true)
                                  }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedAppointment(appointment)
                                    setEditModalOpen(true)
                                  }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedAppointment(appointment)
                                    setRescheduleModalOpen(true)
                                  }}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    Reagendar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Confirmar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancelar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteAppointment(appointment.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                         ))}
                        
                        {/* Separador e agendamentos cancelados */}
                        {selectedDateAppointments.filter(apt => apt.status === 'cancelled').length > 0 && (
                          <>
                            <div className="py-2">
                              <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                  <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                  <span className="bg-background px-2 text-muted-foreground">
                                    Cancelados
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {selectedDateAppointments.filter(apt => apt.status === 'cancelled').map((appointment) => (
                              <div
                                key={appointment.id}
                                className="p-3 border rounded-lg hover:bg-accent/50 transition-colors opacity-60"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">
                                        {appointment.patient_name}
                                      </span>
                                       <Badge 
                                         variant={appointment.status === 'confirmed' ? "default" : getStatusBadge(appointment.status).variant}
                                         className={appointment.status === 'confirmed' ? "bg-green-500 text-white hover:bg-green-600" : ""}
                                       >
                                         {getStatusBadge(appointment.status).label}
                                       </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      <div>⏰ {format(new Date(appointment.appointment_date), "HH:mm")}</div>
                                      {appointment.duration_minutes && (
                                        <div>Duração: {appointment.duration_minutes} min</div>
                                      )}
                                      {appointment.professional_profile_id && (
                                        <div>
                                          👨‍⚕️ {profiles.find(p => p.id === appointment.professional_profile_id)?.fullname || 'Profissional não encontrado'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedAppointment(appointment)
                                        setViewModalOpen(true)
                                      }}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Visualizar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedAppointment(appointment)
                                        setEditModalOpen(true)
                                      }}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedAppointment(appointment)
                                        setRescheduleModalOpen(true)
                                      }}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        Reagendar
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, 'confirmed')}>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Confirmar
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        onClick={() => handleDeleteAppointment(appointment.id)}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Blocked Times */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg">
                    <span>Bloqueios do Dia ({selectedDateBlocked.length})</span>
                    {selectedDate && (
                      <span className="text-sm font-normal text-muted-foreground">
                        {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <ScrollArea className="h-[300px] sm:h-[400px]">
                    {selectedDateBlocked.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhum bloqueio para esta data
                      </p>
                    ) : (
                       <div className="space-y-3">
                         {selectedDateBlocked.map((blocked) => (
                           <div
                             key={blocked.id}
                             className="p-3 border border-border rounded-lg bg-muted/30"
                           >
                             <div className="flex items-center justify-between">
                               <div className="flex-1 space-y-1">
                                 <div className="flex items-center gap-2">
                                   <span className="font-medium text-foreground">
                                     Horário Bloqueado
                                   </span>
                                 </div>
                                  <div className="text-sm text-muted-foreground">
                                    <div>{formatBlockDisplay(blocked)}</div>
                                    {blocked.professional_profile_id && (
                                      <div>
                                        👨‍⚕️ {profiles.find(p => p.id === blocked.professional_profile_id)?.fullname || 'Profissional não encontrado'}
                                      </div>
                                    )}
                                    {blocked.notes && extractReasonFromNotes(blocked.notes) && (
                                      <div className="mt-1">Motivo: {extractReasonFromNotes(blocked.notes)}</div>
                                    )}
                                  </div>
                               </div>
                               <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                     <MoreVertical className="h-4 w-4" />
                                   </Button>
                                 </DropdownMenuTrigger>
                                 <DropdownMenuContent align="end">
                                   <DropdownMenuItem onClick={() => handleEditBlock(blocked)}>
                                     <Edit className="mr-2 h-4 w-4" />
                                     Editar
                                   </DropdownMenuItem>
                                   <DropdownMenuItem onClick={() => handleDuplicateBlock(blocked)}>
                                     <Copy className="mr-2 h-4 w-4" />
                                     Duplicar
                                   </DropdownMenuItem>
                                   <DropdownMenuSeparator />
                                   <DropdownMenuItem 
                                     onClick={() => handleDeleteBlock(blocked.id)}
                                     className="text-destructive"
                                   >
                                     <Trash2 className="mr-2 h-4 w-4" />
                                     Excluir
                                   </DropdownMenuItem>
                                 </DropdownMenuContent>
                               </DropdownMenu>
                             </div>
                           </div>
                         ))}
                       </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
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

      <AppointmentFiltersModal
        open={filtersModalOpen}
        onOpenChange={setFiltersModalOpen}
        filters={filters}
        onFiltersChange={setFilters}
        onApplyFilters={applyFilters}
      />

      <AppointmentCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchAppointments}
      />

      <AppointmentBlockModal
        open={blockModalOpen}
        onOpenChange={setBlockModalOpen}
        onSuccess={fetchAppointments}
      />

      <AppointmentBlockEditModal
        appointment={selectedBlockForEdit}
        open={blockEditModalOpen}
        onOpenChange={setBlockEditModalOpen}
        onUpdate={handleUpdateBlock}
      />
        </div>
      </div>
    </DashboardLayout>
  )
}