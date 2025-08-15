
import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { supabase } from "@/integrations/supabase/client"
import { User, Session } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  session: Session | null
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signOut: () => Promise<void>
  isLoading: boolean
  isInitialized: boolean
  isEmailConfirmed: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Função para garantir que os dados do usuário estejam inicializados
  const ensureUserInitialized = async (userId: string) => {
    try {
      await supabase.rpc('ensure_user_initialized', { p_user_id: userId })
    } catch (error) {
      console.error('Erro ao inicializar dados do usuário:', error)
    }
  }

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        // Inicializar dados do usuário quando logar
        if (session?.user && event === 'SIGNED_IN') {
          await ensureUserInitialized(session.user.id)
        }
        
        if (!isInitialized) {
          setIsInitialized(true)
        }
      }
    )

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Inicializar dados do usuário se já estiver logado
      if (session?.user) {
        await ensureUserInitialized(session.user.id)
      }
      
      if (!isInitialized) {
        setIsInitialized(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [isInitialized])

  const signUp = async (email: string, password: string, fullName?: string) => {
    setIsLoading(true)
    try {
      const redirectUrl = `${window.location.origin}/dashboard`
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: fullName ? { full_name: fullName } : undefined
        }
      })
      return { error }
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      return { error }
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      return { error }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      // Tentar logout no servidor apenas se houver sessão
      if (session) {
        await supabase.auth.signOut()
      }
    } catch (error) {
      console.error('Erro no logout:', error)
    } finally {
      // Sempre limpar estado local
      setSession(null)
      setUser(null)
    }
  }

  // Legacy login function for backward compatibility
  const login = async (email: string, password: string) => {
    const { error } = await signIn(email, password)
    if (error) {
      throw new Error(error.message)
    }
  }

  const logout = () => {
    signOut()
  }

  const value: AuthContextType = {
    user,
    session,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    isLoading,
    isInitialized,
    isEmailConfirmed: user?.email_confirmed_at !== null
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
