import { type Income } from '../../types/income'
import { useCurrency } from '../../contexts/CurrencyContext'
import './list.scss'

interface IncomeListProps {
  income: Income[]
  onEdit: (income: Income) => void
  onDelete: (incomeId: string) => void
}

export function IncomeList({ income, onEdit, onDelete }: IncomeListProps) {
  const { formatCurrency } = useCurrency()
  const total = income.reduce((sum, item) => sum + item.amount, 0)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  if (income.length === 0) {
    return (
      <div className="expense-list-empty">
        <p>No income entries yet. Add your first income to get started!</p>
      </div>
    )
  }

  return (
    <div className="expense-list">
      <div className="expense-summary" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
        <h3>Total Income</h3>
        <p className="total-amount">{formatCurrency(total)}</p>
      </div>
      
      <div className="expense-items">
        {income.map(item => (
          <div key={item.id} className="expense-item">
            <div className="expense-item-content">
              <div className="expense-item-main">
                <h4>{item.description}</h4>
                <p className="expense-category">{item.category}</p>
                <p className="expense-date">{formatDate(item.date)}</p>
              </div>
              <div className="expense-item-amount">
                <p className="amount">{formatCurrency(item.amount)}</p>
                {!item.synced && (
                  <span className="sync-badge" title="Not synced yet">Offline</span>
                )}
              </div>
            </div>
            <div className="expense-item-actions">
              <button 
                onClick={() => onEdit(item)}
                className="btn btn-small btn-secondary"
                title="Edit income"
              >
                Edit
              </button>
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this income entry?')) {
                    onDelete(item.id)
                  }
                }}
                className="btn btn-small btn-danger"
                title="Delete income"
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
