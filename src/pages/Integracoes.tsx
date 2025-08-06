import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Settings, Link, ExternalLink } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

const integrations = [
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Sincronize agendamentos com o Google Calendar",
    status: "connected",
    icon: CalendarDays,
    connectedAccount: "clinica@gmail.com",
    lastSync: "2 min atrás"
  },
  {
    id: "microsoft-outlook",
    name: "Microsoft Outlook",
    description: "Integração com calendário do Outlook",
    status: "available",
    icon: CalendarDays,
    connectedAccount: null,
    lastSync: null
  },
  {
    id: "zapier",
    name: "Zapier",
    description: "Conecte com milhares de aplicativos",
    status: "available", 
    icon: Link,
    connectedAccount: null,
    lastSync: null
  },
  {
    id: "webhook",
    name: "Webhooks",
    description: "Receba notificações em tempo real",
    status: "configured",
    icon: Settings,
    connectedAccount: "2 webhooks ativos",
    lastSync: "5 min atrás"
  }
]

const statusConfig = {
  connected: {
    label: "Conectado",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    buttonText: "Configurar",
    buttonVariant: "outline" as const
  },
  configured: {
    label: "Configurado",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100", 
    buttonText: "Gerenciar",
    buttonVariant: "outline" as const
  },
  available: {
    label: "Disponível",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
    buttonText: "Conectar",
    buttonVariant: "default" as const
  }
}

export default function IntegracoesPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
              <p className="text-muted-foreground">
                Conecte seus serviços favoritos com a Aplia
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {integrations.map((integration) => {
              const config = statusConfig[integration.status]
              const IconComponent = integration.icon

              return (
                <Card key={integration.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={config.color}>
                        {config.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {integration.connectedAccount && (
                      <div className="text-sm">
                        <p className="text-muted-foreground">Conta conectada:</p>
                        <p className="font-medium">{integration.connectedAccount}</p>
                      </div>
                    )}
                    
                    {integration.lastSync && (
                      <div className="text-xs text-muted-foreground">
                        Última sincronização: {integration.lastSync}
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant={config.buttonVariant} 
                        size="sm" 
                        className="flex-1"
                      >
                        {config.buttonText}
                      </Button>
                      {integration.status !== 'available' && (
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}