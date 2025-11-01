import { type Expense } from '../../types/expense'
import { useCurrency } from '../../contexts/CurrencyContext'
import './list.scss'

interface ExpenseListProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (expenseId: string) => void
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  const { formatCurrency } = useCurrency()
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  if (expenses.length === 0) {
    return (
      <div className="expense-list-empty">
        <p>No expenses yet. Add your first expense to get started!</p>
      </div>
    )
  }

  return (
    <div className="expense-list">
      <div className="expense-summary">
        <h3>Total Expenses</h3>
        <p className="total-amount">{formatCurrency(total)}</p>
      </div>
      
      <div className="expense-items">
        {expenses.map(expense => (
          <div key={expense.id} className="expense-item">
            <div className="expense-item-content">
              <div className="expense-item-main">
                <h4>{expense.description}</h4>
                <p className="expense-category">{expense.category}</p>
                <p className="expense-date">{formatDate(expense.date)}</p>
              </div>
              <div className="expense-item-amount">
                <p className="amount">{formatCurrency(expense.amount)}</p>
                {!expense.synced && (
                  <span className="sync-badge" title="Not synced yet">Offline</span>
                )}
              </div>
            </div>
            <div className="expense-item-actions">
              <button 
                onClick={() => onEdit(expense)}
                className="btn btn-small btn-secondary"
                title="Edit expense"
              >
                Edit
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this expense?')) {
                    onDelete(expense.id)
                  }
                }}
                className="btn btn-small btn-danger"
                title="Delete expense"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
