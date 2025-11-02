import { useState } from 'react'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { ExpenseList } from '../../components/Expense/list'
import { ExpenseForm } from '../../components/Expense/form'
import { type Expense, type ExpenseFormData } from '../../types/expense'
import { expenseService } from '../../services/expenseService'
import { useTimeWindow } from '../../contexts/TimeWindowContext'
import { filterByTimeWindow, formatTimeWindowHeading } from '../../utils/dateFilter'
import './index.scss'

export function ExpensesPage() {
  const { expenses, loadData } = useData()
  const { currentUser } = useAuth()
  const { timeWindow } = useTimeWindow()
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const filteredExpenses = filterByTimeWindow(expenses, timeWindow)

  // Get localized heading
  const displayLocale = navigator.language || 'en-US'
  const timeWindowHeading = formatTimeWindowHeading(timeWindow, displayLocale)

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
      setEditingExpense(null)
      setShowForm(false)
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  function handleEditExpense(expense: Expense) {
    setEditingExpense(expense)
    setShowForm(true)
  }

  function handleCancelForm() {
    setShowForm(false)
    setEditingExpense(null)
  }

  if (showForm) {
    return (
      <ExpenseForm
        expense={editingExpense}
        onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense}
        onCancel={handleCancelForm}
        onDelete={editingExpense ? handleDeleteExpense : undefined}
      />
    )
  }

  return (
    <div className="expenses-page">
      <h2 className="time-window-heading-top">{timeWindowHeading}</h2>
      
      <div className="dashboard-actions">
        <button
          onClick={() => {
            setEditingExpense(null)
            setShowForm(true)
          }}
          className="btn btn-primary"
        >
          <span className="material-icons">add</span>
          Add Expense
        </button>
      </div>
      <ExpenseList
        expenses={filteredExpenses}
        onEdit={handleEditExpense}
        onDelete={handleDeleteExpense}
      />
    </div>
  )
}
