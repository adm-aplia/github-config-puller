import { useAuth } from "@/components/auth-provider"

export function useEmailVerification() {
  const { user, isEmailConfirmed, isInitialized } = useAuth()

  // Se o usuário está logado mas não confirmou o email
  const needsEmailVerification = user && !isEmailConfirmed && isInitialized

  return {
    needsEmailVerification: !!needsEmailVerification,
    user,
    isEmailConfirmed,
    isInitialized
  }
}