export interface Category {
  id: string
  name: string
  type: 'expense' | 'income'
  userId: string
  createdAt: number
  updatedAt: number
  synced: boolean
}

export interface CategoryFormData {
  name: string
  type: 'expense' | 'income'
}
