import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { useCurrency } from '../../contexts/CurrencyContext'
import { ExpenseForm } from '../../components/Expense/form'
import { IncomeForm } from '../../components/Income/form'
import { type ExpenseFormData } from '../../types/expense'
import { type IncomeFormData } from '../../types/income'
import { expenseService } from '../../services/expenseService'
import { incomeService } from '../../services/incomeService'
import { useAuth } from '../../contexts/AuthContext'
import { useTimeWindow } from '../../contexts/TimeWindowContext'
import { filterByTimeWindow, formatTimeWindowHeading } from '../../utils/dateFilter'
import './index.scss'

export function Overview() {
  const { expenses, income, loadData } = useData()
  const { currentUser } = useAuth()
  const { formatCurrency } = useCurrency()
  const { timeWindow } = useTimeWindow()
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'income' | 'expense' | null>(null)

  const filteredExpenses = filterByTimeWindow(expenses, timeWindow)
  const filteredIncome = filterByTimeWindow(income, timeWindow)

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalIncome = filteredIncome.reduce((sum, inc) => sum + inc.amount, 0)
  const netIncome = totalIncome - totalExpenses

  // Get localized heading
  const displayLocale = navigator.language || 'en-US'
  const timeWindowHeading = formatTimeWindowHeading(timeWindow, displayLocale)

  async function handleAddExpense(data: ExpenseFormData) {
    if (!currentUser) return

    try {
      await expenseService.createExpense(currentUser.uid, data)
      await loadData()
      setShowForm(false)
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
      navigate('/income')
    } catch (error) {
      console.error('Error adding income:', error)
      throw error
    }
  }

  function handleCancelForm() {
    setShowForm(false)
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
      <h2 className="time-window-heading-top">{timeWindowHeading}</h2>

      <div className="dashboard-actions">
        <button
          onClick={() => {
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
