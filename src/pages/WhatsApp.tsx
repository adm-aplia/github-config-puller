import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, Plus, Settings, Smartphone, Signal } from "lucide-react"

const whatsappInstances = [
  {
    id: "1",
    name: "Clínica Principal",
    phone: "+55 11 99999-9999",
    status: "connected",
    profileCount: 3,
    messagesCount: 1247,
    lastActivity: "2 min atrás"
  },
  {
    id: "2", 
    name: "Atendimento Noturno",
    phone: "+55 11 88888-8888",
    status: "connected",
    profileCount: 2,
    messagesCount: 856,
    lastActivity: "5 min atrás"
  },
  {
    id: "3",
    name: "Emergência",
    phone: "+55 11 77777-7777", 
    status: "disconnected",
    profileCount: 1,
    messagesCount: 432,
    lastActivity: "2 horas atrás"
  }
]

const statusConfig = {
  connected: {
    label: "Conectado",
    color: "bg-green-500",
    badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
  },
  disconnected: {
    label: "Desconectado", 
    color: "bg-red-500",
    badge: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
  }
}

export default function WhatsAppPage() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <header className="flex h-16 items-center gap-4 px-6 border-b border-border/30 bg-background">
            <SidebarTrigger className="mr-2" />
          </header>

          <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
                  <p className="text-muted-foreground">
                    Gerencie suas instâncias do WhatsApp Business
                  </p>
                </div>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Instância
                </Button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {whatsappInstances.map((instance) => (
                  <Card key={instance.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{instance.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{instance.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${statusConfig[instance.status].color}`} />
                          <Badge className={statusConfig[instance.status].badge}>
                            {statusConfig[instance.status].label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Perfis</p>
                          <p className="font-semibold">{instance.profileCount}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mensagens</p>
                          <p className="font-semibold">{instance.messagesCount.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Signal className="h-3 w-3" />
                        Última atividade: {instance.lastActivity}
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="h-4 w-4 mr-2" />
                          Configurar
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Smartphone className="h-4 w-4 mr-2" />
                          QR Code
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}