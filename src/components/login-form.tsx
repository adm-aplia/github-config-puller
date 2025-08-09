import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LoginFormProps {
  onSignIn?: (email: string, password: string) => Promise<{ error: any }>
}

export default function LoginForm({ onSignIn }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("Form submitted!", { email, password })
    e.preventDefault()
    
    if (!email || !password) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    console.log("Starting login process...")
    
    try {
      if (onSignIn) {
        console.log("Calling signIn function...")
        const { error } = await onSignIn(email, password)
        if (error) {
          throw new Error(error.message)
        }
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo à plataforma Aplia.",
        })
      } else {
        throw new Error("Função de login não configurada")
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      console.log("Login process finished")
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-200 dark:border-gray-700">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acesse sua conta</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Entre com suas credenciais</p>
      </div>
      
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
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
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
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Button variant="link" className="p-0 font-medium text-primary hover:text-primary/80">
              Esqueceu sua senha?
            </Button>
          </div>
        </div>

        <div>
          <Button 
            type="submit" 
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Button variant="link" className="p-0 font-medium text-primary hover:text-primary/80">
            Cadastre-se
          </Button>
        </p>
        <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
          <a 
            href="/termos" 
            className="hover:text-primary underline"
          >
            Termos de Uso
          </a>
          <span>•</span>
          <a 
            href="/privacidade" 
            className="hover:text-primary underline"
          >
            Política de Privacidade
          </a>
        </div>
      </div>
    </div>
  )
}