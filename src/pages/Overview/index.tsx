import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { ExpenseForm } from '../../components/Expense/form'
import { IncomeForm } from '../../components/Income/form'
import { type Expense, type ExpenseFormData } from '../../types/expense'
import { type Income, type IncomeFormData } from '../../types/income'
import { expenseService } from '../../services/expenseService'
import { incomeService } from '../../services/incomeService'
import { useAuth } from '../../contexts/AuthContext'
import './index.scss'

export function Overview() {
  const { expenses, income, loadData } = useData()
  const { currentUser } = useAuth()
  const { formatCurrency } = useCurrency()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'income' | 'expense' | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0)
  const netIncome = totalIncome - totalExpenses

  async function handleAddExpense(data: ExpenseFormData) {
    if (!currentUser) return

    try {
      await expenseService.createExpense(currentUser.uid, data)
      await loadData()
      setShowForm(false)
      setEditingExpense(null)
      navigate('/expenses')
    } catch (error) {
      console.error('Error adding expense:', error)
      throw error
    }
  }

  async function handleAddIncome(data: IncomeFormData) {
    if (!currentUser) return

    try {
      await incomeService.createIncome(currentUser.uid, data)
      await loadData()
      setShowForm(false)
      setEditingIncome(null)
      navigate('/income')
    } catch (error) {
      console.error('Error adding income:', error)
      throw error
    }
  }

  function handleCancelForm() {
    setShowForm(false)
    setEditingExpense(null)
    setEditingIncome(null)
    setFormType(null)
  }

  if (showForm) {
    if (formType === 'income') {
      return (
        <IncomeForm
          income={undefined}
          onSubmit={handleAddIncome}
          onCancel={handleCancelForm}
        />
      )
    }
    if (formType === 'expense') {
      return (
        <ExpenseForm
          expense={undefined}
          onSubmit={handleAddExpense}
          onCancel={handleCancelForm}
          onDelete={undefined}
        />
      )
    }
  }

  return (
    <div className="overview">
      <div className="dashboard-actions">
        <button
          onClick={() => {
            setEditingIncome(null)
            setEditingExpense(null)
            setFormType('income')
            setShowForm(true)
          }}
          className="btn btn-primary"
        >
          <span className="material-icons">add</span>
          Add Income
        </button>
        <button
          onClick={() => {
            setEditingIncome(null)
            setEditingExpense(null)
            setFormType('expense')
            setShowForm(true)
          }}
          className="btn btn-primary"
        >
          <span className="material-icons">add</span>
          Add Expense
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
  )
}
