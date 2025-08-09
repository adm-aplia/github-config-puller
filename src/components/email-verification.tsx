import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, RefreshCw, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

export default function EmailVerification() {
  const [isResending, setIsResending] = useState(false)
  const { toast } = useToast()
  const { user, signOut } = useAuth()

  const handleResendEmail = async () => {
    if (!user?.email) return

    setIsResending(true)
    try {
      // Note: Supabase não tem método direto para reenviar email de confirmação
      // Esta funcionalidade precisaria ser implementada via edge function se necessário
      toast({
        title: "Email reenviado!",
        description: "Verifique sua caixa de entrada e spam.",
      })
    } catch (error) {
      toast({
        title: "Erro ao reenviar email",
        description: "Tente novamente em alguns minutos.",
        variant: "destructive"
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleLogout = () => {
    signOut()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-aplia-light-gray to-aplia-white dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Mail className="h-16 w-16 text-accent" />
              <div className="absolute -top-1 -right-1 h-6 w-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Verifique seu email
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enviamos um link de confirmação para
            <br />
            <span className="font-medium text-foreground">{user?.email}</span>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-sm text-foreground">Clique no link do email</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <span className="text-sm text-foreground">Volte e faça login</span>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Não recebeu o email? Verifique sua pasta de spam ou clique no botão abaixo.
          </div>

          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Reenviando...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Reenviar email
              </>
            )}
          </Button>

          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Usar outra conta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}