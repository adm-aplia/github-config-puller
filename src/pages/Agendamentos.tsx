import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AgendamentosPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-col gap-4">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
            <p className="text-muted-foreground">Gerencie sua agenda e compromissos</p>
          </div>
        </header>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Agenda Inteligente</CardTitle>
              <CardDescription>Sistema de agendamento automatizado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Funcionalidade em desenvolvimento...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}