import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
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
  Trash2
} from "lucide-react"
import { useState } from "react"
import { ptBR } from "date-fns/locale"

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

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date) => {
    return mockAppointments.filter(apt => 
      apt.date.toDateString() === date.toDateString()
    )
  }

  // Get appointments for selected date
  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : []

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
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Todos os profissionais" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os profissionais</SelectItem>
                        <SelectItem value="dra-mariana">Dra. Mariana</SelectItem>
                        <SelectItem value="dr-carlos">Dr. Carlos</SelectItem>
                      </SelectContent>
                    </Select>
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
                <CardTitle>
                  Agendamentos para {selectedDate?.toLocaleDateString('pt-BR') || 'Hoje'}
                </CardTitle>
                <CardDescription>
                  {selectedDateAppointments.length} agendamentos encontrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedDateAppointments.map((appointment) => {
                    const statusBadge = getStatusBadge(appointment.status)
                    return (
                      <div key={appointment.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{appointment.patient}</div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.time} • {appointment.type}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusBadge.variant}>
                            {statusBadge.label}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              {appointment.status === 'pending' && (
                                <DropdownMenuItem className="flex items-center gap-2">
                                  <UserCheck className="h-4 w-4" />
                                  Confirmar
                                </DropdownMenuItem>
                              )}
                              {appointment.status === 'confirmed' && (
                                <DropdownMenuItem className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4" />
                                  Marcar como Concluído
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="flex items-center gap-2">
                                <Repeat className="h-4 w-4" />
                                Remarcar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2">
                                <X className="h-4 w-4" />
                                Cancelar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2">
                                <UserX className="h-4 w-4" />
                                Marcar Falta
                              </DropdownMenuItem>
                              <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                                <Trash2 className="h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )
                  })}
                  {selectedDateAppointments.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>Nenhum agendamento para esta data</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}