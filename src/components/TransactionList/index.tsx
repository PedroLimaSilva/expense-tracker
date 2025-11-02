import { useState, useRef } from 'react'
import { useCurrency } from '../../contexts/CurrencyContext'
import { type Expense } from '../../types/expense'
import { type Income } from '../../types/income'
import './index.scss'

type Transaction = Expense | Income
type TransactionType = 'expense' | 'income'

interface TransactionListProps {
  transactions: Transaction[]
  type: TransactionType
  onEdit: (transaction: Transaction) => void
  onDelete: (transactionId: string) => void
}

interface SwipeableItemProps {
  transaction: Transaction
  type: TransactionType
  onEdit: (transaction: Transaction) => void
  onDelete: (transactionId: string) => void
  formatCurrency: (amount: number) => string
  formatDate: (dateString: string) => string
}

function SwipeableTransactionItem({ transaction, type, onEdit, onDelete, formatCurrency, formatDate }: SwipeableItemProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const initialTranslateXRef = useRef(0)
  const itemRef = useRef<HTMLDivElement>(null)
  const deleteButtonWidth = 80

  const itemType = type === 'expense' ? 'expense' : 'income'

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
      onEdit(transaction)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    const confirmed = window.confirm(`Are you sure you want to delete this ${itemType}?`)
    if (confirmed) {
      onDelete(transaction.id)
      setTranslateX(0)
    } else {
      // Reset swipe position if user cancels
      setTranslateX(0)
    }
  }

  const handleDeleteClick = () => {
    const confirmed = window.confirm(`Are you sure you want to delete this ${itemType}?`)
    if (confirmed) {
      onDelete(transaction.id)
      setTranslateX(0)
    } else {
      // Reset swipe position if user cancels
      setTranslateX(0)
    }
  }

  return (
    <div className="transaction-item-wrapper">
      <div 
        ref={itemRef}
        className={`transaction-item ${translateX < 0 ? 'swiped' : ''}`}
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
            onEdit(transaction)
          }
        }}
        title={`Click to edit, swipe left to delete`}
      >
        <div className="transaction-item-content">
          <div className="transaction-item-main">
            <h4>{transaction.description}</h4>
            <p className="transaction-category">{transaction.category}</p>
            <p className="transaction-date">{formatDate(transaction.date)}</p>
          </div>
          <div className="transaction-item-amount">
            <p className="amount">{formatCurrency(transaction.amount)}</p>
            {!transaction.synced && (
              <span className="sync-badge" title="Not synced yet">Offline</span>
            )}
          </div>
        </div>
      </div>
      <div className="transaction-item-actions-swipe" onClick={handleDeleteClick}>
        <button 
          className="btn-delete-swipe"
          onClick={handleDelete}
          title={`Delete ${itemType}`}
        >
          <span className="material-icons">delete</span>
        </button>
      </div>
    </div>
  )
}

export function TransactionList({ transactions, type, onEdit, onDelete }: TransactionListProps) {
  const { formatCurrency } = useCurrency()
  const total = transactions.reduce((sum, transaction) => sum + transaction.amount, 0)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const typeLabels = {
    expense: { title: 'Total Expenses', empty: 'No expenses yet. Add your first expense to get started!' },
    income: { title: 'Total Income', empty: 'No income entries yet. Add your first income to get started!' }
  }

  const labels = typeLabels[type]

  if (transactions.length === 0) {
    return (
      <div className="transaction-list-empty">
        <p>{labels.empty}</p>
      </div>
    )
  }

  return (
    <div className="transaction-list">
      <div className={`transaction-summary ${type}-summary`}>
        <h3>{labels.title}</h3>
        <p className="total-amount">{formatCurrency(total)}</p>
      </div>
      
      <div className="transaction-items">
        {transactions.map(transaction => (
          <SwipeableTransactionItem
            key={transaction.id}
            transaction={transaction}
            type={type}
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
