import Dexie, { type Table } from 'dexie'
import { type Expense } from '../types/expense'

export class ExpenseDatabase extends Dexie {
  expenses!: Table<Expense, string>

  constructor() {
    super('ExpenseTrackerDB')
    this.version(1).stores({
      expenses: 'id, userId, date, synced, createdAt'
    })
  }
}

export const db = new ExpenseDatabase()
