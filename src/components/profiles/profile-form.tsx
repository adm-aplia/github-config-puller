import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProfessionalProfile } from '@/hooks/use-professional-profiles';

interface ProfileFormProps {
  profile?: ProfessionalProfile;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ProfessionalProfile>) => Promise<boolean>;
}

export const ProfileForm = ({ profile, isOpen, onClose, onSubmit }: ProfileFormProps) => {
  const [formData, setFormData] = useState({
    fullname: profile?.fullname || '',
    specialty: profile?.specialty || '',
    professionalid: profile?.professionalid || '',
    phonenumber: profile?.phonenumber || '',
    email: profile?.email || '',
    education: profile?.education || '',
    locations: profile?.locations || '',
    workinghours: profile?.workinghours || '',
    procedures: profile?.procedures || '',
    healthinsurance: profile?.healthinsurance || '',
    paymentmethods: profile?.paymentmethods || '',
    consultationfees: profile?.consultationfees || '',
    consultationduration: profile?.consultationduration || '',
    timebetweenconsultations: profile?.timebetweenconsultations || '',
    cancellationpolicy: profile?.cancellationpolicy || '',
    reschedulingpolicy: profile?.reschedulingpolicy || '',
    onlineconsultations: profile?.onlineconsultations || '',
    reminderpreferences: profile?.reminderpreferences || '',
    requiredpatientinfo: profile?.requiredpatientinfo || '',
    appointmentconditions: profile?.appointmentconditions || '',
    medicalhistoryrequirements: profile?.medicalhistoryrequirements || '',
    agerequirements: profile?.agerequirements || '',
    communicationchannels: profile?.communicationchannels || '',
    preappointmentinfo: profile?.preappointmentinfo || '',
    requireddocuments: profile?.requireddocuments || '',
    additionalinfo: profile?.additionalinfo || '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await onSubmit(formData);
    if (success) {
      onClose();
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
        healthinsurance: '',
        paymentmethods: '',
        consultationfees: '',
        consultationduration: '',
        timebetweenconsultations: '',
        cancellationpolicy: '',
        reschedulingpolicy: '',
        onlineconsultations: '',
        reminderpreferences: '',
        requiredpatientinfo: '',
        appointmentconditions: '',
        medicalhistoryrequirements: '',
        agerequirements: '',
        communicationchannels: '',
        preappointmentinfo: '',
        requireddocuments: '',
        additionalinfo: '',
      });
    }

    setLoading(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {profile ? 'Editar Perfil Profissional' : 'Novo Perfil Profissional'}
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do perfil profissional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informações Básicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullname">Nome Completo *</Label>
                <Input
                  id="fullname"
                  value={formData.fullname}
                  onChange={(e) => handleChange('fullname', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="specialty">Especialidade *</Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => handleChange('specialty', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="professionalid">CRM/ID Profissional</Label>
                <Input
                  id="professionalid"
                  value={formData.professionalid}
                  onChange={(e) => handleChange('professionalid', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phonenumber">Telefone</Label>
                <Input
                  id="phonenumber"
                  value={formData.phonenumber}
                  onChange={(e) => handleChange('phonenumber', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="education">Formação</Label>
                <Input
                  id="education"
                  value={formData.education}
                  onChange={(e) => handleChange('education', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Configurações de Atendimento */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações de Atendimento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="locations">Locais de Atendimento</Label>
                <Textarea
                  id="locations"
                  value={formData.locations}
                  onChange={(e) => handleChange('locations', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="workinghours">Horários de Funcionamento</Label>
                <Textarea
                  id="workinghours"
                  value={formData.workinghours}
                  onChange={(e) => handleChange('workinghours', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="procedures">Procedimentos Realizados</Label>
                <Textarea
                  id="procedures"
                  value={formData.procedures}
                  onChange={(e) => handleChange('procedures', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="healthinsurance">Convênios Aceitos</Label>
                <Textarea
                  id="healthinsurance"
                  value={formData.healthinsurance}
                  onChange={(e) => handleChange('healthinsurance', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Políticas e Valores */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Políticas e Valores</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentmethods">Formas de Pagamento</Label>
                <Input
                  id="paymentmethods"
                  value={formData.paymentmethods}
                  onChange={(e) => handleChange('paymentmethods', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="consultationfees">Valores de Consulta</Label>
                <Input
                  id="consultationfees"
                  value={formData.consultationfees}
                  onChange={(e) => handleChange('consultationfees', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="consultationduration">Duração da Consulta</Label>
                <Input
                  id="consultationduration"
                  value={formData.consultationduration}
                  onChange={(e) => handleChange('consultationduration', e.target.value)}
                  placeholder="Ex: 30 minutos"
                />
              </div>
              <div>
                <Label htmlFor="timebetweenconsultations">Intervalo entre Consultas</Label>
                <Input
                  id="timebetweenconsultations"
                  value={formData.timebetweenconsultations}
                  onChange={(e) => handleChange('timebetweenconsultations', e.target.value)}
                  placeholder="Ex: 15 minutos"
                />
              </div>
            </div>
          </div>

          {/* Políticas de Agendamento */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Políticas de Agendamento</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="cancellationpolicy">Política de Cancelamento</Label>
                <Textarea
                  id="cancellationpolicy"
                  value={formData.cancellationpolicy}
                  onChange={(e) => handleChange('cancellationpolicy', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="reschedulingpolicy">Política de Reagendamento</Label>
                <Textarea
                  id="reschedulingpolicy"
                  value={formData.reschedulingpolicy}
                  onChange={(e) => handleChange('reschedulingpolicy', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="appointmentconditions">Condições para Agendamento</Label>
                <Textarea
                  id="appointmentconditions"
                  value={formData.appointmentconditions}
                  onChange={(e) => handleChange('appointmentconditions', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : profile ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};