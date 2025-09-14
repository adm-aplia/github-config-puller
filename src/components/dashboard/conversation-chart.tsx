import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { ChartData } from "@/hooks/use-dashboard-stats"
import { useIsMobile } from "@/hooks/use-mobile"

// Dados baseados nas métricas do dashboard com mais pontos para linha suave
const data7Days = [
  { date: "Seg", conversations: 147, agendamentos: 86 },
  { date: "", conversations: 165, agendamentos: 78 },
  { date: "", conversations: 189, agendamentos: 82 },
  { date: "Ter", conversations: 198, agendamentos: 92 },
  { date: "", conversations: 176, agendamentos: 88 },
  { date: "", conversations: 154, agendamentos: 84 },
  { date: "Qua", conversations: 165, agendamentos: 78 },
  { date: "", conversations: 187, agendamentos: 95 },
  { date: "", conversations: 210, agendamentos: 98 },
  { date: "Qui", conversations: 234, agendamentos: 105 },
  { date: "", conversations: 221, agendamentos: 102 },
  { date: "", conversations: 198, agendamentos: 96 },
  { date: "Sex", conversations: 189, agendamentos: 88 },
  { date: "", conversations: 167, agendamentos: 82 },
  { date: "", conversations: 145, agendamentos: 76 },
  { date: "Sáb", conversations: 156, agendamentos: 71 },
  { date: "", conversations: 134, agendamentos: 68 },
  { date: "", conversations: 118, agendamentos: 63 },
  { date: "Dom", conversations: 123, agendamentos: 65 }
]

const data30Days = [
  { date: "Sem 1", conversations: 1234, agendamentos: 86 },
  { date: "", conversations: 1345, agendamentos: 92 },
  { date: "", conversations: 1298, agendamentos: 88 },
  { date: "Sem 2", conversations: 1456, agendamentos: 98 },
  { date: "", conversations: 1387, agendamentos: 94 },
  { date: "", conversations: 1234, agendamentos: 85 },
  { date: "Sem 3", conversations: 1123, agendamentos: 76 },
  { date: "", conversations: 1267, agendamentos: 82 },
  { date: "", conversations: 1445, agendamentos: 95 },
  { date: "Sem 4", conversations: 1567, agendamentos: 112 }
]

const data90Days = [
  { date: "Mês 1", conversations: 4567, agendamentos: 256 },
  { date: "", conversations: 4234, agendamentos: 245 },
  { date: "", conversations: 4789, agendamentos: 267 },
  { date: "", conversations: 4998, agendamentos: 278 },
  { date: "Mês 2", conversations: 5234, agendamentos: 298 },
  { date: "", conversations: 5567, agendamentos: 312 },
  { date: "", conversations: 5123, agendamentos: 289 },
  { date: "", conversations: 4756, agendamentos: 268 },
  { date: "Mês 3", conversations: 4891, agendamentos: 234 }
]

// Função para criar path suave (curvas Bézier)
function createSmoothPath(points: {x: number, y: number}[]) {
  if (points.length < 2) return ''
  
  let path = `M ${points[0].x} ${points[0].y}`
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    
    if (i === 1) {
      // Primeira curva
      const next = points[i + 1] || curr
      const cp1x = prev.x + (curr.x - prev.x) * 0.3
      const cp1y = prev.y
      const cp2x = curr.x - (next.x - prev.x) * 0.1
      const cp2y = curr.y
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
    } else if (i === points.length - 1) {
      // Última curva
      const cp1x = prev.x + (curr.x - prev.x) * 0.7
      const cp1y = prev.y
      const cp2x = curr.x
      const cp2y = curr.y
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
    } else {
      // Curvas intermediárias
      const prevPrev = points[i - 2] || prev
      const next = points[i + 1] || curr
      const cp1x = prev.x + (curr.x - prevPrev.x) * 0.15
      const cp1y = prev.y + (curr.y - prevPrev.y) * 0.15
      const cp2x = curr.x - (next.x - prev.x) * 0.15
      const cp2y = curr.y - (next.y - prev.y) * 0.15
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
    }
  }
  
  return path
}

interface ConversationChartProps {
  chartData: ChartData[]
  loading: boolean
  periodLabel?: string
}

export function ConversationChart({ chartData, loading, periodLabel = "7 dias" }: ConversationChartProps) {
  const isMobile = useIsMobile()
  
  if (loading) {
    return (
      <Card className="col-span-1 lg:col-span-4">
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-[220px] sm:h-[280px] w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(...chartData.map(d => d.conversations), 100)
  
  return (
    <Card className="col-span-1 lg:col-span-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div>
          <CardTitle className="text-lg font-semibold">Conversas dos Últimos {periodLabel}</CardTitle>
          <CardDescription className="mt-2">
            Evolução das conversas por dia
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2 pb-8">
        <div className="h-[220px] sm:h-[280px] w-full mb-8">
          <div className="relative h-full w-full bg-gradient-to-b from-background to-muted/10 rounded-lg p-6">
            {/* Grid lines */}
            <div className="absolute inset-6 flex flex-col justify-between">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="border-t border-border/20"></div>
              ))}
            </div>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 inset-y-6 flex flex-col justify-between text-xs text-muted-foreground">
              {[maxValue, Math.round(maxValue * 0.8), Math.round(maxValue * 0.6), Math.round(maxValue * 0.4), Math.round(maxValue * 0.2), 0].map((value) => (
                <span key={value}>{value.toLocaleString()}</span>
              ))}
            </div>
            
            {/* Chart area with smooth lines */}
            <div className="relative h-full ml-8 mr-2">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Create smooth conversation line */}
                <path
                  d={createSmoothPath(chartData.map((item, index) => ({
                    x: (index / (chartData.length - 1)) * 100,
                    y: 100 - (item.conversations / maxValue) * 85
                  })))}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="0.8"
                  className="drop-shadow-sm"
                  style={{ vectorEffect: 'non-scaling-stroke' }}
                />
              </svg>
              
              {/* X-axis labels - dynamically show 4 labels on mobile, 6-8 on desktop */}
              <div className="absolute bottom-0 w-full px-2">
                {(() => {
                  const labelsToShow = chartData.filter(item => item.date)
                  const maxLabels = isMobile ? 4 : (chartData.length > 20 ? 6 : chartData.length > 10 ? 8 : labelsToShow.length)
                  const step = Math.max(1, Math.floor(labelsToShow.length / maxLabels))
                  
                  return labelsToShow.map((item, labelIndex) => {
                    if (labelIndex % step !== 0 && labelIndex !== labelsToShow.length - 1) return null
                    
                    const dataIndex = chartData.findIndex(d => d.date === item.date)
                    const position = (dataIndex / (chartData.length - 1)) * 100
                    const label = isMobile ? item.date.split('/')[0] : item.date
                    
                    return (
                      <span 
                        key={dataIndex} 
                        className="absolute text-[10px] font-medium text-muted-foreground whitespace-nowrap transform -translate-x-1/2"
                        style={{ left: `${position}%` }}
                      >
                        {label}
                      </span>
                    )
                  })
                })()}
              </div>
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
        </div>
      </CardContent>
    </Card>
  )
}