import { useState, type FormEvent, useEffect } from 'react'
import { type Expense, type ExpenseFormData } from '../types/expense'
import { useCategories } from '../contexts/CategoryContext'

interface ExpenseFormProps {
  expense?: Expense | null
  onSubmit: (data: ExpenseFormData) => Promise<void>
  onCancel: () => void
}

export function ExpenseForm({ expense, onSubmit, onCancel }: ExpenseFormProps) {
  const { expenseCategories, loading: categoriesLoading } = useCategories()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (expenseCategories.length > 0 && !category) {
      setCategory(expenseCategories[0].name)
    }
  }, [expenseCategories, category])

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
      if (!expense && expenseCategories.length > 0) {
        setDescription('')
        setAmount('')
        setCategory(expenseCategories[0].name)
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
          {categoriesLoading ? (
            <select id="category" disabled>
              <option>Loading categories...</option>
            </select>
          ) : (
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={loading || expenseCategories.length === 0}
            >
              {expenseCategories.length === 0 ? (
                <option>No categories available</option>
              ) : (
                expenseCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))
              )}
            </select>
          )}
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
