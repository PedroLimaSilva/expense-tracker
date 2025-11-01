import { db as indexedDb } from '../db/indexeddb'
import { syncService } from './syncService'
import { type Income, type IncomeFormData } from '../types/income'

class IncomeService {
  // Create a new income entry
  async createIncome(userId: string, data: IncomeFormData): Promise<Income> {
    const now = Date.now()
    const income: Income = {
      id: `inc_${now}_${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      createdAt: now,
      updatedAt: now,
      synced: false,
      userId
    }

    // Save to IndexedDB first (offline-first)
    await indexedDb.income.add(income)

    // Try to sync to cloud (will fail silently if offline)
    try {
      await syncService.saveIncomeToCloud(income)
      await indexedDb.income.update(income.id, { synced: true })
      console.log('✅ Income synced to Firebase:', income.id)
    } catch (error) {
      console.error('❌ Error syncing new income to Firebase:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      // Income is already saved locally, will sync later
    }

    return income
  }

  // Update an existing income entry
  async updateIncome(income: Income): Promise<void> {
    const updatedIncome: Income = {
      ...income,
      updatedAt: Date.now(),
      synced: false
    }

    // Update in IndexedDB
    await indexedDb.income.update(income.id, updatedIncome)

    // Try to sync to cloud
    try {
      await syncService.saveIncomeToCloud(updatedIncome)
      await indexedDb.income.update(income.id, { synced: true })
    } catch (error) {
      console.error('Error syncing updated income:', error)
      // Income is already updated locally, will sync later
    }
  }

  // Delete an income entry
  async deleteIncome(incomeId: string): Promise<void> {
    // Delete from IndexedDB first
    await indexedDb.income.delete(incomeId)

    // Try to delete from cloud
    try {
      await syncService.deleteIncomeFromCloud(incomeId)
    } catch (error) {
      console.error('Error deleting income from cloud:', error)
      // Income is already deleted locally
    }
  }

  // Get all income entries for a user
  async getIncome(userId: string): Promise<Income[]> {
    return await indexedDb.income
      .where('userId')
      .equals(userId)
      .sortBy('date')
      .then(income => income.reverse()) // Most recent first
  }

  // Get income by ID
  async getIncomeById(incomeId: string): Promise<Income | undefined> {
    return await indexedDb.income.get(incomeId)
  }

  // Get income by category
  async getIncomeByCategory(userId: string, category: string): Promise<Income[]> {
    return await indexedDb.income
      .where('userId')
      .equals(userId)
      .and(income => income.category === category)
      .sortBy('date')
      .then(income => income.reverse())
  }

  // Get income by date range
  async getIncomeByDateRange(userId: string, startDate: string, endDate: string): Promise<Income[]> {
    const allIncome = await this.getIncome(userId)
    return allIncome.filter(
      income => income.date >= startDate && income.date <= endDate
    )
  }
}

export const incomeService = new IncomeService()
