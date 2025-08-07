import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConversationSummary } from "@/hooks/use-conversation-summaries";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot } from "lucide-react";

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ConversationSummary | null;
  loading: boolean;
  contactName?: string;
}

export const SummaryModal = ({ isOpen, onClose, summary, loading, contactName }: SummaryModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Resumo da Conversa - {contactName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : summary ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-foreground whitespace-pre-wrap">{summary.summary_text}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                Resumo gerado em: {new Date(summary.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Resumo não disponível para esta conversa</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};