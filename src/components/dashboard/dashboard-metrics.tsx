import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Calendar, Users, Activity } from "lucide-react"

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

export function DashboardMetrics() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Conversas Totais"
        value="1,234"
        description="+12% em relação ao mês passado"
        icon={MessageSquare}
        trend="+12%"
      />
      <MetricCard
        title="Agendamentos"
        value="86"
        description="+5% em relação ao mês passado"
        icon={Calendar}
        trend="+5%"
      />
      <MetricCard
        title="Perfis Ativos"
        value="3"
        description="Assistentes configurados"
        icon={Users}
      />
      <MetricCard
        title="Instâncias WhatsApp"
        value="2"
        description="Conectadas e ativas"
        icon={Activity}
      />
    </div>
  )
}