"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MessageSquare, User, Clock } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Conversation = {
  id: string
  title: string
  last_message: string
  created_at: string
  updated_at: string
  patient_name: string
  status: "active" | "waiting" | "closed"
}

interface RecentConversationsProps {
  isLoading?: boolean
}

export function RecentConversations({ isLoading = false }: RecentConversationsProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    // Dados mockados para demonstração
    const mockConversations: Conversation[] = [
      {
        id: "1",
        title: "Consulta de Rotina",
        last_message: "Obrigado doutor, até a próxima consulta!",
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        patient_name: "Maria Silva",
        status: "closed"
      },
      {
        id: "2", 
        title: "Dúvida sobre Medicação",
        last_message: "Posso tomar o remédio com leite?",
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        patient_name: "João Santos",
        status: "waiting"
      },
      {
        id: "3",
        title: "Agendamento Urgente", 
        last_message: "Preciso remarcar minha consulta para amanhã",
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        patient_name: "Ana Costa",
        status: "active"
      },
      {
        id: "4",
        title: "Resultados de Exames",
        last_message: "Quando saem os resultados dos meus exames?",
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), 
        updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        patient_name: "Pedro Lima",
        status: "waiting"
      },
      {
        id: "5",
        title: "Acompanhamento Pós-Consulta",
        last_message: "Como está se sentindo após o tratamento?",
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        patient_name: "Carla Oliveira",
        status: "active"
      }
    ]
    
    setConversations(mockConversations)
  }, [])

  function formatDate(dateString: string) {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      })
    } catch (error) {
      return "Data inválida"
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Ativo</Badge>
      case "waiting":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Aguardando</Badge>
      case "closed":
        return <Badge variant="secondary">Finalizado</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Nenhuma conversa recente</p>
        <p className="text-sm text-muted-foreground">
          As conversas com pacientes aparecerão aqui
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => (
        <Card key={conversation.id} className="border-border/50 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                  <User className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-foreground truncate">
                      {conversation.patient_name}
                    </h4>
                    {getStatusBadge(conversation.status)}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {conversation.title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.last_message}
                  </p>
                  <div className="flex items-center mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(conversation.updated_at)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}