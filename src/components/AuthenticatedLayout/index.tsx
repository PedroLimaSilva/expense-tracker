import { Outlet, useLocation } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { useTimeWindow } from '../../contexts/TimeWindowContext'
import { NavBar } from '../NavBar'
import { TimeWindowSelector } from '../TimeWindowSelector'
import './index.scss'

export function AuthenticatedLayout() {
  const { loading, syncing, online, syncData } = useData()
  const location = useLocation()
  const { timeWindow, setTimeWindow } = useTimeWindow()

  // Show time window selector only on Overview, Income, and Expenses pages (not Categories or Settings)
  const showTimeWindow = ['/overview', '/', '/income', '/expenses'].includes(location.pathname)

  if (loading) {
    return (
      <div className="authenticated-layout">
        <NavBar onSync={syncData} syncing={syncing} online={online} />
        <div className="loading">
          <div className="loading-message">Loading...</div>
        </div>
        {showTimeWindow && (
          <div className="time-window-container">
            <TimeWindowSelector value={timeWindow} onChange={setTimeWindow} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="authenticated-layout">
      <NavBar onSync={syncData} syncing={syncing} online={online} />
      <main className="authenticated-main">
        <Outlet />
      </main>
      {showTimeWindow && (
        <div className="time-window-container">
          <TimeWindowSelector value={timeWindow} onChange={setTimeWindow} />
        </div>
      )}
    </div>
  )
}
