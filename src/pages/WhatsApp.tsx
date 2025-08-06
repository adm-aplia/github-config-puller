import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Phone, Plus, Settings, Smartphone, Signal, User, UserPlus, QrCode, EllipsisVertical, Pen, UserCheck, UserX, Trash2 } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

const whatsappInstances = [
  {
    id: "1",
    name: "Teste",
    phone: "-",
    avatar: null,
    status: "qr_pending",
    profile: null,
    profileDescription: null
  },
  {
    id: "2",
    name: "Aplia",
    phone: "+551151973902",
    avatar: null,
    status: "connected",
    profile: "Dra. Mariana",
    profileDescription: "Cardiologia"
  },
  {
    id: "3",
    name: "Nathan Almeida",
    phone: "-",
    avatar: "https://pps.whatsapp.net/v/t61.24694-24/473399388_1294930541724425_2670422564628782710_n.jpg?ccb=11-4&oh=01_Q5Aa2AE6re5uY1T6Mav8uhXwNFix_netYk0Ns9ZD_meICReknQ&oe=688E8141&_nc_sid=5e03e0&_nc_cat=101",
    status: "qr_pending",
    profile: null,
    profileDescription: null
  }
]

const getStatusConfig = (status: string) => {
  const configs = {
    connected: {
      label: "Conectado",
      variant: "outline" as const,
      className: "text-gray-700 border-gray-300 bg-gray-100"
    },
    qr_pending: {
      label: "Aguardando QR",
      variant: "outline" as const,
      className: "text-gray-700 border-gray-200 bg-gray-50"
    },
    disconnected: {
      label: "Desconectado",
      variant: "destructive" as const,
      className: "text-red-700 border-red-200 bg-red-50"
    }
  }
  return configs[status as keyof typeof configs] || configs.disconnected
}

export default function WhatsAppPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
              <p className="text-muted-foreground">
                Gerencie suas instâncias do WhatsApp Business
              </p>
            </div>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Instância
            </Button>
          </div>

          <div className="rounded-md border">
            {/* Header */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border-b bg-gray-50/50 dark:bg-gray-800/50 font-medium text-sm">
              <div>Nome</div>
              <div>Número</div>
              <div>Perfil Vinculado</div>
              <div>Status</div>
              <div className="text-right">Ações</div>
            </div>
            
            {/* Items */}
            {whatsappInstances.map((instance) => {
              const statusConfig = getStatusConfig(instance.status)
              return (
                <div key={instance.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border-b last:border-b-0 items-center group">
                  {/* Nome com Avatar */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={instance.avatar || undefined} alt={instance.name} />
                      <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{instance.name}</div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                        >
                          <Pen className="h-3 w-3 text-gray-500" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Número */}
                  <div className="text-sm text-muted-foreground">
                    {instance.phone}
                  </div>

                  {/* Perfil Vinculado */}
                  <div className="text-sm">
                    {instance.profile ? (
                      <div>
                        <div className="font-medium">{instance.profile}</div>
                        <div className="text-xs text-muted-foreground">{instance.profileDescription}</div>
                      </div>
                    ) : (
                      <span className="text-gray-500">Nenhum perfil</span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <Badge variant={statusConfig.variant} className={statusConfig.className}>
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* Ações */}
                  <div className="flex justify-end gap-2">
                    {instance.status === "connected" ? (
                      <Button variant="outline" className="h-9">
                        <UserPlus className="h-4 w-4 mr-1" />
                        Alterar Perfil
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" className="h-9">
                          <UserPlus className="h-4 w-4 mr-1" />
                          Atribuir Perfil
                        </Button>
                        <Button variant="outline" className="h-9">
                          <QrCode className="h-4 w-4 mr-1" />
                          QR Code
                        </Button>
                      </>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-8 w-8 p-0 border-gray-300 bg-white hover:bg-gray-50"
                        >
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-white border shadow-lg z-50">
                        <DropdownMenuItem className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Configurações
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4" />
                          Reconectar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2">
                          <UserX className="h-4 w-4" />
                          Desconectar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 text-destructive">
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}