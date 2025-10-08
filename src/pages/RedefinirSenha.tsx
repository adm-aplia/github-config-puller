import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/integrations/supabase/client"
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

const apliaLogoFull = "/lovable-uploads/0baeb265-4d17-458a-b42a-6fc9ce0041a6.png"
const apliaLogoFullDark = "/lovable-uploads/e9a17318-593a-428d-b166-e4f8be819529.png"

export default function RedefinirSenha() {
  const { theme, toggleTheme } = useTheme()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password validation rules
  const passwordValidation = useMemo(() => {
    const validations = {
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    const passedCount = Object.values(validations).filter(Boolean).length

    return { ...validations, isValid: passedCount >= 4 }
  }, [password])

  const getPasswordRequirements = () => [
    { text: "Pelo menos 8 caracteres", valid: passwordValidation.hasMinLength },
    { text: "Uma letra maiúscula", valid: passwordValidation.hasUppercase },
    { text: "Uma letra minúscula", valid: passwordValidation.hasLowercase },
    { text: "Um número", valid: passwordValidation.hasNumber },
    { text: "Um caractere especial (!@#$%^&*)", valid: passwordValidation.hasSpecialChar },
  ]

  useEffect(() => {
    // Verificar se há um token de recuperação na URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')

    if (!accessToken || type !== 'recovery') {
      toast({
        title: "Link inválido",
        description: "O link de recuperação é inválido ou expirou.",
        variant: "destructive"
      })
      navigate('/')
    }
  }, [navigate, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      })
      return
    }

    if (!passwordValidation.isValid) {
      toast({
        title: "Senha não atende aos requisitos",
        description: "A senha deve atender a pelo menos 4 dos 5 requisitos de segurança.",
        variant: "destructive"
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi redefinida com sucesso.",
      })

      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (error) {
      console.error("Password update error:", error)
      toast({
        title: "Erro ao redefinir senha",
        description: "Não foi possível atualizar sua senha. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

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
        <div className="bg-card py-8 px-6 shadow-xl sm:rounded-2xl sm:px-10 border border-border">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Redefinir senha
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Digite sua nova senha abaixo
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background border-border focus:ring-primary focus:border-primary rounded-lg pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              
              {password && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-foreground">Requisitos da senha:</p>
                  <div className="space-y-1.5">
                    {getPasswordRequirements().map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        {req.valid ? (
                          <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={cn(
                          "transition-colors",
                          req.valid ? "text-green-600 dark:text-green-500 font-medium" : "text-muted-foreground"
                        )}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground italic mt-2">
                    * A senha deve atender a pelo menos 4 dos 5 requisitos
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">Confirmar nova senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Digite novamente sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background border-border focus:ring-primary focus:border-primary rounded-lg pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <Button 
                type="submit" 
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redefinindo...
                  </>
                ) : (
                  "Redefinir senha"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
