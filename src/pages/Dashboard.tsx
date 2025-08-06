import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Moon, Sun, LogOut, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"
import { Overview } from "@/components/dashboard/overview"
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
      <div className="flex h-screen w-full bg-gradient-background dark:bg-gradient-dark-background">
        <AppSidebar />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          {/* Header */}
          <header className="flex h-16 items-center gap-4 px-6 border-b border-border/50 bg-card/80 backdrop-blur-sm">
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

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card className="shadow-card hover:shadow-elegant transition-all duration-300 border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Conversas Totais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {initialLoading ? (
                    <>
                      <Skeleton className="h-8 w-20 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-foreground">{stats.totalConversations}</div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Este mês</p>
                        <Badge variant="secondary" className="text-xs">
                          +{getPercentageChange(stats.totalConversations, stats.previousPeriod.totalConversations)}%
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elegant transition-all duration-300 border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Agendamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {initialLoading ? (
                    <>
                      <Skeleton className="h-8 w-20 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-foreground">{stats.appointmentCount}</div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">Este mês</p>
                        <Badge variant="secondary" className="text-xs">
                          +{getPercentageChange(stats.appointmentCount, stats.previousPeriod.appointmentCount)}%
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elegant transition-all duration-300 border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Perfis Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {initialLoading ? (
                    <>
                      <Skeleton className="h-8 w-20 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-foreground">{stats.profileCount}</div>
                      <p className="text-xs text-muted-foreground">Assistentes configurados</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-elegant transition-all duration-300 border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Instâncias WhatsApp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {initialLoading ? (
                    <>
                      <Skeleton className="h-8 w-20 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-foreground">
                        {stats.connectedInstanceCount}/{stats.instanceCount}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">WhatsApp conectado</p>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                          Online
                        </Badge>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts and Activity */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7 mb-8">
              <Card className="lg:col-span-4 shadow-card border-border/50">
                <CardHeader>
                  <CardTitle>Conversas</CardTitle>
                  <CardDescription>Número de conversas nos últimos 30 dias</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <Overview data={stats.chartData} isLoading={initialLoading} />
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 shadow-card border-border/50">
                <CardHeader>
                  <CardTitle>Conversas Recentes</CardTitle>
                  <CardDescription>Últimas conversas registradas</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentConversations isLoading={initialLoading} />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}