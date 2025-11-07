import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartData } from "@/hooks/use-dashboard-stats"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface ConversationChartProps {
  chartData: ChartData[]
  loading: boolean
  periodLabel?: string
}

export function ConversationChart({ chartData, loading, periodLabel = "7 dias" }: ConversationChartProps) {
  
  if (loading) {
    return (
      <Card className="col-span-1 lg:col-span-4 h-full">
        <CardHeader>
          <Skeleton className="h-5 sm:h-6 w-32" />
          <Skeleton className="h-3 sm:h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] sm:h-[340px] lg:h-[380px] w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-1 lg:col-span-4 h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sm:pb-6">
        <div>
          <CardTitle className="text-fluid-lg font-semibold">Conversas e Agendamentos dos Últimos {periodLabel}</CardTitle>
          <CardDescription className="mt-1 sm:mt-2 text-fluid-xs sm:text-fluid-sm">
            Evolução diária de conversas e agendamentos
          </CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2 pb-4">
        <div className="h-[280px] sm:h-[340px] lg:h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                opacity={0.3} 
              />
              
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number, name: string) => [
                  value,
                  name === 'conversations' ? 'Conversas' : 'Agendamentos'
                ]}
              />
              
              <Legend 
                formatter={(value) => value === 'conversations' ? 'Conversas' : 'Agendamentos'}
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
              />
              
              {/* Barra de Conversas - Verde/Ciano */}
              <Bar 
                dataKey="conversations" 
                stackId="a"
                fill="hsl(180, 70%, 55%)"
                radius={[0, 0, 0, 0]}
                name="conversations"
              />
              
              {/* Barra de Agendamentos - Azul */}
              <Bar 
                dataKey="appointments" 
                stackId="a"
                fill="hsl(210, 90%, 60%)"
                radius={[4, 4, 0, 0]}
                name="appointments"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}