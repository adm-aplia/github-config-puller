import { useState, ReactNode } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"
import { SidebarProvider } from "@/hooks/use-sidebar"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }
    return 'light'
  })

  const handleToggle = () => {
    setIsCollapsed(!isCollapsed)
  }

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar isCollapsed={isCollapsed} onToggle={handleToggle} />
        <main className="flex-1 overflow-hidden">
          {/* Header with theme toggle */}
          <header className="flex h-16 items-center justify-end gap-4 px-6 border-b border-border/30 bg-background">
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
          </header>
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}