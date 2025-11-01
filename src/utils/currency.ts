// Common currencies with their display names
export const CURRENCIES = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  CHF: { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  CNY: { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  BRL: { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  MXN: { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  ZAR: { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  KRW: { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  SEK: { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  NOK: { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  DKK: { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  PLN: { code: 'PLN', name: 'Polish Złoty', symbol: 'zł' },
  TRY: { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  RUB: { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  ARS: { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
  TWD: { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
} as const

export type CurrencyCode = keyof typeof CURRENCIES

// Map locale/region to currency
const LOCALE_TO_CURRENCY: Record<string, CurrencyCode> = {
  'en-US': 'USD',
  'en-GB': 'GBP',
  'en-CA': 'CAD',
  'en-AU': 'AUD',
  'en-SG': 'SGD',
  'en-HK': 'HKD',
  'en-IN': 'INR',
  'en-ZA': 'ZAR',
  'de-DE': 'EUR',
  'de-AT': 'EUR',
  'de-CH': 'CHF',
  'fr-FR': 'EUR',
  'fr-BE': 'EUR',
  'fr-CH': 'CHF',
  'fr-CA': 'CAD',
  'es-ES': 'EUR',
  'es-MX': 'MXN',
  'es-AR': 'ARS',
  'pt-BR': 'BRL',
  'pt-PT': 'EUR',
  'it-IT': 'EUR',
  'nl-NL': 'EUR',
  'nl-BE': 'EUR',
  'pl-PL': 'PLN',
  'sv-SE': 'SEK',
  'no-NO': 'NOK',
  'da-DK': 'DKK',
  'fi-FI': 'EUR',
  'ru-RU': 'RUB',
  'tr-TR': 'TRY',
  'zh-CN': 'CNY',
  'zh-TW': 'TWD',
  'ja-JP': 'JPY',
  'ko-KR': 'KRW',
  'hi-IN': 'INR',
}

// Detect default currency from browser locale
export function detectCurrencyFromLocale(): CurrencyCode {
  try {
    // Get browser locale
    const locale = navigator.language || navigator.languages?.[0] || 'en-US'
    
    // Try exact match first
    if (LOCALE_TO_CURRENCY[locale]) {
      return LOCALE_TO_CURRENCY[locale]
    }
    
    // Try with region code (e.g., 'en-US' -> try 'en-US')
    const parts = locale.split('-')
    if (parts.length >= 2) {
      const regionLocale = `${parts[0]}-${parts[1]}`
      if (LOCALE_TO_CURRENCY[regionLocale]) {
        return LOCALE_TO_CURRENCY[regionLocale]
      }
    }
    
    // Fallback to USD
    return 'USD'
  } catch (error) {
    console.error('Error detecting currency from locale:', error)
    return 'USD'
  }
}

// Format amount with currency
export function formatCurrency(amount: number, currency: CurrencyCode, locale?: string): string {
  try {
    const useLocale = locale || navigator.language || 'en-US'
    return new Intl.NumberFormat(useLocale, {
      style: 'currency',
      currency
    }).format(amount)
  } catch (error) {
    console.error('Error formatting currency:', error)
    // Fallback formatting
    const currencyInfo = CURRENCIES[currency]
    return `${currencyInfo.symbol}${amount.toFixed(2)}`
  }
}

// Get currency from localStorage or detect from browser
export function getSavedCurrency(): CurrencyCode {
  try {
    const saved = localStorage.getItem('expense-tracker-currency')
    if (saved && saved in CURRENCIES) {
      return saved as CurrencyCode
    }
  } catch (error) {
    console.error('Error reading saved currency:', error)
  }
  
  return detectCurrencyFromLocale()
}

// Save currency to localStorage
export function saveCurrency(currency: CurrencyCode): void {
  try {
    localStorage.setItem('expense-tracker-currency', currency)
  } catch (error) {
    console.error('Error saving currency:', error)
  }
}
