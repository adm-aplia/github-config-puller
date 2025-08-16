import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CreditCard, User, MapPin, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { applyMask } from "@/lib/masks";
import { fetchAddressFromCep, debounce } from "@/lib/cep";

interface CheckoutModalProps {
  plan: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckoutModal({ plan, open, onOpenChange }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);
  const [isTestEnvironment, setIsTestEnvironment] = useState(false);
  const [formData, setFormData] = useState({
    // Dados pessoais
    nome: '',
    email: '',
    telefone: '',
    cpf_cnpj: '',
    // Endereço
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    // Cartão
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: ''
  });
  const { toast } = useToast();

  // Check if we're in test environment and load user email
  useEffect(() => {
    const checkEnvironment = async () => {
      try {
        const { data } = await supabase.functions.invoke('create-subscription', {
          body: { checkEnvironment: true }
        });
        setIsTestEnvironment(data?.environment === 'sandbox');
      } catch (error) {
        // Fallback - assume production if we can't check
        setIsTestEnvironment(false);
      }
    };

    const loadUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setFormData(prev => ({ ...prev, email: user.email }));
      }
    };
    
    if (open) {
      checkEnvironment();
      loadUserEmail();
    }
  }, [open]);

  // Debounced CEP lookup
  const debouncedCepLookup = useCallback(
    debounce(async (cep: string) => {
      const addressData = await fetchAddressFromCep(cep);
      if (addressData) {
        setFormData(prev => ({
          ...prev,
          endereco: addressData.logradouro,
          bairro: addressData.bairro,
          cidade: addressData.localidade,
          estado: addressData.uf
        }));
      }
    }, 500),
    []
  );

  const handleInputChange = (field: string, value: string) => {
    let maskedValue = value;
    
    // Apply masks based on field
    switch (field) {
      case 'cpf_cnpj':
        maskedValue = applyMask.cpfCnpj(value);
        break;
      case 'telefone':
        maskedValue = applyMask.phone(value);
        break;
      case 'cep':
        maskedValue = applyMask.cep(value);
        // Trigger CEP lookup when complete
        if (maskedValue.replace(/\D/g, '').length === 8) {
          debouncedCepLookup(maskedValue);
        }
        break;
      case 'cardNumber':
        maskedValue = applyMask.cardNumber(value);
        break;
      case 'cardExpiry':
        maskedValue = applyMask.cardExpiry(value);
        break;
      case 'cardCvv':
        maskedValue = value.replace(/\D/g, '').slice(0, 4);
        break;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: maskedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan) return;

    setLoading(true);
    try {
      // Chamar edge function para processar pagamento
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          planId: plan.id,
          customerData: {
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            cpf_cnpj: formData.cpf_cnpj,
            endereco: formData.endereco,
            numero: formData.numero,
            complemento: formData.complemento,
            bairro: formData.bairro,
            cidade: formData.cidade,
            estado: formData.estado,
            cep: formData.cep
          },
          cardData: {
            number: formData.cardNumber,
            name: formData.cardName,
            expiry: formData.cardExpiry,
            cvv: formData.cardCvv
          }
        }
      });

      if (error) throw error;

      if (data?.paymentUrl) {
        // Redirecionar para página de pagamento do Asaas
        window.open(data.paymentUrl, '_blank');
      }

      toast({
        title: "Assinatura criada!",
        description: "Você será redirecionado para finalizar o pagamento.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Finalizar Assinatura - {plan.nome}</DialogTitle>
            {isTestEnvironment && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <TestTube className="h-3 w-3 mr-1" />
                Ambiente de Testes
              </Badge>
            )}
          </div>
          <DialogDescription>
            Complete os dados para finalizar sua assinatura do plano {plan.nome} por R$ {plan.preco}/mês
            {isTestEnvironment && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                🧪 <strong>Modo de Teste:</strong> Use o cartão 4444 4444 4444 4444 para simular pagamentos
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <h3 className="font-semibold">Dados Pessoais</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cpf_cnpj">CPF/CNPJ *</Label>
                <Input
                  id="cpf_cnpj"
                  value={formData.cpf_cnpj}
                  onChange={(e) => handleInputChange('cpf_cnpj', e.target.value)}
                  maxLength={18}
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Endereço */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <h3 className="font-semibold">Endereço</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => handleInputChange('cep', e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="endereco">Endereço *</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="numero">Número *</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => handleInputChange('complemento', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado *</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Dados do Cartão */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <h3 className="font-semibold">Dados do Cartão</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="cardNumber">Número do Cartão *</Label>
                <Input
                  id="cardNumber"
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="cardName">Nome no Cartão *</Label>
                <Input
                  id="cardName"
                  value={formData.cardName}
                  onChange={(e) => handleInputChange('cardName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cardExpiry">Validade *</Label>
                <Input
                  id="cardExpiry"
                  value={formData.cardExpiry}
                  onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                  placeholder="MM/AA"
                  maxLength={5}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cardCvv">CVV *</Label>
                <Input
                  id="cardCvv"
                  value={formData.cardCvv}
                  onChange={(e) => handleInputChange('cardCvv', e.target.value)}
                  placeholder="123"
                  maxLength={4}
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Resumo */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Resumo da Assinatura</h3>
            <div className="flex justify-between">
              <span>Plano {plan.nome}</span>
              <span className="font-semibold">R$ {plan.preco}/mês</span>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Processando...' : 'Finalizar Assinatura'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}