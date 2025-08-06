import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { RefreshCw, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics"
import { ConversationChart } from "@/components/dashboard/conversation-chart"
import { RecentConversations } from "@/components/dashboard/recent-conversations"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const { user } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalConversations: 147,
    activeConversations: 23,
    profileCount: 8,
    instanceCount: 12,
    connectedInstanceCount: 10,
    messageCount: 1284,
    appointmentCount: 89,
    chartData: [
      { date: "01/01", conversations: 12 },
      { date: "02/01", conversations: 19 },
      { date: "03/01", conversations: 15 },
      { date: "04/01", conversations: 25 },
      { date: "05/01", conversations: 22 },
      { date: "06/01", conversations: 30 },
      { date: "07/01", conversations: 28 }
    ],
    previousPeriod: {
      totalConversations: 132,
      messageCount: 1156,
      appointmentCount: 76,
    },
  })

  useEffect(() => {
    if (!user) {
      navigate('/')
    } else {
      // Simular carregamento inicial
      setTimeout(() => {
        setInitialLoading(false)
      }, 1500)
    }
  }, [user, navigate])

  const refreshDashboard = async () => {
    setLoading(true)
    try {
      // Simular atualização de dados
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Erro ao atualizar dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return Math.round(((current - previous) / previous) * 100)
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Visão geral da sua plataforma Aplia
              <span className="text-xs ml-2">
                Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshDashboard}
              disabled={loading}
              className="flex items-center gap-2 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="sr-only md:not-sr-only">Atualizar</span>
            </Button>
            
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Settings2 className="h-4 w-4" />
              Personalizar Dashboard
            </Button>
          </div>
        </header>

        <div className="space-y-8">
          <DashboardMetrics />

          {/* Charts and Activity */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
            <ConversationChart />
            <RecentConversations />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}