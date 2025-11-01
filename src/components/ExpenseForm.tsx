import { useState, type FormEvent, useEffect } from 'react'
import { type Expense, type ExpenseFormData } from '../types/expense'

interface ExpenseFormProps {
  expense?: Expense | null
  onSubmit: (data: ExpenseFormData) => Promise<void>
  onCancel: () => void
}

const CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Other'
]

export function ExpenseForm({ expense, onSubmit, onCancel }: ExpenseFormProps) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (expense) {
      setDescription(expense.description)
      setAmount(expense.amount.toString())
      setCategory(expense.category)
      setDate(expense.date)
    }
  }, [expense])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    
    if (!description.trim() || !amount) {
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return
    }

    try {
      setLoading(true)
      await onSubmit({
        description: description.trim(),
        amount: numAmount,
        category,
        date
      })
      // Reset form if new expense
      if (!expense) {
        setDescription('')
        setAmount('')
        setCategory(CATEGORIES[0])
        setDate(new Date().toISOString().split('T')[0])
      }
    } catch (error) {
      console.error('Error submitting expense:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="expense-form-container">
      <form onSubmit={handleSubmit} className="expense-form">
        <h3>{expense ? 'Edit Expense' : 'Add Expense'}</h3>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            disabled={loading}
            placeholder="Enter expense description"
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            disabled={loading}
            placeholder="0.00"
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            disabled={loading}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Saving...' : (expense ? 'Update' : 'Add')}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
