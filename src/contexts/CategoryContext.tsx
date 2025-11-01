import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { categoryService } from '../services/categoryService'
import { type Category, type CategoryFormData } from '../types/category'

interface CategoryContextType {
  expenseCategories: Category[]
  incomeCategories: Category[]
  loading: boolean
  createCategory: (data: CategoryFormData) => Promise<void>
  updateCategory: (category: Category) => Promise<void>
  deleteCategory: (categoryId: string) => Promise<void>
  refreshCategories: () => Promise<void>
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined)

export function useCategories() {
  const context = useContext(CategoryContext)
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider')
  }
  return context
}

interface CategoryProviderProps {
  children: ReactNode
}

export function CategoryProvider({ children }: CategoryProviderProps) {
  const { currentUser } = useAuth()
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([])
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  async function loadCategories() {
    if (!currentUser) {
      setExpenseCategories([])
      setIncomeCategories([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Initialize default categories if this is a new user
      await categoryService.initializeDefaultCategories(currentUser.uid)
      
      // Load user's categories
      const allCategories = await categoryService.getCategories(currentUser.uid)
      
      setExpenseCategories(allCategories.filter(cat => cat.type === 'expense').sort((a, b) => a.name.localeCompare(b.name)))
      setIncomeCategories(allCategories.filter(cat => cat.type === 'income').sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [currentUser])

  async function createCategory(data: CategoryFormData) {
    if (!currentUser) throw new Error('User not authenticated')
    
    await categoryService.createCategory(currentUser.uid, data)
    await loadCategories()
  }

  async function updateCategory(category: Category) {
    await categoryService.updateCategory(category)
    await loadCategories()
  }

  async function deleteCategory(categoryId: string) {
    await categoryService.deleteCategory(categoryId)
    await loadCategories()
  }

  async function refreshCategories() {
    await loadCategories()
  }

  const value = {
    expenseCategories,
    incomeCategories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories
  }

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  )
}
