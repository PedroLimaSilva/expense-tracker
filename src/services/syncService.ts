import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  Timestamp,
  onSnapshot
} from 'firebase/firestore'
import { db as firestoreDb } from '../config/firebase'
import { auth } from '../config/firebase'
import { db as indexedDb } from '../db/indexeddb'
import { type Expense } from '../types/expense'
import { type Income } from '../types/income'
import { type Category } from '../types/category'

class SyncService {
  private syncInProgress = false

  // Get all expenses for a user from Firestore
  async fetchFromCloud(userId: string): Promise<Expense[]> {
    try {
      const expensesRef = collection(firestoreDb, 'expenses')
      const q = query(expensesRef, where('userId', '==', userId))
      const querySnapshot = await getDocs(q)
      
      // Querying a non-existent collection returns an empty snapshot, which is fine
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate().toISOString().split('T')[0] : data.date,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
          synced: true,
          userId: data.userId || userId // Ensure userId is present
        } as Expense
      })
    } catch (error) {
      console.error('Error fetching expenses from cloud:', error)
      // Return empty array if collection doesn't exist rather than throwing
      // This prevents sync failures when the collection hasn't been created yet
      if ((error as any).code === 'not-found' || (error as any).code === 'permission-denied') {
        console.warn('Expenses collection may not exist yet, returning empty array')
        return []
      }
      throw error
    }
  }

  // Save expense to Firestore
  async saveToCloud(expense: Expense): Promise<void> {
    try {
      // Check authentication state
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('User not authenticated')
      }
      
      console.log('🔐 Authentication check:', {
        currentUserId: currentUser.uid,
        expenseUserId: expense.userId,
        match: currentUser.uid === expense.userId
      })
      
      if (currentUser.uid !== expense.userId) {
        throw new Error(`User ID mismatch: auth.uid=${currentUser.uid}, expense.userId=${expense.userId}`)
      }
      
      const expenseRef = doc(firestoreDb, 'expenses', expense.id)
      
      const expenseData = {
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        date: expense.date,
        createdAt: Timestamp.fromMillis(expense.createdAt),
        updatedAt: Timestamp.fromMillis(expense.updatedAt),
        userId: expense.userId
      }
      
      console.log('📤 Attempting to save expense to Firebase:', {
        id: expense.id,
        userId: expense.userId,
        authUid: currentUser.uid,
        data: expenseData
      })
      
      // Use setDoc to create or update - Firestore will create the collection automatically if it doesn't exist
      // setDoc with merge ensures userId is always present
      await setDoc(expenseRef, expenseData, { merge: true })
      console.log('✅ Expense saved to Firebase')
    } catch (error) {
      console.error('❌ Error saving to Firebase:', error)
      if (error instanceof Error) {
        console.error('Error code:', (error as any).code)
        console.error('Error message:', error.message)
        console.error('Full error:', error)
      }
      throw error
    }
  }

  // Delete expense from Firestore
  async deleteFromCloud(expenseId: string): Promise<void> {
    try {
      const expenseRef = doc(firestoreDb, 'expenses', expenseId)
      await deleteDoc(expenseRef)
    } catch (error) {
      console.error('Error deleting from cloud:', error)
      throw error
    }
  }

  // Sync local changes to cloud
  async syncToCloud(userId: string): Promise<void> {
    if (this.syncInProgress) return
    this.syncInProgress = true

    try {
      const allExpenses = await indexedDb.expenses.where('userId').equals(userId).toArray()
      const unsyncedExpenses = allExpenses.filter(expense => !expense.synced)

      const updates: Promise<void>[] = []

      for (const expense of unsyncedExpenses) {
        try {
          await this.saveToCloud(expense)
          // Mark as synced in IndexedDB
          updates.push(
            indexedDb.expenses.update(expense.id, { synced: true }).then(() => {})
          )
        } catch (error) {
          console.error(`Error syncing expense ${expense.id}:`, error)
        }
      }

      await Promise.all(updates)
    } catch (error) {
      console.error('Error syncing to cloud:', error)
      throw error
    } finally {
      this.syncInProgress = false
    }
  }

  // Sync cloud changes to local
  async syncFromCloud(userId: string): Promise<void> {
    try {
      const cloudExpenses = await this.fetchFromCloud(userId)
      
      // Update or insert expenses in IndexedDB
      for (const expense of cloudExpenses) {
        const existing = await indexedDb.expenses.get(expense.id)
        if (!existing || expense.updatedAt > existing.updatedAt) {
          await indexedDb.expenses.put({ ...expense, synced: true })
        }
      }
    } catch (error) {
      console.error('Error syncing from cloud:', error)
      throw error
    }
  }

  // Full sync: push local changes and pull cloud changes
  async fullSync(userId: string): Promise<void> {
    try {
      await this.syncToCloud(userId)
      await this.syncFromCloud(userId)
      await this.syncIncomeToCloud(userId)
      await this.syncIncomeFromCloud(userId)
      await this.syncCategoriesToCloud(userId)
      await this.syncCategoriesFromCloud(userId)
    } catch (error) {
      console.error('Error in full sync:', error)
      throw error
    }
  }

  // ========== INCOME SYNC METHODS ==========

  // Get all income for a user from Firestore
  async fetchIncomeFromCloud(userId: string): Promise<Income[]> {
    try {
      const incomeRef = collection(firestoreDb, 'income')
      const q = query(incomeRef, where('userId', '==', userId))
      const querySnapshot = await getDocs(q)
      
      // Querying a non-existent collection returns an empty snapshot, which is fine
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate().toISOString().split('T')[0] : data.date,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
          synced: true,
          userId: data.userId || userId // Ensure userId is present
        } as Income
      })
    } catch (error) {
      console.error('Error fetching income from cloud:', error)
      // Return empty array if collection doesn't exist rather than throwing
      // This prevents sync failures when the collection hasn't been created yet
      if ((error as any).code === 'not-found' || (error as any).code === 'permission-denied') {
        console.warn('Income collection may not exist yet, returning empty array')
        return []
      }
      throw error
    }
  }

  // Save income to Firestore
  async saveIncomeToCloud(income: Income): Promise<void> {
    try {
      // Check authentication state
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('User not authenticated')
      }
      
      if (currentUser.uid !== income.userId) {
        throw new Error(`User ID mismatch: auth.uid=${currentUser.uid}, income.userId=${income.userId}`)
      }
      
      const incomeRef = doc(firestoreDb, 'income', income.id)
      
      const incomeData = {
        id: income.id,
        description: income.description,
        amount: income.amount,
        category: income.category,
        date: income.date,
        createdAt: Timestamp.fromMillis(income.createdAt),
        updatedAt: Timestamp.fromMillis(income.updatedAt),
        userId: income.userId
      }
      
      console.log('📤 Attempting to save income to Firebase:', {
        id: income.id,
        userId: income.userId,
        authUid: currentUser.uid,
        data: incomeData
      })
      
      // Use setDoc to create or update - Firestore will create the collection automatically if it doesn't exist
      // setDoc with merge ensures userId is always present
      await setDoc(incomeRef, incomeData, { merge: true })
      console.log('✅ Income saved to Firebase')
    } catch (error) {
      console.error('❌ Error saving income to Firebase:', error)
      if (error instanceof Error) {
        console.error('Error code:', (error as any).code)
        console.error('Error message:', error.message)
        console.error('Full error:', error)
      }
      throw error
    }
  }

  // Delete income from Firestore
  async deleteIncomeFromCloud(incomeId: string): Promise<void> {
    try {
      const incomeRef = doc(firestoreDb, 'income', incomeId)
      await deleteDoc(incomeRef)
    } catch (error) {
      console.error('Error deleting income from cloud:', error)
      throw error
    }
  }

  // Sync local income changes to cloud
  async syncIncomeToCloud(userId: string): Promise<void> {
    if (this.syncInProgress) return
    
    try {
      const allIncome = await indexedDb.income.where('userId').equals(userId).toArray()
      const unsyncedIncome = allIncome.filter(income => !income.synced)

      const updates: Promise<void>[] = []

      for (const income of unsyncedIncome) {
        try {
          await this.saveIncomeToCloud(income)
          // Mark as synced in IndexedDB
          updates.push(
            indexedDb.income.update(income.id, { synced: true }).then(() => {})
          )
        } catch (error) {
          console.error(`Error syncing income ${income.id}:`, error)
        }
      }

      await Promise.all(updates)
    } catch (error) {
      console.error('Error syncing income to cloud:', error)
      throw error
    }
  }

  // Sync cloud income changes to local
  async syncIncomeFromCloud(userId: string): Promise<void> {
    try {
      const cloudIncome = await this.fetchIncomeFromCloud(userId)
      
      // Update or insert income in IndexedDB
      for (const income of cloudIncome) {
        const existing = await indexedDb.income.get(income.id)
        if (!existing || income.updatedAt > existing.updatedAt) {
          await indexedDb.income.put({ ...income, synced: true })
        }
      }
    } catch (error) {
      console.error('Error syncing income from cloud:', error)
      throw error
    }
  }

  // Set up real-time listener for cloud changes
  setupCloudListener(userId: string, callback: (expenses: Expense[]) => void): () => void {
    const expensesRef = collection(firestoreDb, 'expenses')
    const q = query(expensesRef, where('userId', '==', userId))
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const expenses: Expense[] = []
      
      snapshot.docChanges().forEach(async (change) => {
        const data = change.doc.data()
        const expense: Expense = {
          id: change.doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate().toISOString().split('T')[0] : data.date,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
          synced: true,
          userId
        } as Expense

        // Update IndexedDB
        if (change.type === 'removed') {
          await indexedDb.expenses.delete(expense.id)
        } else {
          await indexedDb.expenses.put(expense)
        }

        expenses.push(expense)
      })

      // Fetch all expenses for callback
      const allExpenses = await indexedDb.expenses.where('userId').equals(userId).toArray()
      callback(allExpenses)
    })

    return unsubscribe
  }

  // ========== CATEGORY SYNC METHODS ==========

  // Get all categories for a user from Firestore
  async fetchCategoriesFromCloud(userId: string): Promise<Category[]> {
    try {
      const categoriesRef = collection(firestoreDb, 'categories')
      const q = query(categoriesRef, where('userId', '==', userId))
      const querySnapshot = await getDocs(q)
      
      // Querying a non-existent collection returns an empty snapshot, which is fine
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
          synced: true,
          userId: data.userId || userId // Ensure userId is present
        } as Category
      })
    } catch (error) {
      console.error('Error fetching categories from cloud:', error)
      // Return empty array if collection doesn't exist rather than throwing
      // This prevents sync failures when the collection hasn't been created yet
      if ((error as any).code === 'not-found' || (error as any).code === 'permission-denied') {
        console.warn('Categories collection may not exist yet, returning empty array')
        return []
      }
      throw error
    }
  }

  // Save category to Firestore
  async saveCategoryToCloud(category: Category): Promise<void> {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('User not authenticated')
      }
      
      console.log('🔐 Category auth check:', {
        currentUserId: currentUser.uid,
        categoryUserId: category.userId,
        match: currentUser.uid === category.userId
      })
      
      if (currentUser.uid !== category.userId) {
        throw new Error(`User ID mismatch: auth.uid=${currentUser.uid}, category.userId=${category.userId}`)
      }
      
      const categoryRef = doc(firestoreDb, 'categories', category.id)
      
      const categoryData = {
        id: category.id,
        name: category.name,
        type: category.type,
        userId: category.userId,
        createdAt: Timestamp.fromMillis(category.createdAt),
        updatedAt: Timestamp.fromMillis(category.updatedAt)
      }
      
      console.log('📤 Attempting to save category to Firebase:', {
        id: category.id,
        name: category.name,
        type: category.type,
        userId: category.userId,
        authUid: currentUser.uid,
        data: categoryData
      })
      
      // Use setDoc to create or update - Firestore will create the collection automatically if it doesn't exist
      // setDoc with merge ensures userId is always present
      await setDoc(categoryRef, categoryData, { merge: true })
      console.log('✅ Category saved to Firebase')
    } catch (error) {
      console.error('❌ Error saving category to Firebase:', error)
      if (error instanceof Error) {
        console.error('Error code:', (error as any).code)
        console.error('Error message:', error.message)
        console.error('Full error:', error)
      }
      throw error
    }
  }

  // Delete category from Firestore
  async deleteCategoryFromCloud(categoryId: string): Promise<void> {
    try {
      const categoryRef = doc(firestoreDb, 'categories', categoryId)
      await deleteDoc(categoryRef)
    } catch (error) {
      console.error('Error deleting category from cloud:', error)
      throw error
    }
  }

  // Sync local category changes to cloud
  async syncCategoriesToCloud(userId: string): Promise<void> {
    try {
      const allCategories = await indexedDb.categories.where('userId').equals(userId).toArray()
      const unsyncedCategories = allCategories.filter(category => !category.synced)

      const updates: Promise<void>[] = []

      for (const category of unsyncedCategories) {
        try {
          await this.saveCategoryToCloud(category)
          updates.push(
            indexedDb.categories.update(category.id, { synced: true }).then(() => {})
          )
        } catch (error) {
          console.error(`Error syncing category ${category.id}:`, error)
        }
      }

      await Promise.all(updates)
    } catch (error) {
      console.error('Error syncing categories to cloud:', error)
      throw error
    }
  }

  // Sync cloud category changes to local
  async syncCategoriesFromCloud(userId: string): Promise<void> {
    try {
      const cloudCategories = await this.fetchCategoriesFromCloud(userId)
      
      for (const category of cloudCategories) {
        const existing = await indexedDb.categories.get(category.id)
        if (!existing || category.updatedAt > existing.updatedAt) {
          await indexedDb.categories.put({ ...category, synced: true })
        }
      }
    } catch (error) {
      console.error('Error syncing categories from cloud:', error)
      throw error
    }
  }
}

export const syncService = new SyncService()
