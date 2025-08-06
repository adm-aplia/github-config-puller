import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function PerfilsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-4">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Perfis</h1>
              <p className="text-muted-foreground">Gerencie seus assistentes de IA</p>
            </div>
          </header>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Assistentes de IA</CardTitle>
                <CardDescription>Configure e gerencie seus perfis de assistentes</CardDescription>
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
    </DashboardLayout>
  )
}