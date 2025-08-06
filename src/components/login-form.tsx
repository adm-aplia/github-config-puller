import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Mail, Lock, Bot } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LoginFormProps {
  onLogin?: (email: string, password: string) => Promise<void>
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
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
      if (onLogin) {
        console.log("Calling onLogin function...")
        await onLogin(email, password)
      } else {
        console.log("No onLogin function, using demo mode...")
        // Credenciais de teste
        if (email === "admin@aplia.com" && password === "123456") {
          await new Promise(resolve => setTimeout(resolve, 1000))
          console.log("Demo login successful!")
          toast({
            title: "Login realizado com sucesso!",
            description: "Bem-vindo à plataforma Aplia.",
          })
        } else {
          throw new Error("Credenciais inválidas")
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Erro no login",
        description: "Use: admin@aplia.com / 123456",
        variant: "destructive"
      })
    } finally {
      console.log("Login process finished")
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-elegant">
          <Bot className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Aplia</h1>
        <p className="text-muted-foreground text-center mt-2">
          Assistentes de IA para Profissionais da Saúde
        </p>
      </div>

      <Card className="shadow-card border-border/50">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Entrar na plataforma</CardTitle>
          <CardDescription className="text-center">
            Digite suas credenciais para acessar sua conta
          </CardDescription>
          
          {/* Credenciais de teste */}
          <div className="bg-accent/50 p-3 rounded-lg border border-border/50">
            <p className="text-sm font-medium text-accent-foreground mb-1">Credenciais de teste:</p>
            <p className="text-xs text-muted-foreground">Email: admin@aplia.com</p>
            <p className="text-xs text-muted-foreground">Senha: 123456</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-primary hover:opacity-90 shadow-elegant" 
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
          </form>

          <div className="mt-6 space-y-4">
            <div className="text-center">
              <Button variant="link" className="text-sm text-muted-foreground">
                Esqueceu a senha?
              </Button>
            </div>
            
            <div className="text-center border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{" "}
                <Button variant="link" className="p-0 text-primary font-semibold">
                  Cadastre-se grátis
                </Button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}