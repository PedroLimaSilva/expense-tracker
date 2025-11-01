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

class SyncService {
  private syncInProgress = false

  // Get all expenses for a user from Firestore
  async fetchFromCloud(userId: string): Promise<Expense[]> {
    try {
      const expensesRef = collection(firestoreDb, 'expenses')
      const q = query(expensesRef, where('userId', '==', userId))
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date: data.date instanceof Timestamp ? data.date.toDate().toISOString().split('T')[0] : data.date,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toMillis() : data.updatedAt,
          synced: true,
          userId
        } as Expense
      })
    } catch (error) {
      console.error('Error fetching from cloud:', error)
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
      const expenseDoc = await getDoc(expenseRef)
      
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
      
      if (!expenseDoc.exists()) {
        // Create new document
        await setDoc(expenseRef, expenseData)
        console.log('✅ Created new expense document in Firebase')
      } else {
        // Update existing document
        await updateDoc(expenseRef, {
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          updatedAt: Timestamp.now(),
          userId: expense.userId
        })
        console.log('✅ Updated existing expense document in Firebase')
      }
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
    } catch (error) {
      console.error('Error in full sync:', error)
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
}

export const syncService = new SyncService()
