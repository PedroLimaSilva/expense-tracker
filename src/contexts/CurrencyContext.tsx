import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import {
  type CurrencyCode,
  CURRENCIES,
  detectCurrencyFromLocale
} from '../utils/currency'
import { userPreferencesService } from '../services/userPreferencesService'

interface CurrencyContextType {
  currency: CurrencyCode
  setCurrency: (currency: CurrencyCode) => void
  formatCurrency: (amount: number) => string
  loading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

interface CurrencyProviderProps {
  children: ReactNode
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const { currentUser } = useAuth()
  const [currency, setCurrencyState] = useState<CurrencyCode>(detectCurrencyFromLocale())
  const [loading, setLoading] = useState(true)

  // Load currency preference when user logs in
  useEffect(() => {
    async function loadCurrencyPreference() {
      try {
        setLoading(true)
        
        if (currentUser) {
          // User is logged in - load from Firestore
          const savedCurrency = await userPreferencesService.getCurrency(currentUser.uid)
          setCurrencyState(savedCurrency)
          console.log(`💾 Loaded currency preference from cloud: ${savedCurrency} (${CURRENCIES[savedCurrency].name})`)
        } else {
          // No user - detect from browser
          const detected = detectCurrencyFromLocale()
          setCurrencyState(detected)
          console.log(`🌍 Detected currency from browser locale: ${detected} (${CURRENCIES[detected].name})`)
        }
      } catch (error) {
        console.error('Error loading currency preference:', error)
        // Fallback to browser detection
        const detected = detectCurrencyFromLocale()
        setCurrencyState(detected)
      } finally {
        setLoading(false)
      }
    }

    loadCurrencyPreference()
  }, [currentUser])

  const setCurrency = async (newCurrency: CurrencyCode) => {
    setCurrencyState(newCurrency)
    
    // Save to Firestore if user is logged in
    if (currentUser) {
      try {
        await userPreferencesService.setCurrency(currentUser.uid, newCurrency)
        console.log(`✅ Saved currency preference to cloud: ${newCurrency}`)
      } catch (error) {
        console.error('Error saving currency preference:', error)
        // Currency state is already updated locally, will retry on next sync
      }
    }
  }

  const formatCurrency = (amount: number): string => {
    const locale = navigator.language || 'en-US'
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency
      }).format(amount)
    } catch (error) {
      console.error('Error formatting currency:', error)
      const currencyInfo = CURRENCIES[currency]
      return `${currencyInfo.symbol}${amount.toFixed(2)}`
    }
  }

  const value = {
    currency,
    setCurrency,
    formatCurrency,
    loading
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}