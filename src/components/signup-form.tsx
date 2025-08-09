import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Eye, EyeOff, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

export default function SignupForm() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const { toast } = useToast()
  const { signUp, isLoading, session } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) {
      toast({ title: "Nome obrigatório", description: "Informe seu nome completo.", variant: "destructive" })
      return
    }
    if (!email || !password) {
      toast({ title: "Campos obrigatórios", description: "Preencha e-mail e senha.", variant: "destructive" })
      return
    }
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Use pelo menos 6 caracteres.", variant: "destructive" })
      return
    }
    if (password !== confirmPassword) {
      toast({ title: "As senhas não coincidem", description: "Verifique e tente novamente.", variant: "destructive" })
      return
    }
    if (!acceptedTerms) {
      toast({ title: "Aceite os termos", description: "Você precisa aceitar os termos para continuar.", variant: "destructive" })
      return
    }

    const { error } = await signUp(email, password, fullName)
    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" })
      return
    }

    toast({
      title: "Conta criada com sucesso!",
      description: session ? "Redirecionando..." : "Verifique seu e-mail para confirmar o cadastro.",
    })
  }

  return (
    <div className="bg-card py-8 px-6 shadow-card sm:rounded-2xl sm:px-10 border border-border">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-foreground font-medium">Nome completo</Label>
          <Input
            id="fullName"
            name="fullName"
            placeholder="Seu nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="bg-background border-input focus:ring-accent focus:border-accent rounded-lg h-11"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground font-medium">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background border-input focus:ring-accent focus:border-accent rounded-lg h-11"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground font-medium">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background border-input focus:ring-accent focus:border-accent rounded-lg h-11 pr-10"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-foreground font-medium">Confirmar senha</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repita sua senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-background border-input focus:ring-accent focus:border-accent rounded-lg h-11 pr-10"
              disabled={isLoading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(v) => setAcceptedTerms(Boolean(v))} />
          <div className="space-y-1 leading-none">
            <Label htmlFor="terms" className="text-sm text-foreground">
              Aceito os <a className="text-accent hover:text-accent/80 underline" href="/termos">termos de uso</a> e <a className="text-accent hover:text-accent/80 underline" href="/privacidade">política de privacidade</a>
            </Label>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="gap-2 w-full h-11 rounded-lg shadow-sm text-sm font-medium bg-accent text-accent-foreground hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Criar conta
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Já tem uma conta? <a className="font-medium text-accent hover:text-accent/80" href="/">Faça login aqui</a>
        </p>
      </div>
    </div>
  )
}
