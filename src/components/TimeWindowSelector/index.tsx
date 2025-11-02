import { type TimeWindow } from '../../utils/dateFilter'
import './index.scss'

interface TimeWindowSelectorProps {
  value: TimeWindow
  onChange: (window: TimeWindow) => void
  locale?: string
}

export function TimeWindowSelector({ value, onChange, locale: _locale }: TimeWindowSelectorProps) {
  const options: Array<{ value: TimeWindow; label: string }> = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' }
  ]

  return (
    <div className="time-window-selector">
      <div className="time-window-content">
        <label className="time-window-label">Time Window:</label>
        <div className="time-window-buttons">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`time-window-btn ${value === option.value ? 'active' : ''}`}
              onClick={() => onChange(option.value)}
              title={`View ${option.label.toLowerCase()} data`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
