import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

type PasswordStrength = "weak" | "medium" | "strong"

export default function SignupForm() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const { toast } = useToast()
  const { signUp, isLoading } = useAuth()
  const navigate = useNavigate()

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
    let strength: PasswordStrength = "weak"
    
    if (passedCount >= 5) strength = "strong"
    else if (passedCount >= 3) strength = "medium"

    return { ...validations, strength, isValid: passedCount >= 4 }
  }, [password])

  const getPasswordRequirements = () => [
    { text: "Pelo menos 8 caracteres", valid: passwordValidation.hasMinLength },
    { text: "Uma letra maiúscula", valid: passwordValidation.hasUppercase },
    { text: "Uma letra minúscula", valid: passwordValidation.hasLowercase },
    { text: "Um número", valid: passwordValidation.hasNumber },
    { text: "Um caractere especial", valid: passwordValidation.hasSpecialChar },
  ]

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
    if (!passwordValidation.isValid) {
      toast({ 
        title: "Senha não atende aos requisitos", 
        description: "A senha deve ter pelo menos 4 dos 5 requisitos de segurança.", 
        variant: "destructive" 
      })
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
      description: "Verifique seu e-mail para confirmar o cadastro e depois faça login.",
    })

    // Redirecionar para login após cadastro bem-sucedido
    setTimeout(() => {
      navigate("/")
    }, 2000)
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
          
          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Força da senha:</span>
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  passwordValidation.strength === "weak" && "bg-destructive/10 text-destructive",
                  passwordValidation.strength === "medium" && "bg-yellow-500/10 text-yellow-600",
                  passwordValidation.strength === "strong" && "bg-emerald-500/10 text-emerald-600"
                )}>
                  {passwordValidation.strength === "weak" && "Fraca"}
                  {passwordValidation.strength === "medium" && "Média"}
                  {passwordValidation.strength === "strong" && "Forte"}
                </span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-1">
                <div 
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    passwordValidation.strength === "weak" && "w-1/3 bg-destructive",
                    passwordValidation.strength === "medium" && "w-2/3 bg-yellow-500",
                    passwordValidation.strength === "strong" && "w-full bg-emerald-500"
                  )}
                />
              </div>
              
              {/* Requirements list */}
              <div className="space-y-1">
                {getPasswordRequirements().map((req, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    {req.valid ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <X className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={cn(
                      req.valid ? "text-emerald-600" : "text-muted-foreground"
                    )}>
                      {req.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              Aceito os <Link className="text-accent hover:text-accent/80 underline" to="/termos">termos de uso</Link> e <Link className="text-accent hover:text-accent/80 underline" to="/privacidade">política de privacidade</Link>
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
          Já tem uma conta? <Link className="font-medium text-accent hover:text-accent/80" to="/">Faça login aqui</Link>
        </p>
      </div>
    </div>
  )
}
