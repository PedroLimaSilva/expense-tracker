export interface Income {
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

export interface IncomeFormData {
  description: string
  amount: number
  category: string
  date: string
}
