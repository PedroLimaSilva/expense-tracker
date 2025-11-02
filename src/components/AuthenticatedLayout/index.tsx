import { Outlet, useLocation } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { useTimeWindow } from '../../contexts/TimeWindowContext'
import { NavBar } from '../NavBar'
import { TimeWindowSelector } from '../TimeWindowSelector'
import { PullToRefresh } from '../PullToRefresh'
import './index.scss'

export function AuthenticatedLayout() {
  const { loading, online, syncData } = useData()
  const location = useLocation()
  const { timeWindow, setTimeWindow } = useTimeWindow()

  // Show time window selector only on Overview, Income, and Expenses pages (not Categories or Settings)
  const showTimeWindow = ['/overview', '/', '/income', '/expenses'].includes(location.pathname)

  if (loading) {
    return (
      <div className="authenticated-layout">
        <NavBar online={online} />
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
      <NavBar online={online} />
      <PullToRefresh onRefresh={syncData} enabled={online} disabled={loading}>
        <main className="authenticated-main">
          <Outlet />
        </main>
      </PullToRefresh>
      {showTimeWindow && (
        <div className="time-window-container">
          <TimeWindowSelector value={timeWindow} onChange={setTimeWindow} />
        </div>
      )}
    </div>
  )
}
