import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarPlus, TrendingUp } from "lucide-react"
import { useState } from "react"

const chartData = [
  { date: "Seg", conversations: 12, agendamentos: 8 },
  { date: "Ter", conversations: 19, agendamentos: 12 },
  { date: "Qua", conversations: 15, agendamentos: 10 },
  { date: "Qui", conversations: 25, agendamentos: 18 },
  { date: "Sex", conversations: 22, agendamentos: 15 },
  { date: "Sáb", conversations: 30, agendamentos: 22 },
  { date: "Dom", conversations: 28, agendamentos: 20 }
]

export function ConversationChart() {
  const [showAddModal, setShowAddModal] = useState(false)

  const maxValue = Math.max(...chartData.map(d => Math.max(d.conversations, d.agendamentos)))
  
  return (
    <Card className="col-span-1 lg:col-span-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-medium">Gráfico</CardTitle>
          <CardDescription>
            Conversas e agendamentos dos últimos 7 dias
          </CardDescription>
        </div>
        <Button 
          size="sm" 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <CalendarPlus className="h-4 w-4" />
          Novo Agendamento
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[200px] w-full">
          {/* Gráfico de linha simples */}
          <div className="relative h-full w-full">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="border-t border-muted opacity-50"></div>
              ))}
            </div>
            
            {/* Chart area */}
            <div className="relative h-full flex items-end justify-between px-4">
              {chartData.map((item, index) => {
                const conversationHeight = (item.conversations / maxValue) * 100
                const agendamentoHeight = (item.agendamentos / maxValue) * 100
                
                return (
                  <div key={item.date} className="flex flex-col items-center gap-2 w-full">
                    {/* Lines */}
                    <div className="relative h-[160px] w-full flex items-end justify-center">
                      {/* Conversation line point */}
                      <div 
                        className="absolute w-3 h-3 bg-primary rounded-full border-2 border-background"
                        style={{ bottom: `${conversationHeight}%` }}
                      />
                      {/* Agendamento line point */}
                      <div 
                        className="absolute w-3 h-3 bg-secondary rounded-full border-2 border-background ml-4"
                        style={{ bottom: `${agendamentoHeight}%` }}
                      />
                      
                      {/* Connect lines between points */}
                      {index < chartData.length - 1 && (
                        <>
                          <svg 
                            className="absolute top-0 left-1/2 w-full h-full overflow-visible"
                            style={{ transform: 'translateX(-50%)' }}
                          >
                            <line
                              x1="50%"
                              y1={`${100 - conversationHeight}%`}
                              x2="150%"
                              y2={`${100 - (chartData[index + 1].conversations / maxValue) * 100}%`}
                              stroke="hsl(var(--primary))"
                              strokeWidth="2"
                              className="drop-shadow-sm"
                            />
                            <line
                              x1="50%"
                              y1={`${100 - agendamentoHeight}%`}
                              x2="150%"
                              y2={`${100 - (chartData[index + 1].agendamentos / maxValue) * 100}%`}
                              stroke="hsl(var(--secondary))"
                              strokeWidth="2"
                              className="drop-shadow-sm"
                            />
                          </svg>
                        </>
                      )}
                    </div>
                    
                    {/* Date label */}
                    <span className="text-xs text-muted-foreground font-medium">
                      {item.date}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span className="text-sm text-muted-foreground">Conversas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-secondary rounded-full"></div>
            <span className="text-sm text-muted-foreground">Agendamentos</span>
          </div>
        </div>
        
        {/* Modal placeholder - seria implementado com Dialog */}
        {showAddModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <Card className="w-[400px]">
              <CardHeader>
                <CardTitle>Novo Agendamento</CardTitle>
                <CardDescription>Adicionar um novo agendamento ao sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Funcionalidade em desenvolvimento...
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setShowAddModal(false)}>
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}