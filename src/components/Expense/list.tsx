import { useState, useRef } from 'react'
import { type Expense } from '../../types/expense'
import { useCurrency } from '../../contexts/CurrencyContext'
import './list.scss'

interface ExpenseListProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (expenseId: string) => void
}

interface SwipeableItemProps {
  expense: Expense
  onEdit: (expense: Expense) => void
  onDelete: (expenseId: string) => void
  formatCurrency: (amount: number) => string
  formatDate: (dateString: string) => string
}

function SwipeableExpenseItem({ expense, onEdit, onDelete, formatCurrency, formatDate }: SwipeableItemProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const initialTranslateXRef = useRef(0)
  const itemRef = useRef<HTMLDivElement>(null)
  const deleteButtonWidth = 80

  const handleStart = (clientX: number, clientY: number) => {
    startXRef.current = clientX
    startYRef.current = clientY
    initialTranslateXRef.current = translateX
    setIsSwiping(true)
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isSwiping) return
    
    const deltaX = clientX - startXRef.current
    const deltaY = Math.abs(clientY - startYRef.current)
    
    // Only process swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 5) {
      const newTranslateX = initialTranslateXRef.current + deltaX
      // Only allow swiping left (negative translateX)
      const clampedTranslateX = Math.min(0, Math.max(newTranslateX, -deleteButtonWidth))
      setTranslateX(clampedTranslateX)
    }
  }

  const handleEnd = () => {
    setIsSwiping(false)
    const finalTranslateX = translateX
    
    // If swiped more than 50% of delete button width, show delete button
    if (finalTranslateX < -deleteButtonWidth / 2) {
      setTranslateX(-deleteButtonWidth)
    } else {
      // Otherwise, snap back
      setTranslateX(0)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isSwiping) {
      e.preventDefault()
      handleMove(e.touches[0].clientX, e.touches[0].clientY)
    }
  }

  const handleTouchEnd = () => {
    handleEnd()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isSwiping) {
      e.preventDefault()
      handleMove(e.clientX, e.clientY)
    }
  }

  const handleMouseUp = () => {
    handleEnd()
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const handleClick = (e: React.MouseEvent) => {
    // If item is swiped open, don't trigger edit
    if (translateX < 0) {
      e.stopPropagation()
      // Close the swipe
      setTranslateX(0)
      return
    }
    // Only trigger edit if we didn't just finish a swipe
    if (!isSwiping) {
      onEdit(expense)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = window.confirm('Are you sure you want to delete this expense?')
    if (confirmed) {
      onDelete(expense.id)
      setTranslateX(0)
    } else {
      // Reset swipe position if user cancels
      setTranslateX(0)
    }
  }

  const handleDeleteClick = () => {
    const confirmed = window.confirm('Are you sure you want to delete this expense?')
    if (confirmed) {
      onDelete(expense.id)
      setTranslateX(0)
    } else {
      // Reset swipe position if user cancels
      setTranslateX(0)
    }
  }

  return (
    <div className="expense-item-wrapper">
      <div 
        ref={itemRef}
        className={`expense-item ${translateX < 0 ? 'swiped' : ''}`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onEdit(expense)
          }
        }}
        title="Click to edit, swipe left to delete"
      >
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
      </div>
      <div className="expense-item-actions-swipe" onClick={handleDeleteClick}>
        <button 
          className="btn-delete-swipe"
          onClick={handleDelete}
          title="Delete expense"
        >
          <span className="material-icons">delete</span>
        </button>
      </div>
    </div>
  )
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
          <SwipeableExpenseItem
            key={expense.id}
            expense={expense}
            onEdit={onEdit}
            onDelete={onDelete}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        ))}
      </div>
    </div>
  )
}
