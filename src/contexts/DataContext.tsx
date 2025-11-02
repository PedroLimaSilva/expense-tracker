import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useCategories } from './CategoryContext'
import { expenseService } from '../services/expenseService'
import { incomeService } from '../services/incomeService'
import { syncService } from '../services/syncService'
import { type Expense } from '../types/expense'
import { type Income } from '../types/income'

interface DataContextType {
  expenses: Expense[]
  income: Income[]
  loading: boolean
  syncing: boolean
  online: boolean
  loadData: () => Promise<void>
  syncData: () => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

interface DataProviderProps {
  children: ReactNode
}

export function DataProvider({ children }: DataProviderProps) {
  const { currentUser } = useAuth()
  const { refreshCategories } = useCategories()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [income, setIncome] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    // Set up online/offline listeners
    const handleOnline = () => {
      setOnline(true)
      if (currentUser) {
        syncData()
      }
    }
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return

    loadData()
    const unsubscribe = setupSyncListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [currentUser])

  async function loadData() {
    if (!currentUser) return

    try {
      setLoading(true)
      const [userExpenses, userIncome] = await Promise.all([
        expenseService.getExpenses(currentUser.uid),
        incomeService.getIncome(currentUser.uid)
      ])
      setExpenses(userExpenses)
      setIncome(userIncome)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  function setupSyncListener() {
    if (!currentUser) return

    // Set up real-time listener for cloud changes (expenses)
    const unsubscribe = syncService.setupCloudListener(currentUser.uid, (updatedExpenses) => {
      setExpenses(updatedExpenses.sort((a, b) => {
        const dateA = new Date(a.date).getTime()
        const dateB = new Date(b.date).getTime()
        return dateB - dateA
      }))
    })

    return unsubscribe
  }

  async function syncData() {
    if (!currentUser || syncing) return

    try {
      setSyncing(true)
      await syncService.fullSync(currentUser.uid)
      await loadData()
      await refreshCategories() // Refresh categories after sync
    } catch (error) {
      console.error('Error syncing data:', error)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <DataContext.Provider value={{ expenses, income, loading, syncing, online, loadData, syncData }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
