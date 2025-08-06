import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isInitialized: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Simular verificação de autenticação inicial
    const initAuth = async () => {
      try {
        // Verificar se há dados de usuário no localStorage
        const savedUser = localStorage.getItem('aplia_user')
        if (savedUser) {
          setUser(JSON.parse(savedUser))
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error)
      } finally {
        setIsInitialized(true)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Simular chamada de API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simular usuário logado
      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0]
      }
      
      setUser(mockUser)
      localStorage.setItem('aplia_user', JSON.stringify(mockUser))
    } catch (error) {
      throw new Error('Erro no login')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('aplia_user')
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isInitialized
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