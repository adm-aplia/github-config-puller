import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProfessionalProfile } from '@/hooks/use-professional-profiles';
import { WeeklyScheduleInput } from '@/components/ui/weekly-schedule-input';
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { applyMask } from '@/lib/masks';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { ClickableStepIndicator } from './clickable-step-indicator';
import { ProcedureListInput, Procedure } from './procedure-list-input';
import { Card } from '@/components/ui/card';

interface ProfileFormProps {
  profile?: ProfessionalProfile;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ProfessionalProfile>) => Promise<boolean>;
}

// EXEMPLOS PRÉ-PREENCHIDOS
const DEFAULT_PROCEDURES: Procedure[] = [
  { id: '1', name: 'Consulta Padrão', duration: 60, value: '150,00', hideValue: false },
  { id: '2', name: 'Retorno', duration: 30, hideValue: true },
  { id: '3', name: 'Outro', customName: 'ECG', duration: 15, value: '50,00', hideValue: false }
];

const DEFAULT_WORKING_HOURS = JSON.stringify({
  monday: [{ start: '08:00', end: '18:00' }],
  tuesday: [{ start: '08:00', end: '18:00' }],
  wednesday: [{ start: '08:00', end: '18:00' }],
  thursday: [{ start: '08:00', end: '18:00' }],
  friday: [{ start: '08:00', end: '18:00' }],
  saturday: [{ start: '08:00', end: '13:00' }]
});

const DEFAULT_REMINDER_MESSAGE = "Olá [Nome do Paciente] seu atendimento está agendado para [Data e Hora da Consulta] no endereço [Local de Atendimento]. Estamos te aguardando!";

