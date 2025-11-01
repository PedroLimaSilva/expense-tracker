import { useCurrency } from '../contexts/CurrencyContext'
import { CURRENCIES, type CurrencyCode } from '../utils/currency'
import './CurrencySelector.scss'

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()

  return (
    <div className="currency-selector">
      <label htmlFor="currency-select" className="currency-label">
        Currency:
      </label>
      <select
        id="currency-select"
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        className="currency-select"
        title="Select currency"
      >
        {Object.values(CURRENCIES).map((curr) => (
          <option key={curr.code} value={curr.code}>
            {curr.code} - {curr.name} ({curr.symbol})
          </option>
        ))}
      </select>
    </div>
  )
}
