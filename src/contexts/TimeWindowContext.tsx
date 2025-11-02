import { createContext, useContext, useState, type ReactNode } from 'react'
import { type TimeWindow } from '../utils/dateFilter'

interface TimeWindowContextType {
  timeWindow: TimeWindow
  setTimeWindow: (window: TimeWindow) => void
}

const TimeWindowContext = createContext<TimeWindowContextType | undefined>(undefined)

export function TimeWindowProvider({ children }: { children: ReactNode }) {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('month')

  return (
    <TimeWindowContext.Provider value={{ timeWindow, setTimeWindow }}>
      {children}
    </TimeWindowContext.Provider>
  )
}

export function useTimeWindow() {
  const context = useContext(TimeWindowContext)
  if (context === undefined) {
    throw new Error('useTimeWindow must be used within a TimeWindowProvider')
  }
  return context
}
