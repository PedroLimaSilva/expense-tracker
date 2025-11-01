export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string // ISO date string
  createdAt: number // timestamp
  updatedAt: number // timestamp
  synced: boolean // whether synced to cloud
  userId: string
}

export interface ExpenseFormData {
  description: string
  amount: number
  category: string
  date: string
}
