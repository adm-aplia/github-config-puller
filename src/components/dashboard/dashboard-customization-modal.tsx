import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { BarChart3, Calendar, MessageSquare, Users } from "lucide-react"

interface DashboardConfig {
  showMetrics: boolean
  showChart: boolean
  showRecentConversations: boolean
  chartPeriod: string
  metricCards: {
    conversations: boolean
    appointments: boolean
    assistants: boolean
    instances: boolean
  }
}

interface DashboardCustomizationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const defaultConfig: DashboardConfig = {
  showMetrics: true,
  showChart: true,
  showRecentConversations: true,
  chartPeriod: "7days",
  metricCards: {
    conversations: true,
    appointments: true,
    assistants: true,
    instances: true,
  }
}

export function DashboardCustomizationModal({ open, onOpenChange }: DashboardCustomizationModalProps) {
  const [config, setConfig] = useState<DashboardConfig>(defaultConfig)
  const { toast } = useToast()

  useEffect(() => {
    // Load saved config from localStorage
    const savedConfig = localStorage.getItem('dashboard-config')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig({ ...defaultConfig, ...parsed })
      } catch {
        setConfig(defaultConfig)
      }
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('dashboard-config', JSON.stringify(config))
    toast({
      title: "Configurações salvas",
      description: "Suas preferências do dashboard foram salvas com sucesso.",
    })
    onOpenChange(false)
  }

  const handleReset = () => {
    setConfig(defaultConfig)
    localStorage.removeItem('dashboard-config')
    toast({
      title: "Configurações resetadas",
      description: "As configurações padrão foram restauradas.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Personalizar Dashboard</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Seções Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Seções do Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-metrics">Mostrar Métricas</Label>
                <Switch
                  id="show-metrics"
                  checked={config.showMetrics}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, showMetrics: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-chart">Mostrar Gráfico de Conversas</Label>
                <Switch
                  id="show-chart"
                  checked={config.showChart}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, showChart: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-recent">Mostrar Conversas Recentes</Label>
                <Switch
                  id="show-recent"
                  checked={config.showRecentConversations}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ ...prev, showRecentConversations: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Cards de Métricas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Cards de Métricas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="metric-conversations">Conversas Ativas</Label>
                <Switch
                  id="metric-conversations"
                  checked={config.metricCards.conversations}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ 
                      ...prev, 
                      metricCards: { ...prev.metricCards, conversations: checked }
                    }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="metric-appointments">Agendamentos do Mês</Label>
                <Switch
                  id="metric-appointments"
                  checked={config.metricCards.appointments}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ 
                      ...prev, 
                      metricCards: { ...prev.metricCards, appointments: checked }
                    }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="metric-assistants">Total de Assistentes</Label>
                <Switch
                  id="metric-assistants"
                  checked={config.metricCards.assistants}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ 
                      ...prev, 
                      metricCards: { ...prev.metricCards, assistants: checked }
                    }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="metric-instances">Instâncias Ativas</Label>
                <Switch
                  id="metric-instances"
                  checked={config.metricCards.instances}
                  onCheckedChange={(checked) => 
                    setConfig(prev => ({ 
                      ...prev, 
                      metricCards: { ...prev.metricCards, instances: checked }
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações do Gráfico */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Configurações do Gráfico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="chart-period">Período Padrão</Label>
                <Select 
                  value={config.chartPeriod} 
                  onValueChange={(value) => 
                    setConfig(prev => ({ ...prev, chartPeriod: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Últimos 7 dias</SelectItem>
                    <SelectItem value="15days">Últimos 15 dias</SelectItem>
                    <SelectItem value="30days">Últimos 30 dias</SelectItem>
                    <SelectItem value="90days">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleReset}>
            Restaurar Padrão
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Configurações
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}