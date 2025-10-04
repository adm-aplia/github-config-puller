import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProfessionalProfile } from '@/hooks/use-professional-profiles';
import { CurrencyInput } from '@/components/ui/currency-input';
import { WeeklyScheduleInput } from '@/components/ui/weekly-schedule-input';
import { ToggleWithInput } from '@/components/ui/toggle-with-input';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProfileFormProps {
  profile?: ProfessionalProfile;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ProfessionalProfile>) => Promise<boolean>;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<ProfessionalProfile>>({
    fullname: '',
    specialty: '',
    professionalid: '',
    phonenumber: '',
    email: '',
    education: '',
    locations: '',
    workinghours: '',
    procedures: '',
    consultationduration: '',
    healthinsurance: '',
    paymentmethods: '',
    consultationfees: '',
    installment_enabled: false,
    max_installments: 1,
  });

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    } else {
      setFormData({
        fullname: '',
        specialty: '',
        professionalid: '',
        phonenumber: '',
        email: '',
        education: '',
        locations: '',
        workinghours: '',
        procedures: '',
        consultationduration: '',
        healthinsurance: '',
        paymentmethods: '',
        consultationfees: '',
        installment_enabled: false,
        max_installments: 1,
      });
    }
    setCurrentStep(1);
  }, [profile, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ProfileForm] Iniciando submit com dados:', formData);
    setLoading(true);
    
    try {
      const success = await onSubmit(formData);
      console.log('[ProfileForm] Resultado do submit:', success);
      
      if (success) {
        console.log('[ProfileForm] Submit bem-sucedido, fechando modal');
        onClose();
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('[ProfileForm] Erro no submit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.fullname && formData.specialty;
    }
    return true;
  };

  const handleChange = (field: keyof ProfessionalProfile, value: string | boolean | number) => {
    console.log(`[ProfileForm] Campo alterado: ${field}`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {profile ? 'Editar Perfil' : 'Novo Perfil'} - Etapa {currentStep} de 3
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Etapa 1: Informações Básicas */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Nome Completo *</Label>
                  <Input
                    id="fullname"
                    value={formData.fullname || ''}
                    onChange={(e) => handleChange('fullname', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialty">Especialidade *</Label>
                  <Input
                    id="specialty"
                    value={formData.specialty || ''}
                    onChange={(e) => handleChange('specialty', e.target.value)}
                    placeholder="ex: Urologista; Ortodontista; Cardiologista"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="professionalid">Registro Profissional</Label>
                  <Input
                    id="professionalid"
                    value={formData.professionalid || ''}
                    onChange={(e) => handleChange('professionalid', e.target.value)}
                    placeholder="ex: CRM/SP 123456; CRO/12345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phonenumber">Telefone</Label>
                  <Input
                    id="phonenumber"
                    value={formData.phonenumber || ''}
                    onChange={(e) => handleChange('phonenumber', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="exemplo@email.com"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="education">Formação Acadêmica</Label>
                  <Textarea
                    id="education"
                    value={formData.education || ''}
                    onChange={(e) => handleChange('education', e.target.value)}
                    placeholder="ex: Graduação em Medicina pela UFRJ e Residência em Cardiologia pelo Hospital Albert Einstein"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Etapa 2: Localização e Atendimento */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Localização e Atendimento</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="locations">Locais de Atendimento</Label>
                  <Textarea
                    id="locations"
                    value={formData.locations || ''}
                    onChange={(e) => handleChange('locations', e.target.value)}
                    placeholder="ex: Consultório Centro - Rua das Flores, 123, Sala 45"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workinghours">Horários de Trabalho</Label>
                  <WeeklyScheduleInput
                    value={formData.workinghours || ''}
                    onChange={(value) => handleChange('workinghours', value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="procedures">Procedimentos Realizados</Label>
                  <Textarea
                    id="procedures"
                    value={formData.procedures || ''}
                    onChange={(e) => handleChange('procedures', e.target.value)}
                    placeholder="ex: Consultas, Cirurgias, Exames"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consultationduration">Duração da Consulta</Label>
                  <Input
                    id="consultationduration"
                    value={formData.consultationduration || ''}
                    onChange={(e) => handleChange('consultationduration', e.target.value)}
                    placeholder="ex: 30 minutos"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Etapa 3: Planos e Pagamentos */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Planos e Pagamentos</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="healthinsurance">Convênios Aceitos</Label>
                  <Textarea
                    id="healthinsurance"
                    value={formData.healthinsurance || ''}
                    onChange={(e) => handleChange('healthinsurance', e.target.value)}
                    placeholder="ex: Bradesco, Sulamérica, Omint, Unimed Nacional"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentmethods">Formas de Pagamento</Label>
                  <Textarea
                    id="paymentmethods"
                    value={formData.paymentmethods || ''}
                    onChange={(e) => handleChange('paymentmethods', e.target.value)}
                    placeholder="ex: PIX, TED, Cartão de Crédito, Cartão de Débito"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="consultationfees">Valores da Consulta</Label>
                  <CurrencyInput
                    value={formData.consultationfees || ''}
                    onChange={(value) => handleChange('consultationfees', value)}
                    placeholder="350,00"
                  />
                </div>

                <div className="space-y-2">
                  <ToggleWithInput
                    label="Parcelamento?"
                    toggleValue={formData.installment_enabled || false}
                    onToggleChange={(value) => handleChange('installment_enabled', value)}
                    inputValue={formData.max_installments?.toString() || ''}
                    onInputChange={(value) => handleChange('max_installments', parseInt(value) || 1)}
                    inputPlaceholder="Até quantas vezes?"
                    inputType="number"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navegação */}
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

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button type="submit" disabled={loading}>
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