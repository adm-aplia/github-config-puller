import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Conversation {
  id: string
  customerName: string
  profileName: string
  lastMessage: string
  timestamp: string
  status: "active" | "pending" | "completed"
}

const conversations: Conversation[] = [
  {
    id: "1",
    customerName: "Maria Silva",
    profileName: "Dr. João - Cardiologia",
    lastMessage: "Gostaria de agendar uma consulta para próxima semana",
    timestamp: "2 min atrás",
    status: "active"
  },
  {
    id: "2",
    customerName: "Pedro Santos",
    profileName: "Dra. Ana - Dermatologia",
    lastMessage: "Obrigado pelo agendamento!",
    timestamp: "15 min atrás",
    status: "completed"
  },
  {
    id: "3",
    customerName: "Julia Costa",
    profileName: "Dr. Carlos - Ortopedia",
    lastMessage: "Poderia reagendar minha consulta?",
    timestamp: "1 hora atrás",
    status: "pending"
  },
  {
    id: "4",
    customerName: "Roberto Lima",
    profileName: "Dra. Fernanda - Pediatria",
    lastMessage: "Consulta confirmada para amanhã às 14h",
    timestamp: "2 horas atrás",
    status: "completed"
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

export function RecentConversations() {
  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle>Conversas Recentes</CardTitle>
        <CardDescription>Últimas conversas registradas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <div key={conversation.id} className="flex items-start space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-muted">
                  {conversation.customerName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium leading-none">
                    {conversation.customerName}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    <div className={`w-2 h-2 rounded-full mr-1 ${statusColors[conversation.status]}`} />
                    {statusLabels[conversation.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground font-medium">
                  {conversation.profileName}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.lastMessage}
                </p>
                <p className="text-xs text-muted-foreground">
                  {conversation.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}