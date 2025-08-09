import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Calendar, Download, User, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useProfessionalProfiles } from "@/hooks/use-professional-profiles"
import { supabase } from "@/integrations/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GoogleEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
  }>
}

interface GoogleCalendarImportProps {
  onImportComplete?: () => void
}

export function GoogleCalendarImport({ onImportComplete }: GoogleCalendarImportProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>("")
  const [events, setEvents] = useState<GoogleEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const { toast } = useToast()
  const { profiles, loading: profilesLoading } = useProfessionalProfiles()

  const fetchGoogleEvents = async () => {
    setIsLoading(true)
    try {
      // Simulação de busca de eventos do Google Calendar
      // Na implementação real, isso seria feito através de uma edge function
      const mockEvents: GoogleEvent[] = [
        {
          id: "1",
          summary: "Consulta com João Silva",
          description: "Consulta de rotina",
          start: { dateTime: "2024-12-20T14:00:00Z" },
          end: { dateTime: "2024-12-20T15:00:00Z" },
          attendees: [{ email: "joao@email.com", displayName: "João Silva" }]
        },
        {
          id: "2", 
          summary: "Retorno Maria Santos",
          description: "Consulta de retorno",
          start: { dateTime: "2024-12-21T09:00:00Z" },
          end: { dateTime: "2024-12-21T10:00:00Z" },
          attendees: [{ email: "maria@email.com", displayName: "Maria Santos" }]
        }
      ]
      
      setEvents(mockEvents)
      toast({
        title: "Eventos carregados",
        description: `${mockEvents.length} eventos encontrados no Google Calendar.`
      })
    } catch (error) {
      toast({
        title: "Erro ao buscar eventos",
        description: "Não foi possível carregar eventos do Google Calendar.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const importEvents = async () => {
    if (!selectedProfileId) {
      toast({
        title: "Selecione um perfil",
        description: "É necessário selecionar um perfil profissional para associar os agendamentos.",
        variant: "destructive"
      })
      return
    }

    setIsImporting(true)
    try {
      let successCount = 0
      let errorCount = 0

      for (const event of events) {
        try {
          // Extrair informações do paciente do primeiro attendee
          const patient = event.attendees?.[0]
          const patientName = patient?.displayName || event.summary.split(" ").slice(-2).join(" ")
          const patientEmail = patient?.email || ""

          // Calcular duração em minutos
          const startTime = new Date(event.start.dateTime || event.start.date!)
          const endTime = new Date(event.end.dateTime || event.end.date!)
          const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))

          const { error } = await supabase
            .from('appointments')
            .insert({
              patient_name: patientName,
              patient_email: patientEmail,
              patient_phone: "", // Google Calendar não tem telefone obrigatório
              appointment_date: startTime.toISOString(),
              duration_minutes: durationMinutes,
              appointment_type: "consulta",
              status: "scheduled",
              notes: event.description || "",
              agent_id: selectedProfileId, // Associar ao perfil profissional selecionado
              user_id: (await supabase.auth.getUser()).data.user?.id
            })

          if (error) {
            console.error("Erro ao importar evento:", event.summary, error)
            errorCount++
          } else {
            successCount++
          }
        } catch (err) {
          console.error("Erro ao processar evento:", event.summary, err)
          errorCount++
        }
      }

      if (successCount > 0) {
        toast({
          title: "Importação concluída",
          description: `${successCount} agendamentos importados com sucesso${errorCount > 0 ? `. ${errorCount} falharam.` : '.'}`
        })
        onImportComplete?.()
        setEvents([]) // Limpar eventos após importação
      } else {
        toast({
          title: "Falha na importação",
          description: "Nenhum agendamento foi importado com sucesso.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro durante a importação dos agendamentos.",
        variant: "destructive"
      })
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Importar Eventos do Google Calendar
        </CardTitle>
        <CardDescription>
          Importe seus eventos do Google Calendar como agendamentos no sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seleção de Perfil Profissional */}
        <div className="space-y-2">
          <Label htmlFor="profile-select" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil Profissional
          </Label>
          <Select
            value={selectedProfileId}
            onValueChange={setSelectedProfileId}
            disabled={profilesLoading}
          >
            <SelectTrigger id="profile-select">
              <SelectValue placeholder="Selecione o perfil profissional para os agendamentos" />
            </SelectTrigger>
            <SelectContent>
              {profiles?.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.fullname} - {profile.specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!profilesLoading && (!profiles || profiles.length === 0) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Você precisa criar pelo menos um perfil profissional antes de importar eventos.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Botão para buscar eventos */}
        <Button
          onClick={fetchGoogleEvents}
          disabled={isLoading || !selectedProfileId}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Download className="mr-2 h-4 w-4 animate-spin" />
              Buscando eventos...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Buscar Eventos do Google Calendar
            </>
          )}
        </Button>

        {/* Lista de eventos encontrados */}
        {events.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Eventos encontrados ({events.length})</h4>
              <Button
                onClick={importEvents}
                disabled={isImporting || !selectedProfileId}
                size="sm"
              >
                {isImporting ? (
                  <>
                    <Download className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Importar Todos
                  </>
                )}
              </Button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {events.map((event) => (
                <div key={event.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium text-sm">{event.summary}</h5>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.start.dateTime || event.start.date!).toLocaleString('pt-BR')}
                      </p>
                      {event.description && (
                        <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                      )}
                      {event.attendees?.[0] && (
                        <p className="text-xs text-muted-foreground">
                          Paciente: {event.attendees[0].displayName || event.attendees[0].email}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}