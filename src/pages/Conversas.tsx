import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, MessageSquare, Clock } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

const conversations = [
  {
    id: "1",
    customerName: "Maria Silva",
    profileName: "Dr. João - Cardiologia",
    lastMessage: "Gostaria de agendar uma consulta para próxima semana",
    timestamp: "2 min atrás",
    status: "active",
    messageCount: 15
  },
  {
    id: "2", 
    customerName: "Pedro Santos",
    profileName: "Dra. Ana - Dermatologia",
    lastMessage: "Obrigado pelo agendamento!",
    timestamp: "15 min atrás",
    status: "completed",
    messageCount: 8
  },
  {
    id: "3",
    customerName: "Julia Costa", 
    profileName: "Dr. Carlos - Ortopedia",
    lastMessage: "Poderia reagendar minha consulta?",
    timestamp: "1 hora atrás",
    status: "pending",
    messageCount: 12
  },
  {
    id: "4",
    customerName: "Roberto Lima",
    profileName: "Dra. Fernanda - Pediatria", 
    lastMessage: "Consulta confirmada para amanhã às 14h",
    timestamp: "2 horas atrás",
    status: "completed",
    messageCount: 6
  }
]

const statusColors = {
  active: "bg-green-500",
  pending: "bg-yellow-500",
  completed: "bg-blue-500"
}

const statusLabels = {
  active: "Ativa",
  pending: "Pendente", 
  completed: "Concluída"
}

export default function ConversasPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Conversas</h1>
              <p className="text-muted-foreground">
                Gerencie todas as conversas dos seus assistentes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar conversas..."
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {conversations.map((conversation) => (
              <Card key={conversation.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">
                            {conversation.customerName}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            <div className={`w-2 h-2 rounded-full mr-1 ${statusColors[conversation.status]}`} />
                            {statusLabels[conversation.status]}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground font-medium mb-2">
                          {conversation.profileName}
                        </p>
                        
                        <p className="text-sm text-foreground line-clamp-2">
                          {conversation.lastMessage}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {conversation.timestamp}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {conversation.messageCount} mensagens
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}