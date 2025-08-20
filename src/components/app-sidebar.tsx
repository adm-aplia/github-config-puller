
import { useState, useEffect } from "react"
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
  const [isDark, setIsDark] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const { toast } = useToast()
  const { subscription } = useSubscription()

  useEffect(() => {
    // Detectar tema atual
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    
    checkTheme()
    
    // Observer para mudanças de tema
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })
    
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // Buscar dados do usuário e do perfil
    const getUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        
        setUserEmail(user.email || '')
        
        // 1. Primeiro, tentar buscar o nome do professional_profiles mais recente
        const { data: professionalProfiles } = await supabase
          .from('professional_profiles')
          .select('fullname')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (professionalProfiles && professionalProfiles.length > 0 && professionalProfiles[0].fullname) {
          setUserName(professionalProfiles[0].fullname)
          return
        }
        
        // 2. Se não tem professional profile, tentar buscar do profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('name')
          .eq('user_id', user.id)
          .limit(1)
        
        if (profiles && profiles.length > 0 && profiles[0].name) {
          setUserName(profiles[0].name)
          return
        }
        
        // 3. Se não tem profiles, tentar buscar do clientes
        const { data: clientes } = await supabase
          .from('clientes')
          .select('nome')
          .eq('user_id', user.id)
          .limit(1)
        
        if (clientes && clientes.length > 0 && clientes[0].nome) {
          setUserName(clientes[0].nome)
          return
        }
        
        // 4. Fallback para o email sem @ como antes
        setUserName(user.email?.split('@')[0] || 'Usuário')
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error)
        setUserName('Usuário')
      }
    }
    
    getUserData()
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
    <Sidebar className={state === "collapsed" ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-border/30">
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {state !== "collapsed" ? (
                <img 
                  src={isDark ? apliaLogoFullDark : apliaLogoFull} 
                  alt="Aplia" 
                  className="h-8 w-auto"
                />
              ) : (
                <img 
                  src={isDark ? apliaLogoIconDark : apliaLogoIcon} 
                  alt="Aplia" 
                  className="h-8 w-8"
                />
              )}
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/dashboard"}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                          isActive 
                            ? "bg-accent text-primary font-medium" 
                            : "text-sidebar-foreground hover:bg-accent/50 hover:text-sidebar-accent-foreground"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/30 p-2">
        {state !== "collapsed" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:text-accent-foreground w-full justify-between px-3 py-2 h-auto text-left hover:bg-muted"
              >
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-xs text-muted-foreground truncate w-full mb-1">
                    Plano {planName}
                  </span>
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
