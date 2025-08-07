import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Calendar, Users, Activity } from "lucide-react"
import { DashboardStats } from "@/hooks/use-dashboard-stats"

interface MetricCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  trend?: string
}

function MetricCard({ title, value, description, icon: Icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {trend && <span className="text-green-600">{trend}</span>} {description}
        </p>
      </CardContent>
    </Card>
  )
}

interface DashboardMetricsProps {
  stats: DashboardStats | null
  loading: boolean
}

export function DashboardMetrics({ stats, loading }: DashboardMetricsProps) {
  if (loading) {
    return (
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Conversas Ativas"
        value={stats?.conversas_ativas || 0}
        description="conversas em andamento"
        icon={MessageSquare}
      />
      <MetricCard
        title="Agendamentos"
        value={stats?.agendamentos_mes || 0}
        description="neste mês"
        icon={Calendar}
      />
      <MetricCard
        title="Assistentes"
        value={stats?.total_assistentes || 0}
        description="perfis configurados"
        icon={Users}
      />
      <MetricCard
        title="Instâncias WhatsApp"
        value={`${stats?.instancias_ativas || 0}/${stats?.total_instancias || 0}`}
        description="ativas / total"
        icon={Activity}
      />
    </div>
  )
}