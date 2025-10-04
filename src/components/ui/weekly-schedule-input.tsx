import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  [key: string]: TimeSlot[];
}

interface WeeklyScheduleInputProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

const WEEKDAYS = [
  { key: 'monday', label: 'Segunda' },
  { key: 'tuesday', label: 'Terça' },
  { key: 'wednesday', label: 'Quarta' },
  { key: 'thursday', label: 'Quinta' },
  { key: 'friday', label: 'Sexta' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

export const WeeklyScheduleInput: React.FC<WeeklyScheduleInputProps> = ({
  value = "",
  onChange,
  className
}) => {
  const [schedule, setSchedule] = React.useState<DaySchedule>({});
  const [editingSlot, setEditingSlot] = React.useState<{
    day: string;
    index?: number;
    start: string;
    end: string;
  } | null>(null);

  // Converter string simples para JSON estruturado
  const parseWorkingHours = (value: string): DaySchedule => {
    try {
      // Tentar parsear como JSON primeiro
      return JSON.parse(value);
    } catch {
      // Se falhar, tentar converter formato string simples (ex: "Seg-Sex, 08:00-17:00")
      const schedule: DaySchedule = {};
      if (value && value.includes(',')) {
        const [days, hours] = value.split(',').map(s => s.trim());
        const [start, end] = hours.split('-').map(s => s.trim());
        
        // Mapear dias da semana
        const dayMap: { [key: string]: string } = {
          'seg': 'monday', 'segunda': 'monday',
          'ter': 'tuesday', 'terça': 'tuesday',
          'qua': 'wednesday', 'quarta': 'wednesday',
          'qui': 'thursday', 'quinta': 'thursday',
          'sex': 'friday', 'sexta': 'friday',
          'sab': 'saturday', 'sábado': 'saturday',
          'dom': 'sunday', 'domingo': 'sunday'
        };
        
        if (days.toLowerCase().includes('sex')) {
          // "Seg-Sex" = Segunda a Sexta
          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
            schedule[day] = [{ start, end }];
          });
        }
      }
      return schedule;
    }
  };

  // Inicializar schedule a partir do value
  React.useEffect(() => {
    if (value) {
      const parsed = parseWorkingHours(value);
      setSchedule(parsed);
    } else {
      setSchedule({});
    }
  }, [value]);

  // Removed automatic onChange trigger to prevent modal closing during edit

  // Não dispara onChange durante edição individual
  const updateSchedule = (newSchedule: DaySchedule) => {
    setSchedule(newSchedule);
  };

  // Só dispara onChange quando usuário confirma o salvamento
  const confirmUpdateSchedule = (newSchedule: DaySchedule) => {
    setSchedule(newSchedule);
    const scheduleJson = JSON.stringify(newSchedule);
    onChange?.(scheduleJson);
  };

  const addTimeSlot = (day: string) => {
    setEditingSlot({
      day,
      start: '09:00',
      end: '17:00'
    });
  };

  const saveTimeSlot = () => {
    if (!editingSlot) return;

    const newSchedule = { ...schedule };
    if (!newSchedule[editingSlot.day]) {
      newSchedule[editingSlot.day] = [];
    }

    const slot = {
      start: editingSlot.start,
      end: editingSlot.end
    };

    if (editingSlot.index !== undefined) {
      newSchedule[editingSlot.day][editingSlot.index] = slot;
    } else {
      newSchedule[editingSlot.day].push(slot);
    }

    confirmUpdateSchedule(newSchedule);
    setEditingSlot(null);
  };

  const removeTimeSlot = (day: string, index: number) => {
    const newSchedule = { ...schedule };
    if (newSchedule[day]) {
      newSchedule[day].splice(index, 1);
      if (newSchedule[day].length === 0) {
        delete newSchedule[day];
      }
    }
    confirmUpdateSchedule(newSchedule);
  };

  const editTimeSlot = (day: string, index: number) => {
    const slot = schedule[day]?.[index];
    if (slot) {
      setEditingSlot({
        day,
        index,
        start: slot.start,
        end: slot.end
      });
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Label className="text-base font-medium">Horários de Atendimento</Label>
      
      <div className="space-y-3">
        {WEEKDAYS.map((weekday) => (
          <div key={weekday.key} className="flex items-center gap-3">
            <div className="w-16 text-sm font-medium">
              {weekday.label}:
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {schedule[weekday.key]?.map((slot, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm cursor-pointer hover:bg-muted/80"
                  onClick={() => editTimeSlot(weekday.key, index)}
                >
                  <span>{slot.start}-{slot.end}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeTimeSlot(weekday.key, index);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addTimeSlot(weekday.key);
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {editingSlot && (
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Adicionar horário - {WEEKDAYS.find(d => d.key === editingSlot.day)?.label}
              </Label>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Início</Label>
                  <Input
                    type="time"
                    value={editingSlot.start}
                    onChange={(e) => setEditingSlot({ ...editingSlot, start: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Final</Label>
                  <Input
                    type="time"
                    value={editingSlot.end}
                    onChange={(e) => setEditingSlot({ ...editingSlot, end: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingSlot(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="button"
                  size="sm" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    saveTimeSlot();
                  }}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};