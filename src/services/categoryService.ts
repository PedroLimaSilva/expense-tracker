import { db as indexedDb } from '../db/indexeddb'
import { syncService } from './syncService'
import { type Category, type CategoryFormData } from '../types/category'

// Default categories for new users
const DEFAULT_EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Bills',
  'Entertainment',
  'Health',
  'Education',
  'Other'
]

const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Rental',
  'Gift',
  'Other'
]

class CategoryService {
  // Initialize default categories for a new user
  async initializeDefaultCategories(userId: string): Promise<void> {
    try {
      // Check if user already has categories
      const existingCategories = await indexedDb.categories
        .where('userId')
        .equals(userId)
        .toArray()

      if (existingCategories.length > 0) {
        return // Already initialized
      }

      const now = Date.now()
      const categories: Category[] = []

      // Create default expense categories
      for (const name of DEFAULT_EXPENSE_CATEGORIES) {
        categories.push({
          id: `cat_exp_${now}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          type: 'expense',
          userId,
          createdAt: now,
          updatedAt: now,
          synced: false
        })
      }

      // Create default income categories
      for (const name of DEFAULT_INCOME_CATEGORIES) {
        categories.push({
          id: `cat_inc_${now}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          type: 'income',
          userId,
          createdAt: now,
          updatedAt: now,
          synced: false
        })
      }

      // Save to IndexedDB
      await indexedDb.categories.bulkAdd(categories)

      // Try to sync to cloud
      try {
        for (const category of categories) {
          await syncService.saveCategoryToCloud(category)
          await indexedDb.categories.update(category.id, { synced: true })
        }
      } catch (error) {
        console.error('Error syncing default categories:', error)
        // Categories are saved locally, will sync later
      }
    } catch (error) {
      console.error('Error initializing default categories:', error)
      throw error
    }
  }

  // Create a new category
  async createCategory(userId: string, data: CategoryFormData): Promise<Category> {
    const now = Date.now()
    const category: Category = {
      id: `cat_${now}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      userId,
      createdAt: now,
      updatedAt: now,
      synced: false
    }

    // Save to IndexedDB first (offline-first)
    await indexedDb.categories.add(category)

    // Try to sync to cloud
    try {
      await syncService.saveCategoryToCloud(category)
      await indexedDb.categories.update(category.id, { synced: true })
      console.log('✅ Category synced to Firebase:', category.id)
    } catch (error) {
      console.error('❌ Error syncing new category to Firebase:', error)
      // Category is already saved locally, will sync later
    }

    return category
  }

  // Update an existing category
  async updateCategory(category: Category): Promise<void> {
    const updatedCategory: Category = {
      ...category,
      updatedAt: Date.now(),
      synced: false
    }

    // Update in IndexedDB
    await indexedDb.categories.update(category.id, updatedCategory)

    // Try to sync to cloud
    try {
      await syncService.saveCategoryToCloud(updatedCategory)
      await indexedDb.categories.update(category.id, { synced: true })
    } catch (error) {
      console.error('Error syncing updated category:', error)
      // Category is already updated locally, will sync later
    }
  }

  // Delete a category
  async deleteCategory(categoryId: string): Promise<void> {
    // Delete from IndexedDB first
    await indexedDb.categories.delete(categoryId)

    // Try to delete from cloud
    try {
      await syncService.deleteCategoryFromCloud(categoryId)
    } catch (error) {
      console.error('Error deleting category from cloud:', error)
      // Category is already deleted locally
    }
  }

  // Get all categories for a user
  async getCategories(userId: string): Promise<Category[]> {
    return await indexedDb.categories
      .where('userId')
      .equals(userId)
      .toArray()
  }

  // Get categories by type
  async getCategoriesByType(userId: string, type: 'expense' | 'income'): Promise<Category[]> {
    return await indexedDb.categories
      .where('userId')
      .equals(userId)
      .filter(cat => cat.type === type)
      .sortBy('name')
  }

  // Get category by ID
  async getCategoryById(categoryId: string): Promise<Category | undefined> {
    return await indexedDb.categories.get(categoryId)
  }
}

export const categoryService = new CategoryService()
