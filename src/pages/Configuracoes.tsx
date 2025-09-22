import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";

interface UserData {
  nome: string;
  telefone: string;
  email: string;
}

interface UserSettings {
  timezone: string;
  language: string;
  notifications_enabled: boolean;
  theme: string;
}

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [userData, setUserData] = useState<UserData>({
    nome: "",
    telefone: "",
    email: ""
  });
  
  const [userSettings, setUserSettings] = useState<UserSettings>({
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
    notifications_enabled: true,
    theme: "light"
  });

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Carregar dados do cliente
      const { data: clienteData } = await supabase
        .from('clientes')
        .select('nome, telefone, email')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (clienteData) {
        setUserData({
          nome: clienteData.nome || "",
          telefone: clienteData.telefone || "",
          email: clienteData.email || ""
        });
      } else {
        // Se não existe cliente, usar email do usuário
        setUserData(prev => ({ ...prev, email: user!.email || "" }));
      }
      
      // Carregar configurações do usuário
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('timezone, language, notifications_enabled, theme')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (settingsData) {
        setUserSettings({
          timezone: settingsData.timezone || "America/Sao_Paulo",
          language: settingsData.language || "pt-BR", 
          notifications_enabled: settingsData.notifications_enabled ?? true,
          theme: settingsData.theme || "light"
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar suas configurações.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Atualizar ou inserir dados do cliente
      const { error: clienteError } = await supabase
        .from('clientes')
        .upsert({
          user_id: user!.id,
          nome: userData.nome,
          telefone: userData.telefone,
          email: userData.email || user!.email
        }, {
          onConflict: 'user_id'
        });
      
      if (clienteError) throw clienteError;
      
      // Atualizar ou inserir configurações do usuário
      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user!.id,
          timezone: userSettings.timezone,
          language: userSettings.language,
          notifications_enabled: userSettings.notifications_enabled,
          theme: userSettings.theme
        }, {
          onConflict: 'user_id'
        });
      
      if (settingsError) throw settingsError;
      
      // Emitir evento para atualizar a sidebar
      window.dispatchEvent(new CustomEvent('cliente-updated', { 
        detail: { nome: userData.nome } 
      }));
      
      toast({
        title: "Configurações salvas",
        description: "Suas configurações foram atualizadas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar suas configurações.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e configurações da conta
          </p>
        </div>

        <div className="grid gap-6">
          {/* Perfil */}
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>
                Informações básicas da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-4">Carregando...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input 
                      id="name" 
                      value={userData.nome}
                      onChange={(e) => setUserData(prev => ({ ...prev, nome: e.target.value }))}
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input 
                      id="email" 
                      value={userData.email}
                      disabled 
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input 
                      id="phone" 
                      value={userData.telefone}
                      onChange={(e) => setUserData(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      disabled={saving}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timezone">Fuso Horário</Label>
                    <Select 
                      value={userSettings.timezone}
                      onValueChange={(value) => setUserSettings(prev => ({ ...prev, timezone: value }))}
                      disabled={saving}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">America/São Paulo</SelectItem>
                        <SelectItem value="America/Rio_Branco">America/Rio Branco</SelectItem>
                        <SelectItem value="America/Manaus">America/Manaus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configure como você deseja receber notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Notificações por E-mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações importantes por e-mail
                  </p>
                </div>
                <Switch 
                  id="email-notifications" 
                  checked={userSettings.notifications_enabled}
                  onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, notifications_enabled: checked }))}
                  disabled={saving}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="appointment-reminders">Lembretes de Agendamento</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber lembretes sobre novos agendamentos
                  </p>
                </div>
                <Switch 
                  id="appointment-reminders" 
                  checked={userSettings.notifications_enabled}
                  onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, notifications_enabled: checked }))}
                  disabled={saving}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="message-notifications">Notificações de Mensagens</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações sobre novas mensagens
                  </p>
                </div>
                <Switch 
                  id="message-notifications" 
                  checked={userSettings.notifications_enabled}
                  onCheckedChange={(checked) => setUserSettings(prev => ({ ...prev, notifications_enabled: checked }))}
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferências - Seção removida */}

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}