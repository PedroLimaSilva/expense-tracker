export type TimeWindow = 'day' | 'week' | 'month' | 'year'

export interface DateFilterable {
  date: string // ISO date string (YYYY-MM-DD)
}

/**
 * Formats a time window heading showing the current period
 */
export function formatTimeWindowHeading(timeWindow: TimeWindow, locale: string = 'en-US'): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (timeWindow) {
    case 'day':
      return today.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })

    case 'week':
      // Get start of current week (Sunday)
      const dayOfWeek = now.getDay()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - dayOfWeek)
      console.log('weekStart', weekStart)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      console.log('weekEnd', weekEnd)
      
      // If week spans same month, format as "2-7 November 2025"
      if (weekStart.getMonth() === weekEnd.getMonth() && weekStart.getFullYear() === weekEnd.getFullYear()) {
        const startDay = weekStart.toLocaleDateString(locale, { day: 'numeric' })
        const endDay = weekEnd.toLocaleDateString(locale, { day: 'numeric' })
        const monthYear = weekEnd.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
        return `${startDay}-${endDay} ${monthYear}`
      } else {
        // Week spans multiple months
        const startFormatted = weekStart.toLocaleDateString(locale, { day: 'numeric', month: 'long' })
        const endFormatted = weekEnd.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
        return `${startFormatted} - ${endFormatted}`
      }

    case 'month':
      return now.toLocaleDateString(locale, { month: 'long', year: 'numeric' })

    case 'year':
      return now.toLocaleDateString(locale, { year: 'numeric' })

    default:
      return ''
  }
}

/**
 * Filters an array of items by a time window based on their date field
 */
export function filterByTimeWindow<T extends DateFilterable>(
  items: T[],
  timeWindow: TimeWindow
): T[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let startDate: Date
  let endDate: Date

  switch (timeWindow) {
    case 'day':
      startDate = new Date(today)
      startDate.setHours(0, 0, 0, 0) // Start of today
      endDate = new Date(today)
      endDate.setHours(23, 59, 59, 999) // End of today
      break

    case 'week':
      // Get start of current week (Sunday) and end of week (Saturday)
      const dayOfWeek = now.getDay()
      startDate = new Date(today)
      startDate.setDate(today.getDate() - dayOfWeek)
      startDate.setHours(0, 0, 0, 0)
      
      // End of week is Saturday (6 days after Sunday)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
      break

    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      startDate.setHours(0, 0, 0, 0)
      
      // End of month is the last day of the current month
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      endDate.setHours(23, 59, 59, 999)
      break

    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      startDate.setHours(0, 0, 0, 0)
      
      // End of year is December 31st
      endDate = new Date(now.getFullYear(), 11, 31)
      endDate.setHours(23, 59, 59, 999)
      break

    default:
      return items
  }

  return items.filter((item) => {
    // Parse the date string (YYYY-MM-DD) as local date
    const [year, month, day] = item.date.split('-').map(Number)
    const itemDate = new Date(year, month - 1, day)
    
    // Compare dates by normalizing to start of day
    const itemDateStart = new Date(itemDate)
    itemDateStart.setHours(0, 0, 0, 0)
    
    return itemDateStart >= startDate && itemDateStart <= endDate
  })
}
