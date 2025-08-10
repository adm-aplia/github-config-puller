import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface Conversation {
  id: string
  contact_name: string | null
  contact_phone: string
  status: string
  last_message_at: string | null
  created_at: string
  professional_profile?: {
    fullname: string
    specialty: string
  }
  latest_message?: {
    content: string
    created_at: string
  }
}


export function RecentConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchRecentConversations()
  }, [])

  const fetchRecentConversations = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user?.id) throw new Error('User not authenticated')

      // First fetch conversations separately
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          contact_name,
          contact_phone,
          status,
          last_message_at,
          created_at,
          agent_id
        `)
        .eq('user_id', userData.user.id)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(5)

      if (conversationsError) throw conversationsError

      // Fetch professional profiles and latest messages in parallel
      const conversationsWithDetails = await Promise.all(
        (conversationsData || []).map(async (conversation) => {
          // Fetch professional profile if agent_id exists
          let professional_profile = null
          if (conversation.agent_id) {
            const { data: profileData } = await supabase
              .from('professional_profiles')
              .select('fullname, specialty')
              .eq('id', conversation.agent_id)
              .maybeSingle()
            professional_profile = profileData
          }

          // Fetch latest message
          const { data: messageData } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          return {
            ...conversation,
            professional_profile,
            latest_message: messageData
          }
        })
      )

      setConversations(conversationsWithDetails)
    } catch (error) {
      console.error('Error fetching recent conversations:', error)
      toast({
        title: 'Erro ao carregar conversas',
        description: 'Não foi possível carregar as conversas recentes.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'agora'
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h atrás`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d atrás`
  }

  if (loading) {
    return (
      <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle>Conversas Recentes</CardTitle>
          <CardDescription>Últimas conversas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle>Conversas Recentes</CardTitle>
        <CardDescription>Últimas conversas registradas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma conversa encontrada</p>
              <p className="text-sm">As conversas aparecerão aqui conforme forem criadas</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div key={conversation.id} className="flex items-start space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-muted">
                    {(conversation.contact_name || conversation.contact_phone).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-sm font-medium leading-none">
                    {conversation.contact_name || conversation.contact_phone}
                  </p>
                  {conversation.professional_profile && (
                    <p className="text-sm text-muted-foreground font-medium">
                      {conversation.professional_profile.fullname} - {conversation.professional_profile.specialty}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.latest_message?.content || 'Nenhuma mensagem'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimestamp(conversation.latest_message?.created_at || conversation.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}