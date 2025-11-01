import { db as indexedDb } from '../db/indexeddb'
import { syncService } from './syncService'
import { type Expense, type  ExpenseFormData } from '../types/expense'

class ExpenseService {
  // Create a new expense
  async createExpense(userId: string, data: ExpenseFormData): Promise<Expense> {
    const now = Date.now()
    const expense: Expense = {
      id: `exp_${now}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      createdAt: now,
      updatedAt: now,
      synced: false,
      userId
    }

    // Save to IndexedDB first (offline-first)
    await indexedDb.expenses.add(expense)

    // Try to sync to cloud (will fail silently if offline)
    try {
      await syncService.saveToCloud(expense)
      await indexedDb.expenses.update(expense.id, { synced: true })
      console.log('✅ Expense synced to Firebase:', expense.id)
    } catch (error) {
      console.error('❌ Error syncing new expense to Firebase:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      // Expense is already saved locally, will sync later
    }

    return expense
  }

  // Update an existing expense
  async updateExpense(expense: Expense): Promise<void> {
    const updatedExpense: Expense = {
      ...expense,
      updatedAt: Date.now(),
      synced: false
    }

    // Update in IndexedDB
    await indexedDb.expenses.update(expense.id, updatedExpense)

    // Try to sync to cloud
    try {
      await syncService.saveToCloud(updatedExpense)
      await indexedDb.expenses.update(expense.id, { synced: true })
    } catch (error) {
      console.error('Error syncing updated expense:', error)
      // Expense is already updated locally, will sync later
    }
  }

  // Delete an expense
  async deleteExpense(expenseId: string): Promise<void> {
    // Delete from IndexedDB first
    await indexedDb.expenses.delete(expenseId)

    // Try to delete from cloud
    try {
      await syncService.deleteFromCloud(expenseId)
    } catch (error) {
      console.error('Error deleting expense from cloud:', error)
      // Expense is already deleted locally
    }
  }

  // Get all expenses for a user
  async getExpenses(userId: string): Promise<Expense[]> {
    return await indexedDb.expenses
      .where('userId')
      .equals(userId)
      .sortBy('date')
      .then(expenses => expenses.reverse()) // Most recent first
  }

  // Get expense by ID
  async getExpenseById(expenseId: string): Promise<Expense | undefined> {
    return await indexedDb.expenses.get(expenseId)
  }

  // Get expenses by category
  async getExpensesByCategory(userId: string, category: string): Promise<Expense[]> {
    return await indexedDb.expenses
      .where('userId')
      .equals(userId)
      .and(expense => expense.category === category)
      .sortBy('date')
      .then(expenses => expenses.reverse())
  }

  // Get expenses by date range
  async getExpensesByDateRange(userId: string, startDate: string, endDate: string): Promise<Expense[]> {
    const allExpenses = await this.getExpenses(userId)
    return allExpenses.filter(
      expense => expense.date >= startDate && expense.date <= endDate
    )
  }
}

export const expenseService = new ExpenseService()
