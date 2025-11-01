import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db as firestoreDb } from '../config/firebase'
import { type CurrencyCode, detectCurrencyFromLocale } from '../utils/currency'

interface UserPreferences {
  currency: CurrencyCode
  updatedAt: number
}

class UserPreferencesService {
  // Get user preferences from Firestore
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const prefsRef = doc(firestoreDb, 'userPreferences', userId)
      const prefsDoc = await getDoc(prefsRef)

      if (prefsDoc.exists()) {
        const data = prefsDoc.data()
        return {
          currency: data.currency as CurrencyCode,
          updatedAt: data.updatedAt instanceof Timestamp 
            ? data.updatedAt.toMillis() 
            : data.updatedAt
        }
      }

      return null
    } catch (error) {
      console.error('Error getting user preferences:', error)
      throw error
    }
  }

  // Save user preferences to Firestore
  async savePreferences(userId: string, currency: CurrencyCode): Promise<void> {
    try {
      const prefsRef = doc(firestoreDb, 'userPreferences', userId)
      await setDoc(prefsRef, {
        currency,
        updatedAt: Timestamp.now()
      }, { merge: true })
    } catch (error) {
      console.error('Error saving user preferences:', error)
      throw error
    }
  }

  // Get currency preference (with fallback)
  async getCurrency(userId: string | null): Promise<CurrencyCode> {
    if (!userId) {
      // No user logged in, detect from browser
      return detectCurrencyFromLocale()
    }

    try {
      const preferences = await this.getPreferences(userId)
      if (preferences?.currency) {
        return preferences.currency
      }
    } catch (error) {
      console.error('Error loading currency preference:', error)
      // Fall through to browser detection
    }

    // Fallback to browser detection if no preference saved
    return detectCurrencyFromLocale()
  }

  // Update currency preference
  async setCurrency(userId: string, currency: CurrencyCode): Promise<void> {
    try {
      await this.savePreferences(userId, currency)
    } catch (error) {
      console.error('Error setting currency preference:', error)
      throw error
    }
  }
}

export const userPreferencesService = new UserPreferencesService()
