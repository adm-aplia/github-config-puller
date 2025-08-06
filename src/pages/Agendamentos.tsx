import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  RotateCcw
} from "lucide-react"
import { useState } from "react"

const mockAppointments = [
  { id: 1, patient: "Maria Silva", time: "09:00", status: "confirmed", type: "Consulta" },
  { id: 2, patient: "João Santos", time: "10:30", status: "pending", type: "Retorno" },
  { id: 3, patient: "Ana Costa", time: "14:00", status: "completed", type: "Consulta" },
  { id: 4, patient: "Pedro Lima", time: "15:30", status: "cancelled", type: "Consulta" },
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

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
              <p className="text-muted-foreground">Estatísticas e calendário de agendamentos da sua clínica</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtrar
              </Button>
              <Button className="flex items-center gap-2 bg-secondary hover:bg-secondary/90">
                <Plus className="h-4 w-4" />
                Novo Agendamento
              </Button>
            </div>
          </header>

          {/* Statistics Section */}
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold">Estatísticas de Agendamentos</h2>
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

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">{stat.title}</span>
                        <span className="text-2xl font-bold">{stat.value}</span>
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
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Calendar */}
            <Card className="lg:col-span-2">
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
              <CardContent>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border w-fit"
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
                  {mockAppointments.length} agendamentos encontrados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAppointments.map((appointment) => {
                    const statusBadge = getStatusBadge(appointment.status)
                    return (
                      <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{appointment.patient}</div>
                          <div className="text-sm text-muted-foreground">
                            {appointment.time} • {appointment.type}
                          </div>
                        </div>
                        <Badge variant={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </div>
                    )
                  })}
                  {mockAppointments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
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