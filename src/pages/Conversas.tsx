
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Filter, MessageSquare, Clock, Bot, MoreVertical, Edit, Trash2, Check, X } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { useConversations, Conversation } from "@/hooks/use-conversations"
import { useConversationSummaries, ConversationSummary } from "@/hooks/use-conversation-summaries"
import { SummaryModal } from "@/components/conversation/summary-modal"
import { ChatPanel } from "@/components/conversation/chat-panel"
import { ConversationEditModal } from "@/components/conversation/conversation-edit-modal"
import { ConversationFiltersModal, ConversationFilters } from "@/components/conversations/conversation-filters-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { useState, useEffect, useMemo } from "react"


export default function ConversasPage() {
  const { conversations, loading, updateConversation, deleteConversation, deleteConversations } = useConversations();
  const { fetchSummary, loading: summaryLoading } = useConversationSummaries();
  const [selectedSummary, setSelectedSummary] = useState<ConversationSummary | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [selectedContactName, setSelectedContactName] = useState<string>("");
  
  // Selected conversation for chat panel
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedConversationData, setSelectedConversationData] = useState<Conversation | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  
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

  // Bulk selection states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Reset modal state on component mount
  useEffect(() => {
    setIsEditModalOpen(false);
  }, []);

  const handleSummaryClick = async (conversationId: string, contactName: string) => {
    setSelectedContactName(contactName);
    setIsSummaryModalOpen(true);
    const summary = await fetchSummary(conversationId);
    setSelectedSummary(summary);
  };

  const handleConversationClick = (conversation: Conversation) => {
    if (selectionMode) {
      handleToggleSelection(conversation.id);
    } else {
      setSelectedConversationId(conversation.id);
      setSelectedConversationData(conversation);
      setShowMobileChat(true); // For mobile
    }
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
      // Close chat panel if the deleted conversation was open
      if (selectedConversationId === conversationToDelete.id) {
        setSelectedConversationId(null);
        setSelectedConversationData(null);
        setShowMobileChat(false);
      }
    }
    
    setIsDeleteConfirmOpen(false);
    setConversationToDelete(null);
  };

  const handleEditSaved = () => {
    setIsEditModalOpen(false);
    setConversationBeingEdited(null);
    // Update selectedConversationData with the updated conversation
    if (selectedConversationId && conversationBeingEdited) {
      const updatedConversation = conversations.find(c => c.id === selectedConversationId);
      if (updatedConversation) {
        setSelectedConversationData(updatedConversation);
      }
    }
  };

  const handleBack = () => {
    setSelectedConversationId(null);
    setSelectedConversationData(null);
    setShowMobileChat(false);
  };

  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredConversations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredConversations.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    const success = await deleteConversations(ids);
    
    if (success) {
      // Close chat panel if the deleted conversation was open
      if (selectedConversationId && ids.includes(selectedConversationId)) {
        handleBack();
      }
      
      // Clear selection and exit selection mode
      setSelectedIds(new Set());
      setSelectionMode(false);
    }
    
    setIsBulkDeleteConfirmOpen(false);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
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

  // Auto-select first conversation when conversations load
  useEffect(() => {
    if (filteredConversations.length > 0 && !selectedConversationId) {
      const firstConversation = filteredConversations[0];
      setSelectedConversationId(firstConversation.id);
      setSelectedConversationData(firstConversation);
    } else if (filteredConversations.length === 0) {
      setSelectedConversationId(null);
      setSelectedConversationData(null);
      setShowMobileChat(false);
    }
  }, [filteredConversations, selectedConversationId]);

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
      <div className="container mx-auto px-6 py-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Conversas</h1>
              <p className="text-muted-foreground">Gerencie todas as conversas dos seus assistentes</p>
            </div>
          </div>

          {/* WhatsApp-style layout */}
          <Card className="h-[calc(100vh-12rem)] overflow-hidden">
            <CardContent className="p-0 h-full">
              <div className="flex h-full min-h-0">
                {/* Conversation List - Left Panel */}
                <div className={`w-full md:w-[360px] border-r bg-muted/20 flex flex-col min-h-0 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
                  {/* Search and Filters Header */}
                <div className="p-4 border-b bg-background">
                  {selectionMode ? (
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={exitSelectionMode}>
                          <X className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
                          {selectedIds.size} selecionada{selectedIds.size !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleSelectAll}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          {selectedIds.size === filteredConversations.length ? 'Desmarcar' : 'Selecionar'} todas
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => setIsBulkDeleteConfirmOpen(true)}
                          disabled={selectedIds.size === 0}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir selecionadas
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input 
                          placeholder="Buscar conversas..." 
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setFiltersModalOpen(true)}
                      >
                        <Filter className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectionMode(true)}
                      >
                        Selecionar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Conversations List */}
                <ScrollArea className="flex-1">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <p className="text-muted-foreground text-sm">
                        {searchTerm.trim() || filters.professionalIds.length > 0 
                          ? "Nenhuma conversa encontrada" 
                          : "Nenhuma conversa ainda"
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredConversations.map((conversation) => (
                        <div 
                          key={conversation.id} 
                          className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                            selectedConversationId === conversation.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => handleConversationClick(conversation)}
                        >
                          <div className="flex items-start gap-3">
                            {selectionMode && (
                              <div className="pt-2">
                                <Checkbox
                                  checked={selectedIds.has(conversation.id)}
                                  onCheckedChange={() => handleToggleSelection(conversation.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            )}
                            
                            <Avatar className="h-12 w-12 flex-shrink-0">
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                {(conversation.contact_name || conversation.contact_phone).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-medium text-sm truncate">
                                  {conversation.contact_name || conversation.contact_phone}
                                </h3>
                                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                  {conversation.last_message_at ? formatTimestamp(conversation.last_message_at) : 'N/A'}
                                </span>
                              </div>
                              
                              {conversation.profile_name && (
                                <p className="text-xs text-muted-foreground mb-1 truncate">
                                  {conversation.profile_name}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground truncate flex-1">
                                  {conversation.last_message}
                                </p>
                                
                                {!selectionMode && (
                                  <div className="flex items-center gap-1 ml-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSummaryClick(conversation.id, conversation.contact_name || conversation.contact_phone);
                                      }}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Bot className="h-3 w-3" />
                                    </Button>
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => e.stopPropagation()}
                                          className="h-6 w-6 p-0"
                                        >
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-32 z-50 bg-background">
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditClick(conversation);
                                          }}
                                        >
                                          <Edit className="mr-2 h-3 w-3" />
                                          Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(conversation);
                                          }}
                                          className="text-destructive"
                                        >
                                          <Trash2 className="mr-2 h-3 w-3" />
                                          Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Chat Panel - Right Panel */}
              <div className="flex-1 flex flex-col">
                {selectedConversationId && selectedConversationData && (
                  <div className={`flex-1 ${showMobileChat && 'md:block hidden'}`}>
                    <ChatPanel
                      conversationId={selectedConversationId}
                      contactName={selectedConversationData.contact_name || selectedConversationData.contact_phone}
                      contactPhone={selectedConversationData.contact_phone}
                      onBack={handleBack}
                      onEdit={() => {
                        setConversationBeingEdited(selectedConversationData);
                        setIsEditModalOpen(true);
                      }}
                      onDelete={() => handleDeleteClick(selectedConversationData)}
                    />
                  </div>
                )}
                
                {/* Mobile chat overlay */}
                {showMobileChat && selectedConversationData && (
                  <div className="md:hidden fixed inset-0 z-40 bg-background">
                    <ChatPanel
                      conversationId={selectedConversationId!}
                      contactName={selectedConversationData.contact_name || selectedConversationData.contact_phone}
                      contactPhone={selectedConversationData.contact_phone}
                      onBack={handleBack}
                      onEdit={() => {
                        setConversationBeingEdited(selectedConversationData);
                        setIsEditModalOpen(true);
                      }}
                      onDelete={() => handleDeleteClick(selectedConversationData)}
                    />
                  </div>
                )}
              </div>
              </div>
            </CardContent>
          </Card>
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

        <AlertDialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir conversas selecionadas</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isto irá excluir permanentemente {selectedIds.size} conversa{selectedIds.size !== 1 ? 's' : ''}, 
                todas as mensagens e resumos associados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir {selectedIds.size} conversa{selectedIds.size !== 1 ? 's' : ''}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  )
}
