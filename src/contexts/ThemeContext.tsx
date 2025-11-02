import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { userPreferencesService } from '../services/userPreferencesService'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  loading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { currentUser } = useAuth()
  const [theme, setTheme] = useState<Theme>(() => {
    // Try to get from localStorage first
    try {
      const saved = localStorage.getItem('expense-tracker-theme') as Theme
      if (saved === 'light' || saved === 'dark') {
        return saved
      }
    } catch (error) {
      console.error('Error reading saved theme:', error)
    }
    
    // Fallback to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  })
  const [loading, setLoading] = useState(true)

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }

    // Update theme-color meta tag
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme === 'dark' ? '#161b22' : '#f8f9fa')
    }
  }, [theme])

  // Load theme preference when user logs in
  useEffect(() => {
    async function loadThemePreference() {
      try {
        setLoading(true)
        
        if (currentUser) {
          // User is logged in - load from Firestore
          const savedTheme = await userPreferencesService.getTheme(currentUser.uid)
          if (savedTheme) {
            setTheme(savedTheme)
            console.log(`💾 Loaded theme preference from cloud: ${savedTheme}`)
          }
        } else {
          // No user - check localStorage or system preference
          try {
            const saved = localStorage.getItem('expense-tracker-theme') as Theme
            if (saved === 'light' || saved === 'dark') {
              setTheme(saved)
            }
          } catch (error) {
            // Ignore localStorage errors
          }
        }
      } catch (error) {
        console.error('Error loading theme preference:', error)
      } finally {
        setLoading(false)
      }
    }

    loadThemePreference()
  }, [currentUser])

  const toggleTheme = async () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    
    // Save to localStorage
    try {
      localStorage.setItem('expense-tracker-theme', newTheme)
    } catch (error) {
      console.error('Error saving theme to localStorage:', error)
    }
    
    // Save to Firestore if user is logged in
    if (currentUser) {
      try {
        await userPreferencesService.setTheme(currentUser.uid, newTheme)
        console.log(`✅ Saved theme preference to cloud: ${newTheme}`)
      } catch (error) {
        console.error('Error saving theme preference:', error)
        // Theme state is already updated locally, will retry on next sync
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

