import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import LoginForm from "@/components/login-form"
import { useAuth } from "@/components/auth-provider"
import { useTheme } from "@/hooks/use-theme"

// Logos da Aplia
const apliaLogoFull = "/lovable-uploads/0baeb265-4d17-458a-b42a-6fc9ce0041a6.png"
const apliaLogoFullDark = "/lovable-uploads/e9a17318-593a-428d-b166-e4f8be819529.png"

export default function LoginPage() {
  const { theme, toggleTheme } = useTheme()
  const { user, signIn } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-aplia-light-gray to-aplia-white dark:from-gray-900 dark:to-gray-800 relative">
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
          aria-label="Alternar tema"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4 text-gray-700" />
          )}
        </Button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <img 
            alt="Aplia — Assistentes de IA para Profissionais da Saúde" 
            className="h-12 w-auto" 
            src={theme === 'dark' ? apliaLogoFullDark : apliaLogoFull}
          />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm onSignIn={signIn} />
      </div>
    </div>
  )
}