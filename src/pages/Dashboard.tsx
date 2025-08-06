import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Moon, Sun, LogOut, Bot, RefreshCw, Activity, Calendar, MessageSquare, Users, Settings, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/components/auth-provider"
import { Overview } from "@/components/dashboard/overview"
import { RecentConversations } from "@/components/dashboard/recent-conversations"
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
    <div className="min-h-screen bg-gradient-background dark:bg-gradient-dark-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard Aplia</h1>
              <p className="text-sm text-muted-foreground">
                Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={refreshDashboard}
              disabled={loading}
              className="bg-card/80 backdrop-blur-sm border-border hover:bg-accent"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="bg-card/80 backdrop-blur-sm border-border hover:bg-accent"
              aria-label="Alternar tema"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo, {user.name}!
          </h2>
          <p className="text-muted-foreground">
            Aqui está um resumo da sua atividade hoje
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card hover:shadow-elegant transition-all duration-300 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Conversas
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {initialLoading ? (
                <Skeleton className="h-8 w-16" />
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
                Conversas Ativas
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {initialLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">{stats.activeConversations}</div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">Aguardando resposta</p>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                      Ativo
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
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {initialLoading ? (
                <Skeleton className="h-8 w-16" />
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
                Instâncias Conectadas
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {initialLoading ? (
                <Skeleton className="h-8 w-16" />
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
        <div className="grid lg:grid-cols-7 gap-6 mb-8">
          <Card className="lg:col-span-4 shadow-card border-border/50">
            <CardHeader>
              <CardTitle>Visão Geral das Conversas</CardTitle>
              <CardDescription>Conversas por dia nos últimos 7 dias</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <Overview data={stats.chartData} isLoading={initialLoading} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 shadow-card border-border/50">
            <CardHeader>
              <CardTitle>Conversas Recentes</CardTitle>
              <CardDescription>Últimas interações com pacientes</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentConversations isLoading={initialLoading} />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-primary" />
                <span>Configurações</span>
              </CardTitle>
              <CardDescription>Gerencie assistentes e configurações</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-primary hover:opacity-90">
                Acessar Configurações
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span>WhatsApp</span>
              </CardTitle>
              <CardDescription>Gerenciar instâncias e conexões</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Ver Instâncias
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Relatórios</span>
              </CardTitle>
              <CardDescription>Análises detalhadas e métricas</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Ver Relatórios
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}