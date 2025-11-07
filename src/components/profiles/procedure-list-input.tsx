import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, Clock } from 'lucide-react';
import { DurationModal } from './duration-modal';
import { cn } from '@/lib/utils';

export interface Procedure {
  id: string;
  name: string;
  customName?: string;
  duration: number;
  value?: string;
  hideValue: boolean;
}

interface ProcedureListInputProps {
  value: Procedure[];
  onChange: (procedures: Procedure[]) => void;
  className?: string;
}

const PROCEDURE_TYPES = [
  'Primeira Consulta',
  'Consulta Padrão',
  'Retorno',
  'Botox',
  'Limpeza Dental',
  'Outro'
];

export const ProcedureListInput: React.FC<ProcedureListInputProps> = ({
  value = [],
  onChange,
  className
}) => {
  const [durationModalOpen, setDurationModalOpen] = useState(false);
  const [editingProcedureId, setEditingProcedureId] = useState<string | null>(null);

  const addProcedure = () => {
    const newProcedure: Procedure = {
      id: `proc-${Date.now()}`,
      name: 'Consulta Padrão',
      duration: 60,
      hideValue: true
    };
    onChange([...value, newProcedure]);
  };

  const removeProcedure = (id: string) => {
    onChange(value.filter(p => p.id !== id));
  };

  const updateProcedure = (id: string, updates: Partial<Procedure>) => {
    onChange(value.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const openDurationModal = (id: string) => {
    setEditingProcedureId(id);
    setDurationModalOpen(true);
  };

  const saveDuration = (minutes: number) => {
    if (editingProcedureId) {
      updateProcedure(editingProcedureId, { duration: minutes });
    }
    setDurationModalOpen(false);
    setEditingProcedureId(null);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Lista de Procedimentos */}
      <div className="space-y-3">
        {value.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
            <p className="text-sm text-muted-foreground">
              Nenhum procedimento adicionado. Clique em "+ Adicionar" para começar.
            </p>
          </div>
        ) : (
          value.map((procedure) => (
            <div
              key={procedure.id}
              className="grid grid-cols-1 md:grid-cols-[2fr_1fr_2fr_auto] gap-3 p-3 border rounded-lg bg-card animate-fade-in"
            >
              {/* Campo 1: Procedimento */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Procedimento</Label>
                <div className="space-y-2">
                  <Select
                    value={procedure.name}
                    onValueChange={(value) => updateProcedure(procedure.id, { 
                      name: value,
                      customName: value === 'Outro' ? procedure.customName : undefined
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROCEDURE_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {procedure.name === 'Outro' && (
                    <Input
                      placeholder="Digite o nome do procedimento"
                      value={procedure.customName || ''}
                      onChange={(e) => updateProcedure(procedure.id, { customName: e.target.value })}
                    />
                  )}
                </div>
              </div>

              {/* Campo 2: Duração */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Duração</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => openDurationModal(procedure.id)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  {formatDuration(procedure.duration)}
                </Button>
              </div>

              {/* Campo 3: Valor */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Valor</Label>
                <div className="space-y-2">
                  <CurrencyInput
                    value={procedure.hideValue ? '' : procedure.value || ''}
                    onChange={(value) => updateProcedure(procedure.id, { value })}
                    disabled={procedure.hideValue}
                    placeholder="0,00"
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`hide-${procedure.id}`}
                      checked={procedure.hideValue}
                      onCheckedChange={(checked) => 
                        updateProcedure(procedure.id, { 
                          hideValue: checked as boolean,
                          value: checked ? undefined : procedure.value
                        })
                      }
                    />
                    <label
                      htmlFor={`hide-${procedure.id}`}
                      className="text-xs text-muted-foreground cursor-pointer"
                    >
                      Não informar valores
                    </label>
                  </div>
                </div>
              </div>

              {/* Botão Remover */}
              <div className="flex items-end md:items-center justify-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProcedure(procedure.id)}
                  className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Botão Adicionar */}
      <Button
        type="button"
        variant="outline"
        onClick={addProcedure}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Procedimento
      </Button>

      {/* Modal de Duração */}
      {editingProcedureId && (
        <DurationModal
          open={durationModalOpen}
          onOpenChange={setDurationModalOpen}
          initialDuration={value.find(p => p.id === editingProcedureId)?.duration || 60}
          onSave={saveDuration}
        />
      )}
    </div>
  );
};
