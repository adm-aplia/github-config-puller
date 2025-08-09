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
          {/* Header with logo and theme toggle */}
          <header className="flex h-16 items-center justify-between gap-4 px-6 border-b border-border/30 bg-background">
            <div className="flex items-center">
              <img 
                src={theme === 'dark' ? '/lovable-uploads/e9a17318-593a-428d-b166-e4f8be819529.png' : '/lovable-uploads/0baeb265-4d17-458a-b42a-6fc9ce0041a6.png'} 
                alt="Aplia" 
                className="h-8 w-auto"
              />
            </div>
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