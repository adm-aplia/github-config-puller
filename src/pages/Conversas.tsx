
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, MessageSquare, Clock, Bot, MoreVertical, Edit, Trash2 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useConversations, Conversation } from "@/hooks/use-conversations"
import { useConversationSummaries, ConversationSummary } from "@/hooks/use-conversation-summaries"
import { SummaryModal } from "@/components/conversation/summary-modal"
import { ChatModal } from "@/components/conversation/chat-modal"
import { ConversationEditModal } from "@/components/conversation/conversation-edit-modal"
import { ConversationFiltersModal, ConversationFilters } from "@/components/conversations/conversation-filters-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect, useMemo } from "react"


export default function ConversasPage() {
  const { conversations, loading, updateConversation, deleteConversation } = useConversations();
  const { fetchSummary, loading: summaryLoading } = useConversationSummaries();
  const [selectedSummary, setSelectedSummary] = useState<ConversationSummary | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedContactName, setSelectedContactName] = useState<string>("");
  
  // Chat modal states
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  
  // Edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [conversationBeingEdited, setConversationBeingEdited] = useState<Conversation | null>(null);
  
  // Delete confirmation states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  
  // Search and filters states
  const [searchTerm, setSearchTerm] = useState("");
  const [filtersModalOpen, setFiltersModalOpen] = useState(false);
  const [filters, setFilters] = useState<ConversationFilters>({
    professionalIds: [],
    dateFrom: undefined,
    dateTo: undefined,
    messageCountRange: [0, 100]
  });

  const handleSummaryClick = async (conversationId: string, contactName: string) => {
    setSelectedContactName(contactName);
    setIsSummaryModalOpen(true);
    const summary = await fetchSummary(conversationId);
    setSelectedSummary(summary);
  };

  const handleConversationClick = (conversation: any) => {
    setSelectedConversation(conversation);
    setIsChatModalOpen(true);
  };

  const handleEditClick = (conversation: Conversation) => {
    setConversationBeingEdited(conversation);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (conversation: Conversation) => {
    setConversationToDelete(conversation);
    setIsDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!conversationToDelete) return;
    
    const success = await deleteConversation(conversationToDelete.id);
    if (success) {
      // Close chat modal if the deleted conversation was open
      if (selectedConversation?.id === conversationToDelete.id) {
        setIsChatModalOpen(false);
        setSelectedConversation(null);
      }
    }
    
    setIsDeleteConfirmOpen(false);
    setConversationToDelete(null);
  };

  const handleEditSaved = () => {
    setIsEditModalOpen(false);
    setConversationBeingEdited(null);
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return "Agora mesmo";
    if (hours < 24) return `${hours}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  // Filter and search conversations
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    // Apply search
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(conv => 
        (conv.contact_name?.toLowerCase().includes(search)) ||
        (conv.contact_phone?.includes(search)) ||
        (conv.last_message?.toLowerCase().includes(search)) ||
        (conv.profile_name?.toLowerCase().includes(search))
      );
    }

    // Apply filters
    if (filters.professionalIds.length > 0) {
      filtered = filtered.filter(conv => 
        conv.agent_id && filters.professionalIds.includes(conv.agent_id)
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(conv => 
        conv.last_message_at && new Date(conv.last_message_at) >= filters.dateFrom!
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(conv => 
        conv.last_message_at && new Date(conv.last_message_at) <= filters.dateTo!
      );
    }

    // Apply message count range
    if (filters.messageCountRange[0] > 0 || filters.messageCountRange[1] < 100) {
      filtered = filtered.filter(conv => {
        const messageCount = conv.message_count || 0;
        return messageCount >= filters.messageCountRange[0] && 
               (filters.messageCountRange[1] >= 100 ? true : messageCount <= filters.messageCountRange[1]);
      });
    }

    return filtered;
  }, [conversations, searchTerm, filters]);

  const applyFilters = () => {
    // Filters are applied automatically via useMemo
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Conversas</h1>
              <p className="text-muted-foreground">Gerencie todas as conversas dos seus assistentes</p>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Conversas</h1>
              <p className="text-muted-foreground">Gerencie todas as conversas dos seus assistentes</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Buscar conversas..." 
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setFiltersModalOpen(true)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>

          {filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm.trim() || filters.professionalIds.length > 0 
                  ? "Nenhuma conversa encontrada com os filtros aplicados" 
                  : "Nenhuma conversa encontrada"
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredConversations.map((conversation) => (
                <Card 
                  key={conversation.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleConversationClick(conversation)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                          <MessageSquare className="h-6 w-6 text-muted-foreground" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="mb-1">
                            <h3 className="font-semibold text-foreground">
                              {conversation.contact_name || conversation.contact_phone}
                            </h3>
                          </div>
                          
                          {conversation.profile_name && (
                            <p className="text-sm text-muted-foreground font-medium mb-2">
                              {conversation.profile_name}
                            </p>
                          )}
                          
                          <p className="text-sm text-foreground line-clamp-2">
                            {conversation.last_message}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {conversation.last_message_at ? formatTimestamp(conversation.last_message_at) : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {conversation.message_count || 0} mensagens
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSummaryClick(conversation.id, conversation.contact_name || conversation.contact_phone);
                            }}
                            className="text-xs"
                          >
                            <Bot className="h-3 w-3 mr-1" />
                            Resumo IA
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(conversation);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(conversation);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <SummaryModal
          isOpen={isSummaryModalOpen}
          onClose={() => {
            setIsSummaryModalOpen(false);
            setSelectedSummary(null);
          }}
          summary={selectedSummary}
          loading={summaryLoading}
          contactName={selectedContactName}
        />

        <ChatModal
          isOpen={isChatModalOpen}
          onClose={() => {
            setIsChatModalOpen(false);
            setSelectedConversation(null);
          }}
          conversationId={selectedConversation?.id || ""}
          contactName={selectedConversation?.contact_name || selectedConversation?.contact_phone || ""}
          contactPhone={selectedConversation?.contact_phone || ""}
        />

        <ConversationFiltersModal
          open={filtersModalOpen}
          onOpenChange={setFiltersModalOpen}
          filters={filters}
          onFiltersChange={setFilters}
          onApplyFilters={applyFilters}
        />

        <ConversationEditModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          conversation={conversationBeingEdited}
          onSaved={handleEditSaved}
          onUpdate={updateConversation}
        />

        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir conversa</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isto irá excluir permanentemente a conversa, 
                todas as mensagens e resumos associados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
