
import { useState, useEffect } from "react"
import { useTheme } from "@/hooks/use-theme"
const apliaLogoFull = "/lovable-uploads/0baeb265-4d17-458a-b42a-6fc9ce0041a6.png"
const apliaLogoIcon = "/lovable-uploads/940f8f03-f853-4fdf-ab6f-2a3b5c24ae05.png"
// Logo para modo escuro (assumindo que é a mesma imagem mas com tratamento CSS)
const apliaLogoFullDark = "/lovable-uploads/e9a17318-593a-428d-b166-e4f8be819529.png"
const apliaLogoIconDark = "/lovable-uploads/940f8f03-f853-4fdf-ab6f-2a3b5c24ae05.png"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MessageSquare, 
  Phone, 
  CalendarDays,
  Bot,
  ChevronUp,
  User,
  Crown,
  LogOut
} from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useSubscription } from "@/hooks/use-subscription"

const items = [
  { title: "Painel", url: "/dashboard", icon: LayoutDashboard },
  { title: "Perfis", url: "/dashboard/perfis", icon: Users },
  { title: "Agendamentos", url: "/dashboard/agendamentos", icon: Calendar },
  { title: "Conversas", url: "/dashboard/conversas", icon: MessageSquare },
  { title: "WhatsApp", url: "/dashboard/whatsapp", icon: Phone },
  { title: "Integrações", url: "/dashboard/integracoes", icon: CalendarDays },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = location.pathname
  const { theme } = useTheme()
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const { toast } = useToast()
  const { subscription, loading } = useSubscription()


  useEffect(() => {
    // Buscar dados do usuário e do perfil
    const getUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        setUserEmail(user.email || '')
        
        // 1. Primeiro, tentar buscar o nome do clientes (usuário logado)
        const { data: clientes } = await supabase
          .from('clientes')
          .select('nome')
          .eq('user_id', user.id)
          .limit(1)
        
        if (clientes && clientes.length > 0 && clientes[0].nome) {
          setUserName(clientes[0].nome)
          return
        }
        
        // 2. Fallback para o email sem @ como antes
        setUserName(user.email?.split('@')[0] || 'Usuário')
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error)
        setUserName('Usuário')
      }
    }
    
    getUserData()
    
    // Listener para evento de cliente atualizado
    const handleClienteUpdated = (event: CustomEvent) => {
      setUserName(event.detail.nome || 'Usuário')
    }
    
    window.addEventListener('cliente-updated', handleClienteUpdated as EventListener)
    
    return () => {
      window.removeEventListener('cliente-updated', handleClienteUpdated as EventListener)
    }
  }, [])

  const isActive = (path: string) => currentPath === path
  const isExpanded = items.some((i) => isActive(i.url))

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      navigate('/')
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout.",
        variant: "destructive"
      })
    }
  }

  const planName = subscription?.plano?.nome || 'Gratuito'

  return (
    <Sidebar 
      className={`${state === "collapsed" ? "w-14" : "w-64"} bg-background`} 
      collapsible="icon"
    >
      <SidebarHeader className="bg-background">
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {state !== "collapsed" ? (
                <img 
                  src={theme === 'dark' ? apliaLogoFullDark : apliaLogoFull} 
                  alt="Aplia" 
                  className="h-8 w-auto"
                  decoding="async"
                  loading="eager"
                />
              ) : (
                <img 
                  src={theme === 'dark' ? apliaLogoIconDark : apliaLogoIcon} 
                  alt="Aplia" 
                  className="h-8 w-8"
                  decoding="async"
                  loading="eager"
                />
              )}
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-background">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                   <SidebarMenuButton 
                     asChild 
                     isActive={currentPath === item.url}
                     className="hover:text-black data-[active=true]:text-black"
                   >
                     <NavLink 
                      to={item.url} 
                      end={item.url === "/dashboard"}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {state !== "collapsed" && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2 bg-background">
        {state !== "collapsed" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-accent-foreground w-full justify-between px-3 py-2 h-auto text-left hover:bg-muted"
              >
                <div className="flex flex-col items-start min-w-0 flex-1">
                  {!loading && (
                    <span className="text-xs text-muted-foreground truncate w-full mb-1">
                      Plano {planName}
                    </span>
                  )}
                  <span className="text-sm font-medium text-foreground truncate w-full">
                    {userName}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full">
                    {userEmail}
                  </span>
                </div>
                <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2 transition-transform rotate-180" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side="top"
              align="start" 
              className="absolute bottom-full left-2 right-2 mb-2 bg-background border rounded-md shadow-lg z-50 w-56"
            >
              <div className="py-1">
                <DropdownMenuItem 
                  onClick={() => navigate('/dashboard/configuracoes')}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <User className="h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate('/dashboard/planos')}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                >
                  <Crown className="h-4 w-4" />
                  Planos & Pagamentos
                </DropdownMenuItem>
                <div className="border-t my-1"></div>
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-8 h-8 rounded-full p-0">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              side="top"
              align="start" 
              className="w-56"
            >
              <DropdownMenuItem onClick={() => navigate('/dashboard/configuracoes')}>
                <User className="h-4 w-4 mr-2" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/planos')}>
                <Crown className="h-4 w-4 mr-2" />
                Planos & Pagamentos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
