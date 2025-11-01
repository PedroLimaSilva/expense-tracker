import Dexie, { type Table } from 'dexie'
import { type Expense } from '../types/expense'
import { type Income } from '../types/income'
import { type Category } from '../types/category'

export class ExpenseDatabase extends Dexie {
  expenses!: Table<Expense, string>
  income!: Table<Income, string>
  categories!: Table<Category, string>

  constructor() {
    super('ExpenseTrackerDB')
    this.version(3).stores({
      expenses: 'id, userId, date, synced, createdAt',
      income: 'id, userId, date, synced, createdAt',
      categories: 'id, userId, type, synced, createdAt'
    })
  }
}

export const db = new ExpenseDatabase()
