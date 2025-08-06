"use client"

import { useEffect, useState } from "react"
import { Moon, Sun, Loader2, Bot, Calendar, MessageCircle, Shield, Zap, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    setMounted(true)
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

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-background dark:bg-gradient-dark-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
        <p className="text-lg text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  const features = [
    {
      icon: Bot,
      title: "Assistentes Inteligentes",
      description: "IA especializada para diferentes áreas da saúde com conhecimento específico do seu segmento."
    },
    {
      icon: Calendar,
      title: "Agendamento Automático",
      description: "Sistema inteligente de agendamento que otimiza sua agenda automaticamente."
    },
    {
      icon: MessageCircle,
      title: "Integração WhatsApp",
      description: "Atendimento via WhatsApp com respostas automáticas e encaminhamento inteligente."
    },
    {
      icon: Shield,
      title: "Segurança e Privacidade",
      description: "Dados protegidos com criptografia e conformidade com LGPD e normas de saúde."
    },
    {
      icon: Zap,
      title: "Automação Completa",
      description: "Automatize tarefas repetitivas e foque no que realmente importa: seus pacientes."
    },
    {
      icon: Users,
      title: "Gestão de Pacientes",
      description: "Acompanhamento inteligente do histórico e necessidades dos seus pacientes."
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-background dark:bg-gradient-dark-background">
      {/* Header */}
      <header className="flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Aplia</h1>
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
          
          <Button variant="outline" className="hidden sm:inline-flex">
            Entrar
          </Button>
          
          <Button className="bg-gradient-primary hover:opacity-90">
            Começar Grátis
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">
            🚀 Revolucione sua prática médica com IA
          </Badge>
          
          <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight">
            Assistentes de IA para{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Profissionais da Saúde
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Automatize agendamentos, gerencie pacientes e ofereça atendimento 24/7 
            com assistentes de IA especializados para sua área médica.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-elegant">
              Teste Grátis por 7 Dias
            </Button>
            <Button size="lg" variant="outline">
              Ver Demonstração
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-card hover:shadow-elegant transition-all duration-300 border-border/50">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center bg-card rounded-2xl p-8 shadow-card border border-border/50">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Pronto para transformar sua prática?
          </h3>
          <p className="text-lg text-muted-foreground mb-6">
            Junte-se a centenas de profissionais que já automatizaram seu atendimento
          </p>
          <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-elegant">
            Começar Agora - É Grátis
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16 py-8">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2025 Aplia. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}