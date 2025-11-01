import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { expenseService } from '../services/expenseService'
import { syncService } from '../services/syncService'
import { type Expense, type ExpenseFormData } from '../types/expense'
import { ExpenseList } from './ExpenseList'
import { ExpenseForm } from './ExpenseForm'
import { CurrencySelector } from './CurrencySelector'

export function Dashboard() {
  const { currentUser, logout } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
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

    loadExpenses()
    const unsubscribe = setupSyncListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [currentUser])

  async function loadExpenses() {
    if (!currentUser) return

    try {
      setLoading(true)
      const userExpenses = await expenseService.getExpenses(currentUser.uid)
      setExpenses(userExpenses)
    } catch (error) {
      console.error('Error loading expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  function setupSyncListener() {
    if (!currentUser) return

    // Set up real-time listener for cloud changes
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
      await loadExpenses()
    } catch (error) {
      console.error('Error syncing data:', error)
    } finally {
      setSyncing(false)
    }
  }

  async function handleAddExpense(data: ExpenseFormData) {
    if (!currentUser) return

    try {
      await expenseService.createExpense(currentUser.uid, data)
      await loadExpenses()
      setShowForm(false)
    } catch (error) {
      console.error('Error adding expense:', error)
      throw error
    }
  }

  async function handleUpdateExpense(data: ExpenseFormData) {
    if (!editingExpense) return

    try {
      const updatedExpense: Expense = {
        ...editingExpense,
        ...data
      }
      await expenseService.updateExpense(updatedExpense)
      await loadExpenses()
      setEditingExpense(null)
      setShowForm(false)
    } catch (error) {
      console.error('Error updating expense:', error)
      throw error
    }
  }

  async function handleDeleteExpense(expenseId: string) {
    try {
      await expenseService.deleteExpense(expenseId)
      await loadExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  function handleEdit(expense: Expense) {
    setEditingExpense(expense)
    setShowForm(true)
  }

  function handleCancelForm() {
    setShowForm(false)
    setEditingExpense(null)
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading expenses...</div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Expense Tracker</h1>
        <div className="header-actions">
          <CurrencySelector />
          <div className="status-indicators">
            {online ? (
              <span className="status-badge online" title="Online">Online</span>
            ) : (
              <span className="status-badge offline" title="Offline">Offline</span>
            )}
            <button 
              onClick={syncData} 
              disabled={syncing || !online}
              className="btn btn-small btn-secondary"
              title="Sync with cloud"
            >
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
          </div>
          <button onClick={logout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        {showForm ? (
          <ExpenseForm
            expense={editingExpense}
            onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
            onCancel={handleCancelForm}
          />
        ) : (
          <>
            <div className="dashboard-actions">
              <button 
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                + Add Expense
              </button>
            </div>
            <ExpenseList
              expenses={expenses}
              onEdit={handleEdit}
              onDelete={handleDeleteExpense}
            />
          </>
        )}
      </main>
    </div>
  )
}
