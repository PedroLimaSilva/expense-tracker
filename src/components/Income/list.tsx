import { type Income } from '../../types/income'
import { TransactionList } from '../TransactionList'

interface IncomeListProps {
  income: Income[]
  onEdit: (income: Income) => void
  onDelete: (incomeId: string) => void
}

export function IncomeList({ income, onEdit, onDelete }: IncomeListProps) {
  return (
    <TransactionList
      transactions={income}
      type="income"
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
