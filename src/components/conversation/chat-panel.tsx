import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, ArrowLeft, Phone, MoreVertical } from "lucide-react"
import { useMessages } from "@/hooks/use-messages"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface ChatPanelProps {
  conversationId: string
  contactName: string
  contactPhone: string
  onBack?: () => void // For mobile
}

export function ChatPanel({ conversationId, contactName, contactPhone, onBack }: ChatPanelProps) {
  const { messages, loading, fetchMessages, sendMessage } = useMessages()
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId)
    }
  }, [conversationId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
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

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-muted/30">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {contactName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{contactName}</h3>
          <p className="text-sm text-muted-foreground">{contactPhone}</p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
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
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
                  className={`max-w-[70%] p-3 rounded-lg shadow-sm ${
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