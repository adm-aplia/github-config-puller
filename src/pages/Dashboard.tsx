import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { RefreshCw, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics"
import { ConversationChart } from "@/components/dashboard/conversation-chart"
import { RecentConversations } from "@/components/dashboard/recent-conversations"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DashboardCustomizationModal } from "@/components/dashboard/dashboard-customization-modal"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"

interface DashboardConfig {
  showMetrics: boolean
  showChart: boolean
  showRecentConversations: boolean
  chartPeriod: "7" | "15" | "30" | "90"
  metricCards: {
    conversations: boolean
    appointments: boolean
    assistants: boolean
    instances: boolean
  }
}

const defaultConfig: DashboardConfig = {
  showMetrics: true,
  showChart: true,
  showRecentConversations: true,
  chartPeriod: "30",
  metricCards: {
    conversations: true,
    appointments: true,
    assistants: true,
    instances: true,
  },
}

// Função para resetar config para padrão (limpa localStorage se necessário)
const resetToDefault = () => {
  localStorage.removeItem('dashboard-config')
  return defaultConfig
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [customizationOpen, setCustomizationOpen] = useState(false)
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(defaultConfig)
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Map chart period to days and label
  const chartDays = parseInt(dashboardConfig.chartPeriod) as 7 | 15 | 30 | 90
  const periodLabel = `${dashboardConfig.chartPeriod} dias`
  
  const { stats, chartData, loading: statsLoading, refetch } = useDashboardStats(chartDays)

  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  // Load dashboard config from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('dashboard-config')
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig)
        const mergedConfig = { ...defaultConfig, ...parsedConfig }
        setDashboardConfig(mergedConfig)
        console.log('Dashboard config loaded:', mergedConfig)
      } catch (error) {
        console.error('Error parsing dashboard config:', error)
        setDashboardConfig(defaultConfig)
        localStorage.setItem('dashboard-config', JSON.stringify(defaultConfig))
      }
    } else {
      // First time user - use default config (30 days)
      console.log('Using default dashboard config (30 days):', defaultConfig)
      setDashboardConfig(defaultConfig)
      localStorage.setItem('dashboard-config', JSON.stringify(defaultConfig))
    }
  }, [])

  // Reload config when modal closes (after save)
  const handleCustomizationOpenChange = (open: boolean) => {
    setCustomizationOpen(open)
    if (!open) {
      // Reload config from localStorage when modal closes
      const savedConfig = localStorage.getItem('dashboard-config')
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig)
          setDashboardConfig({ ...parsedConfig })
        } catch (error) {
          console.error('Error parsing dashboard config:', error)
        }
      }
    }
  }

  const refreshDashboard = async () => {
    setLoading(true)
    try {
      await refetch()
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
      <div className="w-full lg:max-w-[1600px] lg:mx-auto">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-fluid-lg">
          <div>
            <h1 className="text-fluid-2xl sm:text-fluid-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-fluid-sm text-muted-foreground mt-2">
              Visão geral da sua plataforma Aplia
              <span className="text-xs ml-2 block sm:inline mt-1 sm:mt-0">
                Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshDashboard}
              disabled={loading}
              className="flex items-center gap-2 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Atualizar</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 bg-transparent"
              onClick={() => setCustomizationOpen(true)}
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Personalizar</span>
              <span className="sm:hidden">Config</span>
            </Button>
          </div>
        </header>

        <div className="space-y-fluid-md sm:space-y-fluid-lg">
          {dashboardConfig.showMetrics && (
            <DashboardMetrics 
              stats={stats} 
              loading={statsLoading}
              chartData={chartData}
              visibleCards={dashboardConfig.metricCards}
            />
          )}

          {/* Charts and Activity */}
          <div className="grid gap-fluid-sm sm:gap-fluid-md grid-cols-1 lg:grid-cols-7">
            {dashboardConfig.showChart && (
              <ConversationChart 
                chartData={chartData} 
                loading={statsLoading} 
                periodLabel={periodLabel}
              />
            )}
            {dashboardConfig.showRecentConversations && <RecentConversations />}
          </div>
        </div>
      </div>

      <DashboardCustomizationModal
        open={customizationOpen}
        onOpenChange={handleCustomizationOpenChange}
      />
    </DashboardLayout>
  )
}