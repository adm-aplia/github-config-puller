import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Moon, Sun, RefreshCw, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics"
import { ConversationChart } from "@/components/dashboard/conversation-chart"
import { RecentConversations } from "@/components/dashboard/recent-conversations"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { useState as useReactState } from "react"

export default function DashboardPage() {
  const [theme, setTheme] = useReactState<'light' | 'dark'>('light')
  const [loading, setLoading] = useReactState(false)
  const [initialLoading, setInitialLoading] = useReactState(true)
  const [lastUpdated, setLastUpdated] = useReactState<Date>(new Date())
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useReactState({
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

  useEffect(() => {
    // Detectar preferência do sistema
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setTheme(isDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

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
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          {/* Header */}
          <header className="flex h-16 items-center gap-4 px-6 border-b border-border/30 bg-background">
            <SidebarTrigger className="mr-2" />
            
            <div className="flex items-center gap-4 flex-1 justify-end">
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
              
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="bg-transparent"
                aria-label="Alternar tema"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </header>

          {/* Main Content */}
          <div className="container mx-auto px-6 py-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                  Visão geral da sua plataforma Aplia
                  <span className="text-xs ml-2">
                    Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
                  </span>
                </p>
              </div>
            </header>

            <DashboardMetrics />

            {/* Charts and Activity */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7 mb-8">
              <ConversationChart />
              <RecentConversations />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}