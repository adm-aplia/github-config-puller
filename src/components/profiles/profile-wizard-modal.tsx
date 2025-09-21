import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  User,
  MapPin,
  CreditCard,
  Calendar,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ProfessionalProfile } from "@/hooks/use-professional-profiles";

// Helper component outside main component to prevent re-mounting
const StepIconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">{children}</div>
);

// Separate step components to prevent re-mounting
const StepBasics = React.memo<{
  formData: Partial<ProfessionalProfile>;
  setField: (field: keyof ProfessionalProfile, value: string) => void;
}>(({ formData, setField }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-2">
      <StepIconWrapper>
        <User className="h-5 w-5" />
      </StepIconWrapper>
      <div>
        <h3 className="text-lg font-semibold">Informações Básicas</h3>
        <p className="text-sm text-muted-foreground">Dados pessoais e profissionais</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="fullname">Nome Completo <span className="text-destructive">*</span></Label>
        <Input id="fullname" value={formData.fullname || ""} onChange={(e) => setField("fullname", e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="specialty">Especialidade <span className="text-destructive">*</span></Label>
        <Input id="specialty" value={formData.specialty || ""} onChange={(e) => setField("specialty", e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="professionalid">Registro Profissional</Label>
        <Input id="professionalid" value={formData.professionalid || ""} onChange={(e) => setField("professionalid", e.target.value)} placeholder="CRM, CRO, etc." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phonenumber">Telefone</Label>
        <Input id="phonenumber" value={formData.phonenumber || ""} onChange={(e) => setField("phonenumber", e.target.value)} placeholder="(11) 99999-9999" />
      </div>
    </div>
    <div className="grid grid-cols-1 gap-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" value={formData.email || ""} onChange={(e) => setField("email", e.target.value)} placeholder="seu@email.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="education">Formação Acadêmica</Label>
        <Textarea id="education" value={formData.education || ""} onChange={(e) => setField("education", e.target.value)} placeholder="Descreva sua formação, residência, especializações..." />
      </div>
    </div>
  </div>
));
StepBasics.displayName = "StepBasics";

const StepLocation = React.memo<{
  formData: Partial<ProfessionalProfile>;
  setField: (field: keyof ProfessionalProfile, value: string) => void;
}>(({ formData, setField }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-2">
      <StepIconWrapper>
        <MapPin className="h-5 w-5" />
      </StepIconWrapper>
      <div>
        <h3 className="text-lg font-semibold">Localização e Atendimento</h3>
        <p className="text-sm text-muted-foreground">Onde e quando você atende</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="locations">Locais de Atendimento</Label>
        <Textarea id="locations" value={formData.locations || ""} onChange={(e) => setField("locations", e.target.value)} rows={4} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="workinghours">Horários de Funcionamento</Label>
        <Textarea id="workinghours" value={formData.workinghours || ""} onChange={(e) => setField("workinghours", e.target.value)} rows={4} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="procedures">Procedimentos Realizados</Label>
        <Textarea id="procedures" value={formData.procedures || ""} onChange={(e) => setField("procedures", e.target.value)} rows={4} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="communicationchannels">Canais de Comunicação</Label>
        <Input id="communicationchannels" value={formData.communicationchannels || ""} onChange={(e) => setField("communicationchannels", e.target.value)} placeholder="Telefone, WhatsApp, E-mail..." />
      </div>
    </div>
  </div>
));
StepLocation.displayName = "StepLocation";

const StepPayment = React.memo<{
  formData: Partial<ProfessionalProfile>;
  setField: (field: keyof ProfessionalProfile, value: string) => void;
}>(({ formData, setField }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-2">
      <StepIconWrapper>
        <CreditCard className="h-5 w-5" />
      </StepIconWrapper>
      <div>
        <h3 className="text-lg font-semibold">Planos e Pagamento</h3>
        <p className="text-sm text-muted-foreground">Cobranças e convênios</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="healthinsurance">Convênios Aceitos</Label>
        <Textarea id="healthinsurance" value={formData.healthinsurance || ""} onChange={(e) => setField("healthinsurance", e.target.value)} rows={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="paymentmethods">Formas de Pagamento</Label>
        <Input id="paymentmethods" value={formData.paymentmethods || ""} onChange={(e) => setField("paymentmethods", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="consultationfees">Valores de Consulta</Label>
        <Input id="consultationfees" value={formData.consultationfees || ""} onChange={(e) => setField("consultationfees", e.target.value)} />
      </div>
    </div>
  </div>
));
StepPayment.displayName = "StepPayment";

const StepScheduling = React.memo<{
  formData: Partial<ProfessionalProfile>;
  setField: (field: keyof ProfessionalProfile, value: string) => void;
}>(({ formData, setField }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-2">
      <StepIconWrapper>
        <Calendar className="h-5 w-5" />
      </StepIconWrapper>
      <div>
        <h3 className="text-lg font-semibold">Agendamento e Políticas</h3>
        <p className="text-sm text-muted-foreground">Regras de atendimento</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="consultationduration">Duração da Consulta</Label>
        <Input id="consultationduration" value={formData.consultationduration || ""} onChange={(e) => setField("consultationduration", e.target.value)} placeholder="Ex: 30 minutos" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="timebetweenconsultations">Intervalo entre Consultas</Label>
        <Input id="timebetweenconsultations" value={formData.timebetweenconsultations || ""} onChange={(e) => setField("timebetweenconsultations", e.target.value)} placeholder="Ex: 15 minutos" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="cancellationpolicy">Política de Cancelamento</Label>
        <Textarea id="cancellationpolicy" value={formData.cancellationpolicy || ""} onChange={(e) => setField("cancellationpolicy", e.target.value)} rows={3} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="reschedulingpolicy">Política de Reagendamento</Label>
        <Textarea id="reschedulingpolicy" value={formData.reschedulingpolicy || ""} onChange={(e) => setField("reschedulingpolicy", e.target.value)} rows={3} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="appointmentconditions">Condições para Agendamento</Label>
        <Textarea id="appointmentconditions" value={formData.appointmentconditions || ""} onChange={(e) => setField("appointmentconditions", e.target.value)} rows={3} />
      </div>
    </div>
  </div>
));
StepScheduling.displayName = "StepScheduling";

const StepOnline = React.memo<{
  formData: Partial<ProfessionalProfile>;
  setField: (field: keyof ProfessionalProfile, value: string) => void;
}>(({ formData, setField }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-2">
      <StepIconWrapper>
        <FileText className="h-5 w-5" />
      </StepIconWrapper>
      <div>
        <h3 className="text-lg font-semibold">Consultas Online</h3>
        <p className="text-sm text-muted-foreground">Requisitos e informações</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="onlineconsultations">Consultas Online</Label>
        <Textarea id="onlineconsultations" value={formData.onlineconsultations || ""} onChange={(e) => setField("onlineconsultations", e.target.value)} rows={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="preappointmentinfo">Informações Pré-Atendimento</Label>
        <Textarea id="preappointmentinfo" value={formData.preappointmentinfo || ""} onChange={(e) => setField("preappointmentinfo", e.target.value)} rows={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="requireddocuments">Documentos Necessários</Label>
        <Textarea id="requireddocuments" value={formData.requireddocuments || ""} onChange={(e) => setField("requireddocuments", e.target.value)} rows={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="requiredpatientinfo">Informações do Paciente</Label>
        <Textarea id="requiredpatientinfo" value={formData.requiredpatientinfo || ""} onChange={(e) => setField("requiredpatientinfo", e.target.value)} rows={3} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="medicalhistoryrequirements">Requisitos de Histórico Médico</Label>
        <Textarea id="medicalhistoryrequirements" value={formData.medicalhistoryrequirements || ""} onChange={(e) => setField("medicalhistoryrequirements", e.target.value)} rows={3} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="agerequirements">Restrições de Idade</Label>
        <Input id="agerequirements" value={formData.agerequirements || ""} onChange={(e) => setField("agerequirements", e.target.value)} placeholder="Ex: Atendo a partir de 12 anos" />
      </div>
    </div>
  </div>
));
StepOnline.displayName = "StepOnline";

const StepFinal = React.memo<{
  formData: Partial<ProfessionalProfile>;
  setField: (field: keyof ProfessionalProfile, value: string) => void;
  setFormData: React.Dispatch<React.SetStateAction<Partial<ProfessionalProfile>>>;
}>(({ formData, setField, setFormData }) => (
  <div className="space-y-6">
    <div className="flex items-center gap-3 mb-2">
      <StepIconWrapper>
        <Settings className="h-5 w-5" />
      </StepIconWrapper>
      <div>
        <h3 className="text-lg font-semibold">Configurações Finais</h3>
        <p className="text-sm text-muted-foreground">Preferências e observações</p>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="reminderpreferences">Preferências de Lembrete</Label>
        <Input id="reminderpreferences" value={formData.reminderpreferences || ""} onChange={(e) => setField("reminderpreferences", e.target.value)} placeholder="Ex: 24h e 1h antes" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="additionalinfo">Informações Adicionais</Label>
        <Textarea id="additionalinfo" value={formData.additionalinfo || ""} onChange={(e) => setField("additionalinfo", e.target.value)} rows={4} />
      </div>
    </div>
  </div>
));
StepFinal.displayName = "StepFinal";

interface ProfileWizardModalProps {
  profile?: ProfessionalProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ProfessionalProfile>) => Promise<boolean>;
}

const steps = [
  { key: "basics", label: "Informações Básicas", Icon: User },
  { key: "location", label: "Localização e Atendimento", Icon: MapPin },
  { key: "payment", label: "Planos e Pagamento", Icon: CreditCard },
  { key: "scheduling", label: "Agendamento e Políticas", Icon: Calendar },
  { key: "online", label: "Consultas Online", Icon: FileText },
  { key: "final", label: "Configurações Finais", Icon: Settings },
] as const;

type StepKey = typeof steps[number]["key"];

export const ProfileWizardModal: React.FC<ProfileWizardModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Initialize empty form data first
  const [formData, setFormData] = useState<Partial<ProfessionalProfile>>({});

  // Initialize form data when modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullname: profile?.fullname || "",
        specialty: profile?.specialty || "",
        professionalid: profile?.professionalid || "",
        phonenumber: profile?.phonenumber || "",
        email: profile?.email || "",
        education: profile?.education || "",
        locations: profile?.locations || "",
        workinghours: profile?.workinghours || "",
        procedures: profile?.procedures || "",
        healthinsurance: profile?.healthinsurance || "",
        paymentmethods: profile?.paymentmethods || "",
        consultationfees: profile?.consultationfees || "",
        consultationduration: profile?.consultationduration || "",
        timebetweenconsultations: profile?.timebetweenconsultations || "",
        cancellationpolicy: profile?.cancellationpolicy || "",
        reschedulingpolicy: profile?.reschedulingpolicy || "",
        onlineconsultations: profile?.onlineconsultations || "",
        reminderpreferences: profile?.reminderpreferences || "",
        requiredpatientinfo: profile?.requiredpatientinfo || "",
        appointmentconditions: profile?.appointmentconditions || "",
        medicalhistoryrequirements: profile?.medicalhistoryrequirements || "",
        agerequirements: profile?.agerequirements || "",
        communicationchannels: profile?.communicationchannels || "",
        preappointmentinfo: profile?.preappointmentinfo || "",
        requireddocuments: profile?.requireddocuments || "",
        additionalinfo: profile?.additionalinfo || "",
      });
      setActiveStepIndex(0);
    }
  }, [isOpen, profile]);

  const totalSteps = steps.length;
  
  // Determinar se é modo edição ou criação
  const isEditing = Boolean(profile?.id);
  
  const calculateProgress = useMemo(() => {
    // Se é edição de perfil existente, mostrar progresso baseado na etapa atual
    if (isEditing) {
      const stepProgress = Math.round(((activeStepIndex + 1) / totalSteps) * 100);
      return stepProgress;
    }
    
    // Se é criação de novo perfil, mostrar progresso baseado em campos preenchidos
    const totalFields = 26; // Total number of fields in the profile
    let filledFields = 0;
    
    // Count filled basic fields
    if (formData.fullname) filledFields++;
    if (formData.specialty) filledFields++;
    if (formData.professionalid) filledFields++;
    if (formData.phonenumber) filledFields++;
    if (formData.email) filledFields++;
    if (formData.education) filledFields++;
    
    // Count filled location fields
    if (formData.locations) filledFields++;
    if (formData.workinghours) filledFields++;
    if (formData.procedures) filledFields++;
    if (formData.communicationchannels) filledFields++;
    
    // Count filled payment fields
    if (formData.healthinsurance) filledFields++;
    if (formData.paymentmethods) filledFields++;
    if (formData.consultationfees) filledFields++;
    
    // Count filled scheduling fields
    if (formData.consultationduration) filledFields++;
    if (formData.timebetweenconsultations) filledFields++;
    if (formData.cancellationpolicy) filledFields++;
    if (formData.reschedulingpolicy) filledFields++;
    if (formData.appointmentconditions) filledFields++;
    
    // Count filled online fields
    if (formData.onlineconsultations) filledFields++;
    if (formData.preappointmentinfo) filledFields++;
    if (formData.requireddocuments) filledFields++;
    if (formData.requiredpatientinfo) filledFields++;
    if (formData.medicalhistoryrequirements) filledFields++;
    if (formData.agerequirements) filledFields++;
    
    // Count filled final fields
    if (formData.reminderpreferences) filledFields++;
    if (formData.additionalinfo) filledFields++;
    
    return Math.round((filledFields / totalFields) * 100);
  }, [formData, activeStepIndex, totalSteps, isEditing]);

  const percent = calculateProgress;

  const setField = useCallback((field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const goNext = useCallback(() => {
    // Validação para a primeira etapa (campos obrigatórios)
    if (activeStepIndex === 0) {
      if (!formData.fullname?.trim()) {
        return; // Não avança se nome completo não estiver preenchido
      }
      if (!formData.specialty?.trim()) {
        return; // Não avança se especialidade não estiver preenchida
      }
    }
    
    setActiveStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }, [activeStepIndex, totalSteps, formData.fullname, formData.specialty]);

  const goPrev = useCallback(() => {
    setActiveStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const handleFinish = useCallback(async () => {
    setLoading(true);
    const ok = await onSubmit(formData);
    setLoading(false);
    if (ok) onClose();
  }, [formData, onSubmit, onClose]);

  // Render current step content using memoized components
  const renderCurrentStepContent = () => {
    const key = steps[activeStepIndex].key as StepKey;
    switch (key) {
      case "basics":
        return <StepBasics formData={formData} setField={setField} />;
      case "location":
        return <StepLocation formData={formData} setField={setField} />;
      case "payment":
        return <StepPayment formData={formData} setField={setField} />;
      case "scheduling":
        return <StepScheduling formData={formData} setField={setField} />;
      case "online":
        return <StepOnline formData={formData} setField={setField} />;
      case "final":
        return <StepFinal formData={formData} setField={setField} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      onClose();
    }
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-5xl max-h-[95vh] overflow-y-auto p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {profile ? "Editar Perfil Profissional" : "Criar Novo Perfil Profissional"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Preencha as informações para criar seu perfil profissional em 6 etapas.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-2">
          <div className="w-full max-w-4xl mx-auto">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Etapa {activeStepIndex + 1} de {totalSteps}</span>
                <span className="text-sm text-muted-foreground">{percent}% concluído</span>
              </div>
              <Progress value={percent} className="h-2" key={`progress-${activeStepIndex}-${isEditing}`} />
            </div>

            {/* Step nav */}
            <div className="mb-8">
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-2 min-w-max">
                  {steps.map((s, idx) => {
                    const active = idx === activeStepIndex;
                    // Permitir navegação livre ao editar perfil existente, restringir apenas ao criar novo
                    const disabled = isEditing ? false : idx > activeStepIndex;
                    const StepIcon = s.Icon;
                    return (
                      <button
                        key={s.key}
                        type="button"
                        disabled={disabled}
                        onClick={() => setActiveStepIndex(idx)}
                        className={
                          [
                            "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                            active
                              ? "bg-primary/10 text-primary border-2 border-primary/20"
                              : disabled
                              ? "bg-muted text-muted-foreground border border-border cursor-not-allowed"
                              : "bg-background text-foreground border border-border hover:bg-muted",
                          ].join(" ")
                        }
                      >
                        <StepIcon className="h-4 w-4 flex-shrink-0" />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card content */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {renderCurrentStepContent()}
                </div>
              </CardContent>
            </Card>

            {/* Footer actions */}
            <div className="flex items-center justify-between">
              <Button type="button" variant="outline" onClick={goPrev} disabled={activeStepIndex === 0} className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <div className="flex items-center gap-2">
                {activeStepIndex < totalSteps - 1 ? (
                  <Button type="button" onClick={goNext} className="flex items-center gap-2">
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleFinish} disabled={loading} className="flex items-center gap-2">
                    {loading ? "Salvando..." : profile ? "Atualizar" : "Salvar"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
