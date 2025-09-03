import { createContext, useContext, useLayoutEffect, useMemo, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    // Check localStorage first
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') {
      return stored as Theme
    }
    
    // Check if dark class is already applied (from the index.html script)
    if (document.documentElement.classList.contains('dark')) {
      return 'dark'
    }
    
    // Fallback to system preference
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  }
  
  return 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme: () => setTheme(current => current === 'dark' ? 'light' : 'dark')
  }), [theme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}