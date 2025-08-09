import { ReactNode } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen w-full bg-background">
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
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}