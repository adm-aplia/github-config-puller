import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartData } from "@/hooks/use-dashboard-stats"

interface ConversationChartProps {
  chartData: ChartData[]
  loading: boolean
  periodLabel?: string
}

export function ConversationChart({ chartData, loading, periodLabel = "7 dias" }: ConversationChartProps) {
  
  if (loading) {
    return (
      <Card className="col-span-1 lg:col-span-4">
        <CardHeader>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }
  
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
      
      <CardContent className="pt-2 pb-2">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
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
              tickFormatter={(value) => `${value}`} 
            />
            <Tooltip
              formatter={(value: number) => [`${value} ${value === 1 ? 'conversa' : 'conversas'}`, "Total"]}
              labelFormatter={(label) => `Data: ${label}`}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                color: "hsl(var(--popover-foreground))"
              }}
            />
            <Bar 
              dataKey="conversations" 
              fill="currentColor" 
              radius={[4, 4, 0, 0]} 
              className="fill-primary" 
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}