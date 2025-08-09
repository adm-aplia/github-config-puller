import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import SignupForm from "@/components/signup-form"
import { useAuth } from "@/components/auth-provider"

const apliaLogoFull = "/lovable-uploads/0baeb265-4d17-458a-b42a-6fc9ce0041a6.png"
const apliaLogoFullDark = "/lovable-uploads/e9a17318-593a-428d-b166-e4f8be819529.png"

export default function CadastroPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    }
    return 'light'
  })
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Criar conta — Aplia'
  }, [])

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-aplia-light-gray to-aplia-white dark:from-gray-900 dark:to-gray-800 relative">
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-border hover:bg-white dark:hover:bg-gray-800"
          aria-label="Alternar tema"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
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
        <SignupForm />
      </div>
    </div>
  )
}
