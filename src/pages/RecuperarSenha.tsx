import { useState } from "react"
import { Link } from "react-router-dom"
import { Moon, Sun, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "@/hooks/use-theme"
import { supabase } from "@/integrations/supabase/client"
import { Loader2 } from "lucide-react"

const apliaLogoFull = "/lovable-uploads/0baeb265-4d17-458a-b42a-6fc9ce0041a6.png"
const apliaLogoFullDark = "/lovable-uploads/e9a17318-593a-428d-b166-e4f8be819529.png"

export default function RecuperarSenha() {
  const { theme, toggleTheme } = useTheme()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, preencha seu email.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })

      if (error) throw error

      setEmailSent(true)
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para recuperar sua senha.",
      })
    } catch (error) {
      console.error("Password recovery error:", error)
      toast({
        title: "Erro ao enviar email",
        description: "Não foi possível enviar o email de recuperação. Tente novamente.",
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
            <Link 
              to="/login" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para login
            </Link>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Recuperar senha
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {emailSent 
                ? "Email enviado com sucesso! Verifique sua caixa de entrada."
                : "Digite seu email para receber instruções de recuperação"
              }
            </p>
          </div>
          
          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background border-border focus:ring-primary focus:border-primary rounded-lg"
                  disabled={isLoading}
                />
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
                      Enviando...
                    </>
                  ) : (
                    "Enviar instruções"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
                <p>Enviamos um email para <strong className="text-foreground">{email}</strong> com instruções para redefinir sua senha.</p>
                <p className="mt-2">Não recebeu o email? Verifique sua pasta de spam ou tente novamente em alguns minutos.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setEmailSent(false)
                  setEmail("")
                }}
                className="w-full"
              >
                Enviar novamente
              </Button>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Lembrou sua senha?{" "}
              <Link to="/login" className="font-medium text-accent hover:text-accent/80 underline">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
