import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const chartData = [
  { day: "Seg", conversations: 12 },
  { day: "Ter", conversations: 19 },
  { day: "Qua", conversations: 15 },
  { day: "Qui", conversations: 25 },
  { day: "Sex", conversations: 22 },
  { day: "Sáb", conversations: 8 },
  { day: "Dom", conversations: 5 },
]

export function ConversationChart() {
  return (
    <Card className="col-span-1 lg:col-span-4">
      <CardHeader>
        <CardTitle>Conversas</CardTitle>
        <CardDescription>Número de conversas nos últimos 7 dias</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] w-full flex items-center justify-center bg-muted rounded-lg">
          <div className="text-center">
            <p className="text-lg font-semibold">Gráfico de Conversas</p>
            <p className="text-sm text-muted-foreground">Dados dos últimos 7 dias</p>
            <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
              {chartData.slice(0, 4).map((item) => (
                <div key={item.day} className="bg-background p-2 rounded">
                  <div className="font-medium">{item.day}</div>
                  <div className="text-primary">{item.conversations}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}