const REMINDER_VARIABLES = [
  { label: 'Nome do Paciente', value: '[Nome do Paciente]' },
  { label: 'Local de Atendimento', value: '[Local de Atendimento]' },
  { label: 'Nome do Profissional', value: '[Nome do Profissional]' },
  { label: 'Data e Hora da Consulta', value: '[Data e Hora da Consulta]' }
];

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<Partial<ProfessionalProfile & {
    procedures_json?: Procedure[];
  }>>({});
  const reminderMessageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (profile) {
      let proceduresJson = DEFAULT_PROCEDURES;
      if (profile.procedures) {
        try {
          proceduresJson = JSON.parse(profile.procedures);
        } catch {
          proceduresJson = DEFAULT_PROCEDURES;
        }
      }

      setFormData({
        ...profile,
        procedures_json: proceduresJson,
        reminders_enabled: profile.reminders_enabled || false,
        reminder_message: profile.reminder_message || DEFAULT_REMINDER_MESSAGE,
        reminder_hours_before: profile.reminder_hours_before || 24,
      });
      setCompletedSteps([1, 2, 3, 4, 5]);
    } else {
      setFormData({
        fullname: '',
        specialty: '',
        professionalid: '',
        phonenumber: '',
        education: '',
        instagram: '',
        locations: '',
        workinghours: '',
        procedures_json: DEFAULT_PROCEDURES,
        healthinsurance: '',
        paymentmethods: '',
        max_installments: 1,
        reminders_enabled: false,
        reminder_message: DEFAULT_REMINDER_MESSAGE,
        reminder_hours_before: 24
      });
      setCompletedSteps([]);
    }
    setCurrentStep(1);
  }, [profile, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading || currentStep < 5) return;
    
    setLoading(true);
    
    try {
      const dataToSubmit = {
        ...formData,
        procedures: JSON.stringify(formData.procedures_json || [])
      };
      delete dataToSubmit.procedures_json;

      const success = await onSubmit(dataToSubmit);
      
      if (success) {
        onClose();
        setCurrentStep(1);
        setCompletedSteps([]);
      }
    } catch (error) {
      console.error('[ProfileForm] Erro no submit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (canProceed()) {
      if (currentStep === 1 && !completedSteps.includes(1)) {
        setCompletedSteps(prev => [...prev, 1]);
      }
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch(currentStep) {
      case 1:
        return formData.fullname && formData.specialty && formData.education;
      case 2:
        return formData.locations && formData.workinghours;
      case 3:
        return formData.procedures_json && formData.procedures_json.length > 0;
      case 4:
        return formData.healthinsurance && formData.paymentmethods && formData.max_installments;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const canNavigateToStep = (step: number) => {
    // Sempre pode voltar para etapas anteriores
    if (step <= currentStep) return true;
    
    // Para avançar, verifica se a etapa 1 pode proceder (campos obrigatórios preenchidos)
    if (step > 1) {
      // Temporariamente simula estar na etapa 1 para verificar se pode proceder
      const tempStep = 1;
      return formData.fullname && formData.specialty;
    }
    
    return true;
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const insertVariableAtCursor = (variable: string) => {
    const textarea = reminderMessageRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentMessage = formData.reminder_message || DEFAULT_REMINDER_MESSAGE;
    const newMessage = currentMessage.substring(0, start) + variable + currentMessage.substring(end);
    
    handleChange('reminder_message', newMessage);
    
    // Restore cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const stepTitles = [
    { number: 1, title: 'Informações Gerais' },
    { number: 2, title: 'Localização e Atendimento' },
    { number: 3, title: 'Procedimentos' },
    { number: 4, title: 'Formas de Pagamento' },
    { number: 5, title: 'Lembretes' }
  ];

  const steps = stepTitles.map(step => ({
    ...step,
    completed: completedSteps.includes(step.number)
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto [&>button]:z-50">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-left">
            {profile ? 'Editar Perfil' : 'Novo Perfil'}
          </DialogTitle>
          
          <div className="border-b border-border"></div>
          
          {/* Navegação de Etapas */}
          <div>
            <ClickableStepIndicator
              currentStep={currentStep}
              steps={steps}
              onStepClick={setCurrentStep}
              canNavigateToStep={(step) => !!canNavigateToStep(step)}
            />
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* ETAPA 1: INFORMAÇÕES GERAIS */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname" className="font-bold">
                    Nome Completo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullname"
                    value={formData.fullname || ''}
                    onChange={(e) => handleChange('fullname', e.target.value)}
                    placeholder="Dra. Claudia Silva"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty" className="font-bold">
                    Especialidade <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="specialty"
                    value={formData.specialty || ''}
                    onChange={(e) => handleChange('specialty', e.target.value)}
                    placeholder="Cardiologia"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="professionalid" className="font-bold">Registro Profissional</Label>
                  <Input
                    id="professionalid"
                    value={formData.professionalid || ''}
                    onChange={(e) => handleChange('professionalid', e.target.value)}
                    placeholder="CRM 12345/SP"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phonenumber" className="font-bold">Telefone</Label>
                  <Input
                    id="phonenumber"
                    value={formData.phonenumber || ''}
                    onChange={(e) => {
                      const masked = applyMask.phone(e.target.value);
                      handleChange('phonenumber', masked);
                    }}
                    placeholder="(11) 98765-4321"
                    maxLength={15}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram" className="font-bold">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.instagram || ''}
                    onChange={(e) => handleChange('instagram', e.target.value)}
                    placeholder="@aplia.ia"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="education" className="font-bold">
                    Formação Acadêmica <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="education"
                    value={formData.education || ''}
                    onChange={(e) => handleChange('education', e.target.value)}
                    placeholder="Medicina - USP, Cardiologia - Hospital A.C. Camargo"
                    rows={3}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: LOCALIZAÇÃO E ATENDIMENTO */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="locations" className="font-bold">
                  Locais de Atendimento <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="locations"
                  value={formData.locations || ''}
                  onChange={(e) => handleChange('locations', e.target.value)}
                  placeholder="Consultório Centro - Rua das Flores, 123, Sala 45"
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="workinghours" className="font-bold">
                  Horários de Trabalho <span className="text-destructive">*</span>
                </Label>
                <WeeklyScheduleInput
                  value={formData.workinghours || ''}
                  onChange={(value) => handleChange('workinghours', value)}
                />
              </div>
            </div>
          )}

          {/* ETAPA 3: PROCEDIMENTOS */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <ProcedureListInput
                value={formData.procedures_json || []}
                onChange={(procedures) => handleChange('procedures_json', procedures)}
              />
            </div>
          )}

          {/* ETAPA 4: FORMAS DE PAGAMENTO */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* SEÇÃO A: Convênios Aceitos */}
                <div className="space-y-2">
                  <Label htmlFor="healthinsurance" className="text-base font-semibold">
                    Convênios Aceitos <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="healthinsurance"
                    value={formData.healthinsurance || ''}
                    onChange={(e) => handleChange('healthinsurance', e.target.value)}
                    placeholder="Unimed, SulAmérica, Amil, Bradesco Saúde"
                    rows={4}
                    required
                  />
                  <div className="flex items-center space-x-2 pt-1">
                    <Checkbox
                      id="apenas-particular"
                      checked={formData.healthinsurance === 'Apenas Particular'}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleChange('healthinsurance', 'Apenas Particular');
                        } else {
                          handleChange('healthinsurance', '');
                        }
                      }}
                    />
                    <label
                      htmlFor="apenas-particular"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Apenas Particular
                    </label>
                  </div>
                </div>

                {/* SEÇÃO B: Formas de Pagamento */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">
                    Formas de Pagamento <span className="text-destructive">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {['Crédito', 'Débito', 'PIX', 'Dinheiro'].map((method) => {
                      const selectedPayments = formData.paymentmethods 
                        ? formData.paymentmethods.split(',').map(p => p.trim()) 
                        : [];
                      const isChecked = selectedPayments.includes(method);
                      
                      return (
                        <div key={method} className="flex items-center space-x-2">
                          <Checkbox
                            id={`payment-${method}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              let current = formData.paymentmethods 
                                ? formData.paymentmethods.split(',').map(p => p.trim()) 
                                : [];
                              
                              if (checked) {
                                current.push(method);
                              } else {
                                current = current.filter(p => p !== method);
                              }
                              
                              handleChange('paymentmethods', current.join(', '));
                            }}
                          />
                          <label
                            htmlFor={`payment-${method}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {method}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SEÇÃO C: Parcelamento */}
                <div className="space-y-2">
                  <Label htmlFor="max_installments" className="text-base font-semibold">
                    Máximo de Parcelas <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.max_installments?.toString() || '1'}
                    onValueChange={(value) => handleChange('max_installments', parseInt(value))}
                  >
                    <SelectTrigger id="max_installments">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Não Parcela</SelectItem>
                      {Array.from({length: 11}, (_, i) => i + 2).map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          Até {num}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 5: LEMBRETES */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fade-in">
              {/* Toggle Ativar Lembretes */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="reminders-toggle" className="text-base font-bold">
                    Ativar Lembretes
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Enviar mensagens automáticas antes das consultas
                  </p>
                </div>
                <Switch
                  id="reminders-toggle"
                  checked={formData.reminders_enabled || false}
                  onCheckedChange={(enabled) => handleChange('reminders_enabled', enabled)}
                />
              </div>

              {/* Campos de Configuração */}
              {formData.reminders_enabled && (
                <div className="space-y-4 animate-fade-in">
                  {/* Mensagem de Lembrete */}
                  <div className="space-y-2">
                    <Label htmlFor="reminder-message" className="font-bold">Mensagem de Lembrete</Label>
                    <Textarea
                      ref={reminderMessageRef}
                      id="reminder-message"
                      value={formData.reminder_message || DEFAULT_REMINDER_MESSAGE}
                      onChange={(e) => handleChange('reminder_message', e.target.value)}
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
                  </div>

                  {/* Quando Lembrar */}
                  <div className="space-y-2">
                    <Label htmlFor="reminder-hours" className="font-bold">Lembrar Antes da Consulta</Label>
                    <Select 
                      value={formData.reminder_hours_before?.toString() || '24'}
                      onValueChange={(value) => handleChange('reminder_hours_before', parseFloat(value))}
                    >
                      <SelectTrigger id="reminder-hours">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 horas antes</SelectItem>
                        <SelectItem value="12">12 horas antes</SelectItem>
                        <SelectItem value="2">2 horas antes</SelectItem>
                        <SelectItem value="1">1 hora antes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NAVEGAÇÃO */}
          <div className="flex justify-between gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancelar
            </Button>

            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
              )}

              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button 
                  type="button" 
                  disabled={loading}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit(e as any);
                  }}
                >
                  {loading ? 'Salvando...' : profile ? 'Atualizar' : 'Salvar'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
