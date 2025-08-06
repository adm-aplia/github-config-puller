import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Moon, Sun, LogOut, Bot, Calendar, MessageCircle, BarChart3, Settings, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-provider"
import { useState } from "react"

export default function DashboardPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
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

  if (!user) {
    return null
  }

  const stats = [
    {
      title: "Agendamentos Hoje",
      value: "12",
      description: "3 pendentes de confirmação",
      icon: Calendar,
      trend: "+8%"
    },
    {
      title: "Mensagens WhatsApp",
      value: "47",
      description: "Últimas 24 horas",
      icon: MessageCircle,
      trend: "+23%"
    },
    {
      title: "Taxa de Resposta IA",
      value: "94%",
      description: "Respostas automáticas bem-sucedidas",
      icon: Bot,
      trend: "+5%"
    },
    {
      title: "Pacientes Ativos",
      value: "284",
      description: "Este mês",
      icon: Users,
      trend: "+12%"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-background dark:bg-gradient-dark-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Aplia Dashboard</h1>
              <p className="text-sm text-muted-foreground">Bem-vindo, {user.name}!</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
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
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-card hover:shadow-elegant transition-all duration-300 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                  <Badge variant="secondary" className="text-xs">
                    {stat.trend}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Agendamentos</span>
              </CardTitle>
              <CardDescription>Gerencie sua agenda e horários</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-gradient-primary hover:opacity-90">
                Ver Agenda
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span>WhatsApp</span>
              </CardTitle>
              <CardDescription>Configure seu assistente virtual</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Configurar Bot
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span>Relatórios</span>
              </CardTitle>
              <CardDescription>Analise suas métricas e desempenho</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Ver Relatórios
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas interações e eventos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-accent/50">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Novo agendamento confirmado</p>
                  <p className="text-xs text-muted-foreground">Dr. Silva - 15:30</p>
                </div>
                <span className="text-xs text-muted-foreground">há 5 min</span>
              </div>
              
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-accent/50">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Mensagem WhatsApp respondida automaticamente</p>
                  <p className="text-xs text-muted-foreground">Paciente Maria - Dúvida sobre horários</p>
                </div>
                <span className="text-xs text-muted-foreground">há 12 min</span>
              </div>
              
              <div className="flex items-center space-x-4 p-3 rounded-lg bg-accent/50">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Relatório mensal gerado</p>
                  <p className="text-xs text-muted-foreground">Estatísticas de dezembro</p>
                </div>
                <span className="text-xs text-muted-foreground">há 1h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}