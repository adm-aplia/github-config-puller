import { ReactNode } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useTheme } from "@/hooks/use-theme"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {/* Header com botão de tema e trigger do sidebar */}
          <header 
            className="sticky top-0 z-40 flex items-center justify-between border-b border-border/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            style={{
              height: 'var(--spacing-2xl)',
              paddingLeft: 'var(--spacing-md)',
              paddingRight: 'var(--spacing-md)',
              gap: 'var(--spacing-sm)',
            }}
          >
            <SidebarTrigger />
            <div className="flex items-center" style={{ gap: 'var(--spacing-sm)' }}>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="bg-transparent"
                aria-label="Alternar tema"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
            </div>
          </header>
          <div 
            className="w-full"
            style={{
              padding: 'var(--spacing-md)',
            }}
          >
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}