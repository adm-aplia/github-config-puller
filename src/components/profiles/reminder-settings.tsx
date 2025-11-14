import React, { useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Bell, ChevronDown, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ReminderSettingsProps {
  remindersEnabled: boolean;
  onRemindersEnabledChange: (enabled: boolean) => void;
  reminderMessage: string;
  onReminderMessageChange: (message: string) => void;
  reminderHoursBefore: number;
  onReminderHoursBeforeChange: (hours: number) => void;
  customReminderTime?: string;
  onCustomReminderTimeChange?: (time: string) => void;
}

const DEFAULT_REMINDER_MESSAGE = "Olá [Nome do Paciente] seu atendimento está agendado para [Data e Hora da Consulta] no endereço [Local de Atendimento]. Estamos te aguardando!";

const REMINDER_VARIABLES = [
  { label: 'Nome do Paciente', value: '[Nome do Paciente]' },
  { label: 'Local de Atendimento', value: '[Local de Atendimento]' },
  { label: 'Nome Profissional', value: '[Nome Profissional]' },
  { label: 'Data e Hora da Consulta', value: '[Data e Hora da Consulta]' }
];

const REMINDER_OPTIONS = [
  { value: '24', label: '24 horas antes' },
  { value: '12', label: '12 horas antes' },
  { value: '2', label: '2 horas antes' },
  { value: '1', label: '1 hora antes' },
  { value: '0.5', label: '30 minutos antes' },
  { value: 'custom', label: 'Personalizado' }
];

export const ReminderSettings: React.FC<ReminderSettingsProps> = ({
  remindersEnabled,
  onRemindersEnabledChange,
  reminderMessage,
  onReminderMessageChange,
  reminderHoursBefore,
  onReminderHoursBeforeChange,
  customReminderTime,
  onCustomReminderTimeChange
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [reminderTimeType, setReminderTimeType] = React.useState<string>(
    REMINDER_OPTIONS.find(opt => parseFloat(opt.value) === reminderHoursBefore)?.value || 'custom'
  );
  const reminderMessageRef = useRef<HTMLTextAreaElement>(null);

  const handleReminderTimeChange = (value: string) => {
    setReminderTimeType(value);
    if (value !== 'custom') {
      onReminderHoursBeforeChange(parseFloat(value));
    }
  };

  const insertVariableAtCursor = (variable: string) => {
    const textarea = reminderMessageRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentMessage = reminderMessage || DEFAULT_REMINDER_MESSAGE;
    const newMessage = currentMessage.substring(0, start) + variable + currentMessage.substring(end);
    
    onReminderMessageChange(newMessage);
    
    // Restore cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  return (
    <div className="border-t pt-6 mt-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <div className="text-left">
              <h3 className="text-sm font-semibold">Configurações de Lembretes</h3>
              <p className="text-xs text-muted-foreground">Configure mensagens automáticas para pacientes</p>
            </div>
          </div>
          <ChevronDown className={cn(
            "h-5 w-5 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-4 space-y-4">
          {/* Toggle Ativar Lembretes */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="reminders-toggle" className="text-base font-medium">
                Ativar Lembretes
              </Label>
              <p className="text-xs text-muted-foreground">
                Enviar mensagens automáticas antes das consultas
              </p>
            </div>
            <Switch
              id="reminders-toggle"
              checked={remindersEnabled}
              onCheckedChange={onRemindersEnabledChange}
            />
          </div>

          {/* Campos de Configuração (aparecem apenas se ativado) */}
          {remindersEnabled && (
            <div className="space-y-4 animate-fade-in">
              {/* Mensagem de Lembrete */}
              <div className="space-y-2">
                <TooltipProvider>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="reminder-message">Mensagem de Lembrete</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="font-semibold mb-2">Variáveis disponíveis:</p>
                        <ul className="text-xs space-y-1">
                          <li><code>[Nome do Paciente]</code> - Nome do paciente</li>
                          <li><code>[Nome Profissional]</code> - Nome do profissional</li>
                          <li><code>[Data e Hora da Consulta]</code> - Data/hora agendada</li>
                          <li><code>[Local de Atendimento]</code> - Endereço do consultório</li>
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
                <Textarea
                  ref={reminderMessageRef}
                  id="reminder-message"
                  value={reminderMessage || DEFAULT_REMINDER_MESSAGE}
                  onChange={(e) => onReminderMessageChange(e.target.value)}
                  rows={4}
                  className="text-sm"
                />
                
                {/* Cards de Variáveis */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Clique para adicionar variáveis:
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {REMINDER_VARIABLES.map((variable) => (
                      <Card
                        key={variable.value}
                        className="p-3 cursor-pointer hover:bg-accent hover:border-primary transition-all"
                        onClick={() => insertVariableAtCursor(variable.value)}
                      >
                        <p className="text-xs font-medium text-center">
                          {variable.label}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onReminderMessageChange(DEFAULT_REMINDER_MESSAGE)}
                  className="text-xs"
                >
                  Restaurar mensagem padrão
                </Button>
              </div>

              {/* Quando Lembrar */}
              <div className="space-y-2">
                <Label htmlFor="reminder-time">Lembrar Antes da Consulta</Label>
                <Select value={reminderTimeType} onValueChange={handleReminderTimeChange}>
                  <SelectTrigger id="reminder-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Campo Personalizado */}
                {reminderTimeType === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <Label htmlFor="custom-time" className="text-xs text-muted-foreground">
                        Quantidade
                      </Label>
                      <Input
                        id="custom-time"
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={customReminderTime || reminderHoursBefore}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          onCustomReminderTimeChange?.(e.target.value);
                          if (!isNaN(value) && value > 0) {
                            onReminderHoursBeforeChange(value);
                          }
                        }}
                        placeholder="Ex: 2"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="custom-unit" className="text-xs text-muted-foreground">
                        Unidade
                      </Label>
                      <Select defaultValue="hours">
                        <SelectTrigger id="custom-unit">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hours">Horas</SelectItem>
                          <SelectItem value="days">Dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
