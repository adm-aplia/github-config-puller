import { useState, ReactNode } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { SidebarProvider } from "@/hooks/use-sidebar"
import { useTheme } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed)
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
        <main className={cn("flex-1 overflow-hidden transition-all duration-300", isCollapsed ? "ml-14" : "ml-64")}>
          {/* Header com botão de tema */}
          <header className="flex h-16 items-center justify-end gap-4 px-6 border-b border-border/30 bg-background">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="bg-transparent"
                aria-label="Alternar tema"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </header>
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}