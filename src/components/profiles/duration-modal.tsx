import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';

interface DurationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDuration: number;
  onSave: (minutes: number) => void;
}

const QUICK_DURATIONS = [15, 30, 45, 60, 90];

export const DurationModal: React.FC<DurationModalProps> = ({
  open,
  onOpenChange,
  initialDuration,
  onSave
}) => {
  const [selectedDuration, setSelectedDuration] = useState(initialDuration);
  const [customDuration, setCustomDuration] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedDuration(initialDuration);
      const isQuickDuration = QUICK_DURATIONS.includes(initialDuration);
      setIsCustom(!isQuickDuration);
      setCustomDuration(!isQuickDuration ? initialDuration.toString() : '');
    }
  }, [open, initialDuration]);

  const handleQuickSelect = (minutes: number) => {
    setSelectedDuration(minutes);
    setIsCustom(false);
    setCustomDuration('');
  };

  const handleCustomChange = (value: string) => {
    setCustomDuration(value);
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      setSelectedDuration(num);
      setIsCustom(true);
    }
  };

  const handleSave = () => {
    onSave(selectedDuration);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Definir Duração
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Botões Rápidos */}
          <div className="space-y-2">
            <Label>Durações Rápidas</Label>
            <div className="grid grid-cols-5 gap-2">
              {QUICK_DURATIONS.map(minutes => (
                <Button
                  key={minutes}
                  type="button"
                  variant={selectedDuration === minutes && !isCustom ? "default" : "outline"}
                  onClick={() => handleQuickSelect(minutes)}
                >
                  {minutes}min
                </Button>
              ))}
            </div>
          </div>

          {/* Campo Personalizado */}
          <div className="space-y-2">
            <Label htmlFor="custom-duration">Duração Personalizada (minutos)</Label>
            <Input
              id="custom-duration"
              type="number"
              min="1"
              max="999"
              value={customDuration}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="Ex: 120"
            />
          </div>

          {/* Preview */}
          <div className="text-sm text-muted-foreground text-center p-3 bg-muted rounded-lg">
            Duração selecionada: <span className="font-semibold text-foreground">{selectedDuration} minutos</span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
