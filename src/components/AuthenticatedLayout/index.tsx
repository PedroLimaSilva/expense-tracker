import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { useTimeWindow } from '../../contexts/TimeWindowContext'
import { NavBar } from '../NavBar'
import { TimeWindowSelector } from '../TimeWindowSelector'
import { PullToRefresh } from '../PullToRefresh'
import { SettingsPanel } from '../SettingsPanel'
import './index.scss'

export function AuthenticatedLayout() {
  const { loading, online, syncData } = useData()
  const location = useLocation()
  const { timeWindow, setTimeWindow } = useTimeWindow()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Show time window selector only on Overview, Income, and Expenses pages (not Categories or Settings)
  const showTimeWindow = ['/overview', '/', '/income', '/expenses'].includes(location.pathname)

  if (loading) {
    return (
      <div className="authenticated-layout">
        <NavBar online={online} onOpenSettings={() => setIsSettingsOpen(true)} />
        <div className="loading">
          <div className="loading-message">Loading...</div>
        </div>
        {showTimeWindow && (
          <div className="time-window-container">
            <TimeWindowSelector value={timeWindow} onChange={setTimeWindow} />
          </div>
        )}
        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </div>
    )
  }

  return (
    <div className="authenticated-layout">
      <NavBar online={online} onOpenSettings={() => setIsSettingsOpen(true)} />
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
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}
