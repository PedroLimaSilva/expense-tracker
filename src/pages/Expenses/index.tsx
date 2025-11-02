import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { useAuth } from '../../contexts/AuthContext'
import { ExpenseList } from '../../components/Expense/list'
import { ExpenseForm } from '../../components/Expense/form'
import { type Expense, type ExpenseFormData } from '../../types/expense'
import { expenseService } from '../../services/expenseService'

export function ExpensesPage() {
  const { expenses, loadData } = useData()
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

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
        expenses={expenses}
        onEdit={handleEditExpense}
        onDelete={handleDeleteExpense}
      />
    </div>
  )
}
