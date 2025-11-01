import Dexie, { type Table } from 'dexie'
import { type Expense } from '../types/expense'
import { type Income } from '../types/income'

export class ExpenseDatabase extends Dexie {
  expenses!: Table<Expense, string>
  income!: Table<Income, string>

  constructor() {
    super('ExpenseTrackerDB')
    this.version(2).stores({
      expenses: 'id, userId, date, synced, createdAt',
      income: 'id, userId, date, synced, createdAt'
    })
  }
}

export const db = new ExpenseDatabase()
