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
  Download,
  HelpCircle
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
  const [isGoogleEventsDialogOpen, setIsGoogleEventsDialogOpen] = useState(false)
  const [selectedProfessionalForImport, setSelectedProfessionalForImport] = useState<string>("")
  const [selectedGoogleCredentialId, setSelectedGoogleCredentialId] = useState<string>("")
  const [isImporting, setIsImporting] = useState(false)
  
  const { user } = useAuth()
  const { profiles, loading: profilesLoading } = useProfessionalProfiles()
  const { appointments, loading: appointmentsLoading, fetchAppointments, createAppointmentsFromGoogleEvents, updateAppointment, updateAppointmentStatus, rescheduleAppointment, deleteAppointment } = useAppointments()
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
    const scheduled = realAppointments.filter(apt => apt.status === 'scheduled').length
    const confirmed = realAppointments.filter(apt => apt.status === 'confirmed').length
    const completed = realAppointments.filter(apt => apt.status === 'completed').length
    const cancelled = realAppointments.filter(apt => apt.status === 'cancelled').length
    const rescheduled = realAppointments.filter(apt => apt.status === 'rescheduled').length

    return [
      { title: "Total de Agendamentos", value: total.toString(), icon: CalendarIcon, color: "default" },
      { title: "Agendados", value: scheduled.toString(), percentage: total > 0 ? `${Math.round((scheduled/total)*100)}%` : "0%", icon: Clock, color: "secondary" },
      { title: "Confirmados", value: confirmed.toString(), percentage: total > 0 ? `${Math.round((confirmed/total)*100)}%` : "0%", icon: CheckCircle, color: "default" },
      { title: "Concluídos", value: completed.toString(), percentage: total > 0 ? `${Math.round((completed/total)*100)}%` : "0%", icon: CheckCircle, color: "default" },
      { title: "Cancelados", value: cancelled.toString(), percentage: total > 0 ? `${Math.round((cancelled/total)*100)}%` : "0%", icon: XCircle, color: "destructive" },
      { title: "Remarcados", value: rescheduled.toString(), percentage: total > 0 ? `${Math.round((rescheduled/total)*100)}%` : "0%", icon: RotateCcw, color: "default" },
    ]
  }

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
  const [filtersModalOpen, setFiltersModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  
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

  // Auto-select Google credential when modal opens or when credentials change
  useEffect(() => {
    if (isGoogleEventsDialogOpen && credentials.length > 0 && !selectedGoogleCredentialId) {
      // If only one credential, auto-select it
      if (credentials.length === 1) {
        setSelectedGoogleCredentialId(credentials[0].id)
      } else if (selectedProfessionalForImport) {
        // Check if the selected professional profile is linked to a Google credential
        const profileLink = profileLinks.find(link => link.professional_profile_id === selectedProfessionalForImport)
        if (profileLink) {
          setSelectedGoogleCredentialId(profileLink.google_credential_id)
        }
      }
    }
  }, [isGoogleEventsDialogOpen, credentials, profileLinks, selectedProfessionalForImport, selectedGoogleCredentialId])

  // Auto-select credential when professional profile changes
  useEffect(() => {
    if (selectedProfessionalForImport && credentials.length > 0) {
      const profileLink = profileLinks.find(link => link.professional_profile_id === selectedProfessionalForImport)
      if (profileLink) {
        setSelectedGoogleCredentialId(profileLink.google_credential_id)
      } else if (credentials.length === 1) {
        setSelectedGoogleCredentialId(credentials[0].id)
      }
    }
  }, [selectedProfessionalForImport, credentials, profileLinks])

  // Helper function to check if appointment is blocked
  const isBlocked = (apt: Appointment) => {
    return apt.appointment_type === 'blocked' || 
           apt.status === 'blocked' || 
           (apt.patient_name && apt.patient_name.toLowerCase().includes('bloqueado'))
  }

  // Appointments for calendar view - only apply professional filter, not period filter
  const appointmentsForCalendar = () => {
    let filtered = [...appointments]

    // Apply professional filter from professional selector
    if (selectedProfessional !== "all") {
      filtered = filtered.filter(apt => 
        apt.professional_profile_id === selectedProfessional
      )
    }

    return filtered
  }

  // Appointments for day view - shows ALL non-blocked appointments for selected day regardless of period filters
  const appointmentsForDayView = () => {
    let filtered = [...appointments]

    // Apply professional filter from professional selector
    if (selectedProfessional !== "all") {
      filtered = filtered.filter(apt => 
        apt.professional_profile_id === selectedProfessional
      )
    }

    return filtered
  }

  // Get appointments for a specific date (excluding blocked appointments) - for calendar view
  const getAppointmentsForDate = (date: Date) => {
    return appointmentsForCalendar().filter(apt => {
      const aptDate = new Date(apt.appointment_date)
      return aptDate.toDateString() === date.toDateString() && !isBlocked(apt)
    })
  }

  // Get blocked appointments for a specific date - for calendar view
  const getBlockedAppointmentsForDate = (date: Date) => {
    return appointmentsForCalendar().filter(apt => {
      const aptDate = new Date(apt.appointment_date)
      return aptDate.toDateString() === date.toDateString() && isBlocked(apt)
    })
  }

  // Get appointments for selected date in day view (non-blocked only)
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

  // Get appointments for selected date (excluding blocked appointments)
  const selectedDateAppointments = selectedDate ? getAppointmentsForSelectedDateDayView(selectedDate) : []
  
  // Get blocked appointments for selected date
  const selectedDateBlocked = selectedDate ? getBlockedForSelectedDateDayView(selectedDate) : []

  // Calculate stats from appointments in the last 30 days
  const stats = calculateStats(getAppointmentsForStats())

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
    console.log('handleGoogleEventsSync called', { selectedProfessionalForImport, selectedGoogleCredentialId });
    
    if (!selectedGoogleCredentialId) {
      console.log('Missing Google credential');
      toast({
        title: 'Erro',
        description: 'Selecione uma conta do Google.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!selectedProfessionalForImport) {
      console.log('Missing professional profile');
      toast({
        title: 'Erro',
        description: 'Selecione um perfil profissional.',
        variant: 'destructive',
      });
      return;
    }

    const selectedCredential = credentials.find(c => c.id === selectedGoogleCredentialId);
    if (!selectedCredential) {
      toast({
        title: 'Erro',
        description: 'Conta do Google não encontrada.',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true)

    // Set 1 year range automatically: 6 months before and 6 months after current date
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    const sixMonthsLater = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());

    const query = {
      my_email: selectedCredential.email,
      user_id: user.id,
      calendarId: "primary",
      timeMin: sixMonthsAgo.toISOString(),
      timeMax: sixMonthsLater.toISOString(),
      professionalProfileId: selectedProfessionalForImport
    }

    console.log('Sending webhook request with query:', query);

    try {
      const response = await fetch('https://aplia-n8n-webhook.kopfcf.easypanel.host/webhook/eventos-google-agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ query: JSON.stringify(query) }])
      })
      
      console.log('Webhook response status:', response.status);
      console.log('Webhook response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json()
        console.log('Webhook response data:', data);
        
        if (data && data[0]) {
          console.log('Processing webhook data:', data[0]);
          
          await createAppointmentsFromGoogleEvents(data[0], selectedProfessionalForImport)
          setIsGoogleEventsDialogOpen(false)
          setSelectedProfessionalForImport("")
          setSelectedGoogleCredentialId("")
        } else {
          console.log('No events in response');
          toast({
            title: 'Aviso',
            description: 'Nenhum evento encontrado no período de 1 ano.',
          });
        }
      } else {
        const errorText = await response.text();
        console.log('Webhook response not ok:', errorText);
        throw new Error(`Erro do servidor: ${errorText || response.status}`);
      }
    } catch (error) {
      console.error('Erro ao enviar eventos:', error)
      toast({
        title: 'Erro ao importar eventos',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false)
    }
  }


  // Custom day content renderer
  const renderDayContent = (date: Date) => {
    const dayAppointments = getAppointmentsForDate(date)
    const blockedAppointments = getBlockedAppointmentsForDate(date)
    const appointmentCount = dayAppointments.length
    const hasBlocked = blockedAppointments.length > 0
    
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
        {hasBlocked && (
          <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full" title="Dia com bloqueios" />
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
              <p className="text-sm text-muted-foreground">
                Período: {getFormattedDateRange()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={async () => {
                  await fetchAppointments()
                  toast({
                    title: "Atualizado",
                    description: "Lista de agendamentos atualizada com sucesso."
                  })
                }}
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => setFiltersModalOpen(true)}
              >
                <Filter className="h-4 w-4" />
                Filtrar
              </Button>
              <Button 
                size="sm" 
                className="flex items-center gap-2 bg-secondary hover:bg-secondary/90"
                onClick={() => setCreateModalOpen(true)}
              >
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
                          <TabsTrigger value="last7days">Últimos 7 dias</TabsTrigger>
                          <TabsTrigger value="last30days">Últimos 30 dias</TabsTrigger>
                        </TabsList>
                </Tabs>
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2"
                        onClick={() => setBlockModalOpen(true)}
                      >
                        <X className="h-4 w-4" />
                        Bloquear horários
                      </Button>
                      
                      <Dialog open={isGoogleEventsDialogOpen} onOpenChange={setIsGoogleEventsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            Vincular eventos
                          </Button>
                        </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Vincular eventos do Google Agenda</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="bg-muted/50 p-4 rounded-lg">
                                  <p className="text-sm text-muted-foreground">
                                    Os eventos serão importados automaticamente do período de 1 ano (6 meses antes e 6 meses depois da data atual).
                                  </p>
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

                                 <div className="space-y-2">
                                   <label className="text-sm font-medium">Conta Google</label>
                                   {googleLoading ? (
                                     <div className="p-2 text-center text-sm text-muted-foreground">
                                       Carregando contas...
                                     </div>
                                   ) : credentials.length === 0 ? (
                                     <div className="space-y-2">
                                       <div className="p-3 border rounded-lg bg-muted/50">
                                         <p className="text-sm text-muted-foreground">
                                           Nenhuma conta Google conectada. Conecte uma conta para importar eventos.
                                         </p>
                                       </div>
                                       <Button 
                                         variant="outline" 
                                         size="sm" 
                                         onClick={connectGoogleAccount}
                                         className="w-full"
                                       >
                                         Conectar Google Agenda
                                       </Button>
                                     </div>
                                   ) : (
                                     <Select value={selectedGoogleCredentialId} onValueChange={setSelectedGoogleCredentialId}>
                                       <SelectTrigger>
                                         <SelectValue placeholder="Selecione a conta Google" />
                                       </SelectTrigger>
                                       <SelectContent>
                                         {credentials.map(credential => (
                                           <SelectItem key={credential.id} value={credential.id}>
                                             {credential.email}
                                           </SelectItem>
                                         ))}
                                       </SelectContent>
                                     </Select>
                                   )}
                                 </div>
                                
                                <div className="flex gap-2 pt-4">
                                   <Button 
                                     onClick={handleGoogleEventsSync}
                                     disabled={!selectedProfessionalForImport || !selectedGoogleCredentialId || isImporting || credentials.length === 0}
                                     className="flex-1"
                                   >
                                    {isImporting ? "Vinculando..." : "Vincular eventos"}
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
                            <p>Use esse botão para vincular os eventos do seu Google Agenda</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        await fetchAppointments()
                        toast({
                          title: "Atualizado",
                          description: "Calendário atualizado com sucesso."
                        })
                      }}
                    >
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

            {/* Daily Appointments and Blocks - Side by Side Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Regular Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Agendamentos do Dia ({selectedDateAppointments.length})
                    {selectedDate && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
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
                        {selectedDateAppointments.map((appointment) => (
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
                                  <Badge variant={getStatusBadge(appointment.status).variant}>
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
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Blocked Times */}
              <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
                <CardHeader>
                  <CardTitle className="text-orange-700 dark:text-orange-300 flex items-center gap-2">
                    <span>🚫</span>
                    Bloqueios do Dia ({selectedDateBlocked.length})
                    {selectedDate && (
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {selectedDateBlocked.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhum bloqueio para esta data
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {selectedDateBlocked.map((blocked) => (
                          <div
                            key={blocked.id}
                            className="p-3 border border-orange-200 dark:border-orange-800 rounded-lg bg-white/50 dark:bg-orange-950/30"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-orange-800 dark:text-orange-200">
                                  Horário Bloqueado
                                </span>
                              </div>
                              <div className="text-sm text-orange-700 dark:text-orange-300">
                                <div>⏰ {format(new Date(blocked.appointment_date), "HH:mm")}</div>
                                {blocked.duration_minutes ? (
                                  blocked.duration_minutes >= 24 * 60 ? (
                                    <div>Dia inteiro</div>
                                  ) : (
                                    <div>Duração: {blocked.duration_minutes} min</div>
                                  )
                                ) : (
                                  <div>Horário específico</div>
                                )}
                                {blocked.professional_profile_id && (
                                  <div>
                                    👨‍⚕️ {profiles.find(p => p.id === blocked.professional_profile_id)?.fullname || 'Profissional não encontrado'}
                                  </div>
                                )}
                                {blocked.notes && (
                                  <div className="mt-1">📝 {blocked.notes}</div>
                                )}
                              </div>
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
    </DashboardLayout>
  )
}