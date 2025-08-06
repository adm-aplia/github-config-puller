import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

// Dados baseados nas métricas do dashboard
const data7Days = [
  { date: "Seg", conversations: 147, agendamentos: 86 },
  { date: "Ter", conversations: 198, agendamentos: 92 },
  { date: "Qua", conversations: 165, agendamentos: 78 },
  { date: "Qui", conversations: 234, agendamentos: 105 },
  { date: "Sex", conversations: 189, agendamentos: 88 },
  { date: "Sáb", conversations: 156, agendamentos: 71 },
  { date: "Dom", conversations: 123, agendamentos: 65 }
]

const data30Days = [
  { date: "Sem 1", conversations: 1234, agendamentos: 86 },
  { date: "Sem 2", conversations: 1456, agendamentos: 98 },
  { date: "Sem 3", conversations: 1123, agendamentos: 76 },
  { date: "Sem 4", conversations: 1567, agendamentos: 112 }
]

const data90Days = [
  { date: "Mês 1", conversations: 4567, agendamentos: 256 },
  { date: "Mês 2", conversations: 5234, agendamentos: 298 },
  { date: "Mês 3", conversations: 4891, agendamentos: 234 }
]

export function ConversationChart() {
  const [period, setPeriod] = useState("7")
  
  const getDataForPeriod = () => {
    switch(period) {
      case "30": return data30Days
      case "90": return data90Days
      default: return data7Days
    }
  }
  
  const chartData = getDataForPeriod()
  const maxValue = Math.max(...chartData.map(d => Math.max(d.conversations, d.agendamentos)))
  
  return (
    <Card className="col-span-1 lg:col-span-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div>
          <CardTitle className="text-lg font-semibold">Gráfico</CardTitle>
          <CardDescription className="mt-2">
            Conversas e agendamentos dos últimos {period} dias
          </CardDescription>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 dias</SelectItem>
            <SelectItem value="30">30 dias</SelectItem>
            <SelectItem value="90">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      
      <CardContent className="pt-2 pb-8">
        <div className="h-[280px] w-full mb-8">
          <div className="relative h-full w-full bg-gradient-to-b from-background to-muted/20 rounded-lg p-6">
            {/* Grid lines */}
            <div className="absolute inset-6 flex flex-col justify-between">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border-t border-border/30"></div>
              ))}
            </div>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 inset-y-6 flex flex-col justify-between text-xs text-muted-foreground">
              {[maxValue, Math.round(maxValue * 0.8), Math.round(maxValue * 0.6), Math.round(maxValue * 0.4), Math.round(maxValue * 0.2), 0].map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
            
            {/* Chart area */}
            <div className="relative h-full flex items-end justify-between px-8 ml-8">
              {chartData.map((item, index) => {
                const conversationHeight = (item.conversations / maxValue) * 85
                const agendamentoHeight = (item.agendamentos / maxValue) * 85
                
                return (
                  <div key={item.date} className="flex flex-col items-center gap-3 flex-1">
                    {/* Chart area */}
                    <div className="relative h-[200px] w-full flex items-end justify-center">
                      {/* Connection lines */}
                      {index < chartData.length - 1 && (
                        <svg 
                          className="absolute top-0 left-1/2 w-full h-full overflow-visible pointer-events-none"
                          style={{ transform: 'translateX(-25%)' }}
                        >
                          {/* Conversation line */}
                          <line
                            x1="50%"
                            y1={`${100 - conversationHeight}%`}
                            x2="200%"
                            y2={`${100 - (chartData[index + 1].conversations / maxValue) * 85}%`}
                            stroke="hsl(var(--primary))"
                            strokeWidth="3"
                            strokeLinecap="round"
                            className="drop-shadow-sm"
                          />
                          {/* Agendamento line */}
                          <line
                            x1="50%"
                            y1={`${100 - agendamentoHeight}%`}
                            x2="200%"
                            y2={`${100 - (chartData[index + 1].agendamentos / maxValue) * 85}%`}
                            stroke="hsl(var(--secondary))"
                            strokeWidth="3"
                            strokeLinecap="round"
                            className="drop-shadow-sm"
                          />
                        </svg>
                      )}
                      
                      {/* Data points */}
                      <div 
                        className="absolute w-4 h-4 bg-primary rounded-full border-3 border-background shadow-lg hover:scale-110 transition-transform cursor-pointer"
                        style={{ bottom: `${conversationHeight}%` }}
                        title={`Conversas: ${item.conversations}`}
                      />
                      <div 
                        className="absolute w-4 h-4 bg-secondary rounded-full border-3 border-background shadow-lg hover:scale-110 transition-transform cursor-pointer"
                        style={{ bottom: `${agendamentoHeight}%` }}
                        title={`Agendamentos: ${item.agendamentos}`}
                      />
                    </div>
                    
                    {/* Date label */}
                    <span className="text-sm font-medium text-muted-foreground">
                      {item.date}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-8 pt-4 border-t">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-primary rounded-full shadow-sm"></div>
            <span className="text-sm font-medium">Conversas</span>
            <span className="text-xs text-muted-foreground">
              ({chartData.reduce((sum, item) => sum + item.conversations, 0)} total)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-secondary rounded-full shadow-sm"></div>
            <span className="text-sm font-medium">Agendamentos</span>
            <span className="text-xs text-muted-foreground">
              ({chartData.reduce((sum, item) => sum + item.agendamentos, 0)} total)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}