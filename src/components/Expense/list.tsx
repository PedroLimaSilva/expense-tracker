import { type Expense } from '../../types/expense'
import { TransactionList } from '../TransactionList'

interface ExpenseListProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (expenseId: string) => void
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  return (
    <TransactionList
      transactions={expenses}
      type="expense"
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
