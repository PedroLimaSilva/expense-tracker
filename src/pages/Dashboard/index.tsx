import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { useCategories } from '../../contexts/CategoryContext'
import { useTheme } from '../../contexts/ThemeContext'
import { expenseService } from '../../services/expenseService'
import { incomeService } from '../../services/incomeService'
import { syncService } from '../../services/syncService'
import { type Expense, type ExpenseFormData } from '../../types/expense'
import { type Income, type IncomeFormData } from '../../types/income'
import { ExpenseList } from '../../components/Expense/list'
import { IncomeList } from '../../components/Income/list'
import { ExpenseForm } from '../../components/Expense/form'
import { IncomeForm } from '../../components/Income/form'
import { CurrencySelector } from '../../components/CurrencySelector'
import { CategoryManager } from '../../components/CategoryManager'
import './index.scss'

type ViewType = 'expenses' | 'income' | 'overview' | 'categories'

export function Dashboard() {
  const { currentUser, logout } = useAuth()
  const { formatCurrency } = useCurrency()
  const { refreshCategories } = useCategories()
  const { theme, toggleTheme } = useTheme()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [income, setIncome] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [view, setView] = useState<ViewType>('overview')
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
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

  // Expense handlers
  async function handleAddExpense(data: ExpenseFormData) {
    if (!currentUser) return

    try {
      await expenseService.createExpense(currentUser.uid, data)
      await loadData()
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
      await loadData()
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
      await loadData()
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  function handleEditExpense(expense: Expense) {
    setEditingExpense(expense)
    setEditingIncome(null)
    setView('expenses')
    setShowForm(true)
  }

  // Income handlers
  async function handleAddIncome(data: IncomeFormData) {
    if (!currentUser) return

    try {
      await incomeService.createIncome(currentUser.uid, data)
      await loadData()
      setShowForm(false)
    } catch (error) {
      console.error('Error adding income:', error)
      throw error
    }
  }

  async function handleUpdateIncome(data: IncomeFormData) {
    if (!editingIncome) return

    try {
      const updatedIncome: Income = {
        ...editingIncome,
        ...data
      }
      await incomeService.updateIncome(updatedIncome)
      await loadData()
      setEditingIncome(null)
      setShowForm(false)
    } catch (error) {
      console.error('Error updating income:', error)
      throw error
    }
  }

  async function handleDeleteIncome(incomeId: string) {
    try {
      await incomeService.deleteIncome(incomeId)
      await loadData()
    } catch (error) {
      console.error('Error deleting income:', error)
    }
  }

  function handleEditIncome(income: Income) {
    setEditingIncome(income)
    setEditingExpense(null)
    setView('income')
    setShowForm(true)
  }

  function handleCancelForm() {
    setShowForm(false)
    setEditingExpense(null)
    setEditingIncome(null)
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0)
  const netIncome = totalIncome - totalExpenses

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Expense Tracker</h1>
        <div className="header-actions">
          <button
            onClick={toggleTheme}
            className="btn btn-small btn-secondary theme-toggle"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
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
          {/* <CurrencySelector /> */}
        </div>
      </header>

      <main className="dashboard-main">
        {showForm ? (
          editingIncome ? (
            <IncomeForm
              income={editingIncome}
              onSubmit={editingIncome ? handleUpdateIncome : handleAddIncome}
              onCancel={handleCancelForm}
            />
          ) : (
            <ExpenseForm
              expense={editingExpense}
              onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
              onCancel={handleCancelForm}
            />
          )
        ) : (
          <>
            {/* Tabs */}
            <div className="view-tabs">
              <button
                className={`tab ${view === 'overview' ? 'active' : ''}`}
                onClick={() => setView('overview')}
              >
                Overview
              </button>
              <button
                className={`tab ${view === 'income' ? 'active' : ''}`}
                onClick={() => setView('income')}
              >
                Income
              </button>
              <button
                className={`tab ${view === 'expenses' ? 'active' : ''}`}
                onClick={() => setView('expenses')}
              >
                Expenses
              </button>
              <button
                className={`tab ${view === 'categories' ? 'active' : ''}`}
                onClick={() => setView('categories')}
              >
                Categories
              </button>
            </div>

            {/* Overview */}
            {view === 'overview' && (
              <div className="overview-section">
                <div className="dashboard-actions">
                  <button
                    onClick={() => {
                      setEditingIncome(null)
                      setEditingExpense(null)
                      setView('income')
                      setShowForm(true)
                    }}
                    className="btn btn-primary"
                  >
                    + Add Income
                  </button>
                  <button
                    onClick={() => {
                      setEditingIncome(null)
                      setEditingExpense(null)
                      setView('expenses')
                      setShowForm(true)
                    }}
                    className="btn btn-primary"
                  >
                    + Add Expense
                  </button>
                </div>

                <div className="balance-summary">
                  <div className="balance-card income-card">
                    <h3>Total Income</h3>
                    <p className="balance-amount">{formatCurrency(totalIncome)}</p>
                  </div>
                  <div className="balance-card expense-card">
                    <h3>Total Expenses</h3>
                    <p className="balance-amount">{formatCurrency(totalExpenses)}</p>
                  </div>
                  <div className={`balance-card net-card ${netIncome >= 0 ? 'positive' : 'negative'}`}>
                    <h3>Net Income</h3>
                    <p className="balance-amount">{formatCurrency(netIncome)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Income View */}
            {view === 'income' && (
              <>
                <div className="dashboard-actions">
                  <button
                    onClick={() => {
                      setEditingIncome(null)
                      setShowForm(true)
                    }}
                    className="btn btn-primary"
                  >
                    + Add Income
                  </button>
                </div>
                <IncomeList
                  income={income}
                  onEdit={handleEditIncome}
                  onDelete={handleDeleteIncome}
                />
              </>
            )}

            {/* Expenses View */}
            {view === 'expenses' && (
              <>
                <div className="dashboard-actions">
                  <button
                    onClick={() => {
                      setEditingExpense(null)
                      setShowForm(true)
                    }}
                    className="btn btn-primary"
                  >
                    + Add Expense
                  </button>
                </div>
                <ExpenseList
                  expenses={expenses}
                  onEdit={handleEditExpense}
                  onDelete={handleDeleteExpense}
                />
              </>
            )}

            {/* Categories View */}
            {view === 'categories' && (
              <CategoryManager />
            )}
          </>
        )}
      </main>
    </div>
  )
}