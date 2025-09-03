import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMessages, Message } from "@/hooks/use-messages";
import { useEffect, useState } from "react";
import { Send, ArrowLeft, Phone, MoreVertical, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  contactName: string;
  contactPhone: string;
  lastActivity?: string;
  conversationCreatedAt?: string;
  conversation: any;
}

export const ChatModal = ({ isOpen, onClose, conversationId, contactName, contactPhone, lastActivity, conversationCreatedAt, conversation }: ChatModalProps) => {
  const { messages, loading, fetchMessages, sendMessage } = useMessages();
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (isOpen && conversationId) {
      fetchMessages(conversationId);
    }
  }, [isOpen, conversationId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    await sendMessage(conversationId, newMessage, 'agent');
    setNewMessage("");
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handlePhoneCall = () => {
    // Criar link para fazer chamada
    window.open(`tel:${contactPhone}`, '_self');
  };

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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 flex flex-col [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-10 w-10">
              {conversation?.contact_avatar_url && (
                <AvatarImage src={conversation.contact_avatar_url} alt={contactName} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(contactName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{contactName}</h3>
                {(lastActivity || conversationCreatedAt) && (
                  <span className="text-xs text-muted-foreground">
                    • {formatConversationTimestamp(lastActivity || conversationCreatedAt)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{contactPhone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handlePhoneCall}>
              <Phone className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(contactPhone)}>
                  Copiar número
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`https://wa.me/${contactPhone.replace(/\D/g, '')}`, '_blank')}>
                  Abrir WhatsApp
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-12 w-64 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_type === 'user' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_type === 'user'
                        ? 'bg-muted text-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_type === 'user'
                        ? 'text-muted-foreground'
                        : 'text-primary-foreground/70'
                    }`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma mensagem ainda</p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t bg-background">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendMessage();
                }
              }}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};