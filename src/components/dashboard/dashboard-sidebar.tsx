import { useState } from "react"
const apliaLogoFull = "/lovable-uploads/0baeb265-4d17-458a-b42a-6fc9ce0041a6.png"
const apliaLogoIcon = "/lovable-uploads/940f8f03-f853-4fdf-ab6f-2a3b5c24ae05.png"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MessageSquare, 
  Phone, 
  CalendarDays, 
  Settings,
  ChevronUp,
  Menu,
  X
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const navigation = [
  { title: "Painel", url: "/dashboard", icon: LayoutDashboard },
  { title: "Perfis", url: "/dashboard/perfis", icon: Users },
  { title: "Agendamentos", url: "/dashboard/agendamentos", icon: Calendar },
  { title: "Conversas", url: "/dashboard/conversas", icon: MessageSquare },
  { title: "WhatsApp", url: "/dashboard/whatsapp", icon: Phone },
  { title: "Integrações", url: "/dashboard/integracoes", icon: CalendarDays },
]

interface DashboardSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function DashboardSidebar({ isCollapsed, onToggle }: DashboardSidebarProps) {
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard"
    }
    return currentPath === path
  }

  return (
    <div className={cn(
      "flex h-screen bg-background border-r transition-all duration-300",
      isCollapsed ? "w-14" : "w-64"
    )}>
      <div className="flex flex-col w-full">
        {/* Header */}
        <div className="flex h-14 items-center px-4">
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <img 
                src={apliaLogoFull} 
                alt="Aplia" 
                className="h-8 w-auto"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <img 
                src={apliaLogoIcon} 
                alt="Aplia" 
                className="h-8 w-8"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn("ml-auto md:hidden", isCollapsed && "mx-auto")}
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            {navigation.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive: navIsActive }) => {
                  const isItemActive = item.url === "/dashboard" 
                    ? currentPath === "/dashboard" 
                    : currentPath.startsWith(item.url) && item.url !== "/dashboard"
                  
                  return cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                    isItemActive
                      ? "bg-accent text-primary font-medium"
                      : "text-sidebar-foreground hover:bg-accent/50 hover:text-sidebar-accent-foreground"
                  )
                }}
              >
                <item.icon className="h-5 w-5" />
                {!isCollapsed && <span>{item.title}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer - User Info */}
        <div className="border-t p-2">
          <Separator className="mb-2" />
          <Button
            variant="ghost"
            className="w-full justify-between px-3 py-2 h-auto text-left hover:bg-muted"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  N
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-xs text-muted-foreground truncate w-full">
                    Plano Profissional
                  </span>
                  <span className="text-sm font-medium text-foreground truncate w-full">
                    Nathan Almeida
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full">
                    nathancwb@gmail.com
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}