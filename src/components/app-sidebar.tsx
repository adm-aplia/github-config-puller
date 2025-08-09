import { useState, useEffect } from "react"
const apliaLogoFull = "/lovable-uploads/0baeb265-4d17-458a-b42a-6fc9ce0041a6.png"
const apliaLogoIcon = "/lovable-uploads/940f8f03-f853-4fdf-ab6f-2a3b5c24ae05.png"
// Logo para modo escuro
const apliaLogoFullDark = "/lovable-uploads/e9a17318-593a-428d-b166-e4f8be819529.png"
const apliaLogoIconDark = "/lovable-uploads/940f8f03-f853-4fdf-ab6f-2a3b5c24ae05.png"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MessageSquare, 
  Phone, 
  CalendarDays,
  Bot 
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

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
  const currentPath = location.pathname
  const [isDark, setIsDark] = useState(false)

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

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + "/")
  const isExpanded = items.some((i) => isActive(i.url))

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
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 w-full"
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
          <div className="p-3">
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-xs text-muted-foreground mb-1">
                Plano Profissional
              </span>
              <span className="text-sm font-medium text-sidebar-foreground truncate w-full">
                Nathan Almeida
              </span>
              <span className="text-xs text-muted-foreground truncate w-full">
                nathancwb@gmail.com
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              N
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}