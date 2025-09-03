import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, ArrowLeft, Phone, MoreVertical, Edit, Trash2 } from "lucide-react"
import { useMessages } from "@/hooks/use-messages"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface ChatPanelProps {
  conversationId: string
  contactName: string
  contactPhone: string
  lastActivity?: string
  conversationCreatedAt?: string
  conversation: any
  onBack?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function ChatPanel({ conversationId, contactName, contactPhone, lastActivity, conversationCreatedAt, conversation, onBack, onEdit, onDelete }: ChatPanelProps) {
  const { messages, loading, fetchMessages, sendMessage } = useMessages()
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId)
    }
  }, [conversationId])

  // Auto-scroll to bottom when messages load or change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100)
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      await sendMessage(conversationId, newMessage.trim())
      setNewMessage("")
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const copyPhoneNumber = () => {
    navigator.clipboard.writeText(contactPhone)
    toast({
      title: "Telefone copiado",
      description: "O número foi copiado para a área de transferência.",
    })
  }

  const openWhatsApp = () => {
    const cleanPhone = contactPhone.replace(/\D/g, '')
    window.open(`https://wa.me/${cleanPhone}`, '_blank')
  }

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatConversationTimestamp = (dateString?: string) => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffInDays === 1) {
      return 'ontem'
    } else if (diffInDays < 7) {
      return `${diffInDays} dias atrás`
    } else {
      return date.toLocaleDateString('pt-BR')
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <Avatar className="h-10 w-10">
          {conversation?.contact_avatar_url && (
            <AvatarImage src={conversation.contact_avatar_url} alt={contactName} />
          )}
          <AvatarFallback className="bg-primary text-primary-foreground">
            {contactName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{contactName}</h3>
            {(lastActivity || conversationCreatedAt) && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                • {formatConversationTimestamp(lastActivity || conversationCreatedAt)}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{contactPhone}</p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50 bg-background">
            {onEdit && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Editar contato
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir conversa
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={copyPhoneNumber}>
              <Phone className="mr-2 h-4 w-4" />
              Copiar número
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openWhatsApp}>
              <Phone className="mr-2 h-4 w-4" />
              Abrir no WhatsApp
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 min-h-0 p-4">
        <div className="space-y-4">
          {loading && messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Carregando mensagens...
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma mensagem nesta conversa
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
                    message.sender_type === 'agent'
                      ? 'bg-primary text-primary-foreground ml-auto'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="flex justify-end mt-1">
                    <span
                      className={`text-xs ${
                        message.sender_type === 'agent'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite uma mensagem..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}